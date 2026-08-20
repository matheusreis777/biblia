import type { ReelVideo } from "../../../src/reels/types.js";

// ─── Contrato dos provedores de vídeo ─────────────────────────────────────────
// Adicionar um provedor novo = implementar esta interface e incluí-lo no array
// de PROVIDERS em ./index.ts. Nada mais no sistema precisa mudar.

export interface SearchOptions {
  /** Quantos clipes devolver, no máximo. */
  limit: number;
  /** Página, para "carregar mais" na galeria. Começa em 1. */
  page: number;
  /** Duração mínima aceitável do clipe, em segundos. */
  minDurationSec: number;
}

export interface VideoProvider {
  readonly id: string;
  /** Nome exibido no crédito, na interface. */
  readonly label: string;

  /**
   * `false` quando falta configuração (tipicamente a chave de API).
   * A cadeia de fallback pula provedores indisponíveis em silêncio, em vez de
   * deixar a requisição falhar.
   */
  isAvailable(): boolean;

  search(query: string, options: SearchOptions): Promise<ReelVideo[]>;
}

// ─── Critérios de qualidade ───────────────────────────────────────────────────
// Aplicados a TODO provedor, em ./index.ts. Um clipe que não passa aqui não
// chega na galeria — é o que impede o resultado de parecer amador.

/** Abaixo disso o upscale para 1080x1920 fica visivelmente borrado. */
export const MIN_HEIGHT = 1280;

/** Precisa ser mais alto que largo — nada de paisagem cortada na marra. */
export const MAX_ASPECT_RATIO = 0.85;

/** Clipe curto demais fica com loop perceptível num Reel de 15s. */
export const MIN_DURATION_SEC = 6;

export function isUsable(video: ReelVideo, minDurationSec = MIN_DURATION_SEC): boolean {
  if (video.height < MIN_HEIGHT) return false;
  if (video.width / video.height > MAX_ASPECT_RATIO) return false;
  if (video.durationSec < minDurationSec) return false;
  return Boolean(video.downloadUrl && video.thumbUrl);
}

/** Duração alvo do Reel. Clipes a partir disso rodam sem emenda visível. */
export const TARGET_DURATION_SEC = 15;

/** Altura em que o Reel é renderizado. */
export const TARGET_HEIGHT = 1920;

/** Um arquivo de vídeo devolvido por um provedor. */
export interface ProviderFile {
  url: string;
  width: number;
  height: number;
}

/**
 * Escolhe o arquivo que vai para o render: o MENOR que ainda tenha altura
 * suficiente para 1080x1920.
 *
 * Pegar o maior seria intuitivo e é a escolha errada. Boa parte do acervo tem
 * versão 4K (2160x3840), e baixá-la para depois reduzir a 1080x1920 custa
 * quatro vezes mais banda e tempo — medido: 54s de render com fonte 4K contra
 * 7s com fonte 1080x1920 — em troca de um ganho de nitidez que a recompressão
 * do Instagram apaga de qualquer jeito.
 */
export function pickRenderFile(files: ProviderFile[]): ProviderFile | null {
  if (files.length === 0) return null;

  const bigEnough = files
    .filter((f) => f.height >= TARGET_HEIGHT)
    .sort((a, b) => a.height - b.height);

  // Sem nenhum na altura alvo, o maior disponível é o melhor que dá.
  return bigEnough[0] ?? [...files].sort((a, b) => b.height - a.height)[0];
}

/** Arquivo leve para o preview no browser: o maior até 720p de altura. */
export function pickPreviewFile(files: ProviderFile[]): ProviderFile | null {
  if (files.length === 0) return null;
  const light = files.filter((f) => f.height <= 1280).sort((a, b) => b.height - a.height);
  return light[0] ?? [...files].sort((a, b) => a.height - b.height)[0];
}

/**
 * Ordena preferindo o que renderiza melhor.
 *
 * O primeiro critério é a duração: um clipe mais curto que o Reel precisa ser
 * repetido em loop, e o corte da emenda aparece. Depois vem a proporção mais
 * próxima de 9:16 e, por fim, a resolução.
 */
export function rankVideos(videos: ReelVideo[]): ReelVideo[] {
  const target = 9 / 16;
  return [...videos].sort((a, b) => {
    const longEnoughA = a.durationSec >= TARGET_DURATION_SEC;
    const longEnoughB = b.durationSec >= TARGET_DURATION_SEC;
    if (longEnoughA !== longEnoughB) return longEnoughA ? -1 : 1;

    const aspectA = Math.abs(a.width / a.height - target);
    const aspectB = Math.abs(b.width / b.height - target);
    if (Math.abs(aspectA - aspectB) > 0.02) return aspectA - aspectB;

    return b.height - a.height;
  });
}
