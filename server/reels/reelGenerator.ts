import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { layoutReel } from "../../src/reels/layout.js";
import { applyOverrides, isStyleId, STYLES, type StyleOverrides } from "../../src/reels/styles.js";
import type { RenderProgress } from "../../src/reels/types.js";
import { isAllowedMusicUrl, resolveLocalTrackPath } from "./music/index.js";
import { narrationText } from "./narrationText.js";
import { isAllowedVideoUrl } from "./providers/index.js";
import { rasterizeLayers } from "./rasterize.js";
import type { VideoRenderService } from "./render/index.js";
import { serverMeasurer } from "./serverFonts.js";
import { clampRate, resolveNarration } from "./tts/index.js";

// ─── ReelGeneratorService ─────────────────────────────────────────────────────
// Orquestra o fluxo inteiro. Não sabe nada sobre HTTP nem sobre qual FFmpeg
// está sendo usado — recebe o VideoRenderService pronto.

export const MIN_DURATION_SEC = 8;
export const MAX_DURATION_SEC = 30;
export const DEFAULT_DURATION_SEC = 15;

/** Acima disso o texto não cabe de forma legível em nenhum estilo. */
const MAX_VERSE_CHARS = 600;
const MAX_REFERENCE_CHARS = 80;

/** Volume padrão da trilha quando há narração por cima. */
const DEFAULT_MUSIC_GAIN = 0.22;

/** Teto para o clipe baixado. Protege memória, disco e o tempo da função. */
const MAX_SOURCE_BYTES = 120 * 1024 * 1024;

export interface NarrationRequest {
  enabled: boolean;
  voiceId?: string;
  rate?: number;
  /** Ler a referência bíblica em voz alta depois do versículo. */
  includeReference?: boolean;
}

export interface GenerateRequest {
  verseText: string;
  reference: string;
  styleId: string;
  overrides?: StyleOverrides;
  video: {
    downloadUrl: string;
    /** Arquivo leve, usado quando o principal passa do teto de tamanho. */
    previewUrl?: string;
  };
  durationSec?: number;
  brandingText?: string;
  motion?: boolean;
  narration?: NarrationRequest;
  music?: {
    /** URL da faixa, de um provedor permitido, ou vazio para não usar trilha. */
    trackUrl?: string;
    /** Volume da trilha, 0–1. */
    gain?: number;
  };
  /** Tag BCP-47; decide como a referência é lida em voz alta. */
  language?: string;
  /** "verse" lê a referência como capítulo/versículo; "quote" lê o autor. */
  contentType?: "verse" | "quote";
}

export class ValidationError extends Error {}

interface ValidatedRequest {
  verseText: string;
  reference: string;
  styleId: string;
  overrides: StyleOverrides;
  downloadUrl: string;
  previewUrl: string | null;
  durationSec: number;
  brandingText: string;
  motion: boolean;
  narration: Required<NarrationRequest>;
  musicUrl: string | null;
  musicGain: number;
  language: string;
  contentType: "verse" | "quote";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function validate(request: GenerateRequest): ValidatedRequest {
  const verseText = String(request.verseText ?? "").trim();
  if (!verseText) throw new ValidationError("Informe o texto do versículo.");
  if (verseText.length > MAX_VERSE_CHARS) {
    throw new ValidationError(
      `O versículo tem ${verseText.length} caracteres; o limite é ${MAX_VERSE_CHARS}. ` +
        `Textos maiores que isso não cabem de forma legível num Reel.`,
    );
  }

  const reference = String(request.reference ?? "").trim().slice(0, MAX_REFERENCE_CHARS);

  if (!isStyleId(request.styleId)) {
    throw new ValidationError(`Estilo desconhecido: ${request.styleId}`);
  }

  // Sem esta checagem a rota baixaria qualquer URL que lhe mandassem, virando
  // um proxy de download aberto a partir do nosso servidor.
  if (!isAllowedVideoUrl(request.video?.downloadUrl ?? "")) {
    throw new ValidationError("A URL do vídeo não é de um provedor permitido.");
  }

  const previewUrl = request.video.previewUrl;
  const validPreview = previewUrl && isAllowedVideoUrl(previewUrl) ? previewUrl : null;

  return {
    verseText,
    reference,
    styleId: request.styleId,
    overrides: request.overrides ?? {},
    downloadUrl: request.video.downloadUrl,
    previewUrl: validPreview,
    durationSec: clamp(
      Number(request.durationSec) || DEFAULT_DURATION_SEC,
      MIN_DURATION_SEC,
      MAX_DURATION_SEC,
    ),
    brandingText: String(request.brandingText ?? "Bíblia Online").trim().slice(0, 40),
    motion: request.motion !== false,
    narration: {
      // Narração é opt-in: sem o campo, o vídeo sai mudo como antes.
      enabled: request.narration?.enabled === true,
      voiceId: String(request.narration?.voiceId ?? ""),
      rate: clampRate(Number(request.narration?.rate)),
      includeReference: request.narration?.includeReference === true,
    },
    // Mesma proteção da URL do vídeo: sem o allowlist, a rota baixaria
    // qualquer coisa que lhe mandassem.
    musicUrl:
      request.music?.trackUrl && isAllowedMusicUrl(request.music.trackUrl)
        ? request.music.trackUrl
        : null,
    musicGain: clamp(Number(request.music?.gain ?? DEFAULT_MUSIC_GAIN), 0, 1),
    language: String(request.language ?? "pt-BR"),
    contentType: request.contentType === "quote" ? "quote" : "verse",
  };
}

/**
 * Baixa o clipe para `destination`, recusando arquivos acima do teto.
 *
 * O teto é conferido durante a transferência, e não só pelo content-length:
 * alguns CDNs não mandam esse cabeçalho, e sem a checagem contínua um arquivo
 * enorme encheria o disco temporário antes de alguém perceber.
 */
async function download(url: string, destination: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Falha ao baixar o vídeo (${res.status}).`);
  }

  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_SOURCE_BYTES) {
    throw new Error(`Vídeo grande demais: ${Math.round(declared / 1024 / 1024)}MB.`);
  }

  const file = createWriteStream(destination);
  const reader = res.body.getReader();
  let received = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      received += value.byteLength;
      if (received > MAX_SOURCE_BYTES) {
        throw new Error(`Vídeo passou de ${MAX_SOURCE_BYTES / 1024 / 1024}MB durante o download.`);
      }

      // `write` devolve false quando o buffer encheu: esperar o "drain" evita
      // acumular o arquivo inteiro em memória.
      if (!file.write(value)) await once(file, "drain");
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    file.end();
  }

  await once(file, "close");
}

/**
 * Gera o Reel e devolve o MP4 em memória.
 *
 * `onProgress` é chamado ao longo de todas as etapas; a de renderização
 * reporta percentual real, vindo do `-progress` do FFmpeg.
 */
export async function generateReel(
  request: GenerateRequest,
  renderer: VideoRenderService,
  onProgress: (progress: RenderProgress) => void,
): Promise<Buffer> {
  const input = validate(request);

  onProgress({ stage: "preparing" });

  const style = applyOverrides(STYLES[input.styleId as keyof typeof STYLES], input.overrides);

  onProgress({ stage: "composing" });
  const layout = layoutReel(
    {
      verseText: input.verseText,
      reference: input.reference,
      style,
      brandingText: input.brandingText,
      durationSec: input.durationSec,
    },
    serverMeasurer(),
  );

  onProgress({ stage: "typesetting" });
  const layers = rasterizeLayers(layout);

  const dir = await mkdtemp(join(tmpdir(), "reel-src-"));
  try {
    // ── Narração ──────────────────────────────────────────────────────────
    // Uma falha aqui NÃO derruba o render: o vídeo sai mudo e o aviso vai para
    // o log. Perder a voz é bem melhor do que perder o vídeo inteiro depois de
    // o usuário ter esperado o download e a composição.
    let narrationPath: string | null = null;

    if (input.narration.enabled) {
      onProgress({ stage: "narrating" });
      const text = narrationText({
        verseText: input.verseText,
        reference: input.reference,
        includeReference: input.narration.includeReference,
        language: input.language,
        contentType: input.contentType,
      });

      try {
        const narration = await resolveNarration(
          text,
          input.narration.voiceId,
          input.narration.rate,
        );
        narrationPath = join(dir, `narration.${narration.extension}`);
        await writeFile(narrationPath, narration.audio);
      } catch (error) {
        console.warn("reels: seguindo sem narração —", (error as Error).message);
        narrationPath = null;
      }
    }

    // ── Trilha ────────────────────────────────────────────────────────────
    // Também não derruba o render: sem música, o vídeo sai só com a narração.
    let musicPath: string | null = null;

    if (input.musicUrl) {
      onProgress({ stage: "fetchingMusic" });
      try {
        // Arquivo da pasta local é lido direto do disco, sem passar por HTTP.
        const localPath = resolveLocalTrackPath(input.musicUrl);
        if (localPath) {
          musicPath = localPath;
        } else {
          musicPath = join(dir, "music.mp3");
          await download(input.musicUrl, musicPath);
        }
      } catch (error) {
        console.warn("reels: seguindo sem trilha —", (error as Error).message);
        musicPath = null;
      }
    }

    onProgress({ stage: "fetchingVideo" });
    const backgroundPath = join(dir, "background.mp4");

    try {
      await download(input.downloadUrl, backgroundPath);
    } catch (error) {
      // O arquivo em resolução máxima pode ser grande demais ou estar fora do
      // ar. O de preview é o mesmo clipe em resolução menor: melhor entregar o
      // Reel com um fundo 720p do que não entregar nada.
      if (!input.previewUrl) throw error;
      console.warn("reels: caindo para o arquivo de preview —", (error as Error).message);
      await download(input.previewUrl, backgroundPath);
    }

    onProgress({ stage: "rendering", pct: 0 });
    // A conclusão é sinalizada pela promessa resolvendo. Emitir "done" aqui
    // também faria o stream ter dois eventos com esse nome e significados
    // diferentes — só a rota emite o "done" final, que carrega o tamanho.
    return await renderer.render(
      {
        backgroundPath,
        layers,
        durationSec: input.durationSec,
        width: layout.width,
        height: layout.height,
        motion: input.motion,
        narrationPath,
        musicPath,
        musicGain: input.musicGain,
      },
      onProgress,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
