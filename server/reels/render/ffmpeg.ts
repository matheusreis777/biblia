import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TIMING, ZOOM_AMOUNT } from "../../../src/reels/timing.js";
import type { RenderProgress } from "../../../src/reels/types.js";
import type { EncodeProfile, RenderJob } from "./types.js";

// ─── Pipeline FFmpeg ──────────────────────────────────────────────────────────
// Compartilhada pelas duas implementações de VideoRenderService: só o caminho
// do binário e o perfil de codificação mudam entre local e serverless.
//
// Os tempos da animação vêm de src/reels/timing.ts, os mesmos que o preview no
// browser usa nas animações CSS.

/** Alvo de loudness das redes sociais, em LUFS. */
const LOUDNESS_TARGET = -16;

/** Taxa de amostragem de todo o áudio da saída. */
const AUDIO_SAMPLE_RATE = 44100;

/** Entrada e saída da trilha, em segundos. */
const MUSIC_FADE_IN_SEC = 1.5;
const MUSIC_FADE_OUT_SEC = 2;

/**
 * Índices das entradas do FFmpeg.
 *
 * A camada `meta` e a narração são opcionais, então os índices variam conforme
 * o pedido — contar na mão dentro do filtro daria erro silencioso apontando
 * para a entrada errada.
 */
function inputIndexes(job: RenderJob) {
  let next = 0;
  const background = next++;
  const scrim = next++;
  const verse = next++;
  const meta = job.layers.meta ? next++ : null;
  const narration = job.narrationPath ? next++ : null;
  const music = job.musicPath ? next++ : null;
  return { background, scrim, verse, meta, narration, music };
}

function buildFilterGraph(job: RenderJob, profile: EncodeProfile): string {
  const { width, height, durationSec, motion } = job;
  const fps = profile.fps;
  const totalFrames = Math.max(1, Math.round(durationSec * fps));

  // Pré-escala acima da saída antes do zoompan: o zoompan trabalha em pixels
  // inteiros e, alimentado já no tamanho final, produz um "pulo" visível a cada
  // passo do zoom. Com folga de 50%, o passo cai abaixo do perceptível.
  const preW = Math.round(width * 1.5);
  const preH = Math.round(height * 1.5);

  const background = motion
    ? [
        `scale=${preW}:${preH}:force_original_aspect_ratio=increase`,
        `crop=${preW}:${preH}`,
        `zoompan=z='min(1+${(ZOOM_AMOUNT / totalFrames).toFixed(8)}*on,${1 + ZOOM_AMOUNT})'` +
          `:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'` +
          `:d=1:s=${width}x${height}:fps=${fps}`,
      ]
    : [
        `scale=${width}:${height}:force_original_aspect_ratio=increase`,
        `crop=${width}:${height}`,
        `fps=${fps}`,
      ];

  // Leve realce: as redes sociais recomprimem o vídeo e achatam o contraste.
  background.push("setsar=1", "eq=contrast=1.04:saturation=1.05");

  const input = inputIndexes(job);
  const parts: string[] = [`[${input.background}:v]${background.join(",")}[bg]`];

  parts.push(
    `[${input.scrim}:v]format=rgba,fade=t=in:st=0:d=${TIMING.scrimFadeIn}:alpha=1[scrim]`,
    `[${input.verse}:v]format=rgba,fade=t=in:st=${TIMING.verseStart}:d=${TIMING.verseFade}:alpha=1[verse]`,
  );

  parts.push(`[bg][scrim]overlay=0:0[withScrim]`);

  // O versículo sobe enquanto aparece: y vai de verseRisePx até 0 ao longo do
  // fade. `max(0,...)` evita valor negativo antes do início da animação.
  const riseExpr =
    `'${TIMING.verseRisePx}*(1-min(1,max(0,(t-${TIMING.verseStart})/${TIMING.verseFade})))'`;
  parts.push(`[withScrim][verse]overlay=0:${riseExpr}[withVerse]`);

  if (input.meta !== null) {
    parts.push(
      `[${input.meta}:v]format=rgba,fade=t=in:st=${TIMING.metaStart}:d=${TIMING.metaFade}:alpha=1[meta]`,
      `[withVerse][meta]overlay=0:0[out]`,
    );
  } else {
    parts.push(`[withVerse]null[out]`);
  }

  // ── Áudio ───────────────────────────────────────────────────────────────
  parts.push(...buildAudioGraph(job, input, durationSec));

  return parts.join(";");
}

/**
 * Monta o trecho de áudio do filter_complex.
 *
 * Três casos: só narração, só trilha, ou os dois com ducking.
 */
function buildAudioGraph(
  job: RenderJob,
  input: ReturnType<typeof inputIndexes>,
  durationSec: number,
): string[] {
  const parts: string[] = [];
  const hasVoice = input.narration !== null;
  const hasMusic = input.music !== null;
  if (!hasVoice && !hasMusic) return parts;

  if (hasVoice) {
    const delayMs = Math.round(TIMING.narrationStart * 1000);

    // A ordem importa: normalizar ANTES de atrasar e preencher. O loudnorm mede
    // o material inteiro, e se o silêncio do adelay/apad entrasse antes, ele
    // puxaria a medição para baixo e a voz sairia alta demais.
    //
    // O loudnorm reamostra internamente para 192kHz, daí o aresample logo em
    // seguida — sem ele o encoder recebe uma taxa que não é a declarada.
    parts.push(
      `[${input.narration}:a]` +
        `loudnorm=I=${LOUDNESS_TARGET}:TP=-1.5:LRA=11,` +
        `aresample=${AUDIO_SAMPLE_RATE},` +
        `adelay=${delayMs}:all=1,` +
        // Preenche com silêncio até o fim do vídeo; o `-t` da saída é quem
        // corta. Sem isso, a faixa acabaria junto com a fala.
        `apad` +
        `[voice]`,
    );
  }

  if (hasMusic) {
    const gain = Math.min(Math.max(job.musicGain, 0), 1);
    const fadeOutStart = Math.max(0, durationSec - MUSIC_FADE_OUT_SEC);

    // O `size` do aloop é medido em AMOSTRAS e o filtro as guarda todas na
    // memória. Um valor "grande o bastante" como INT32_MAX faria o FFmpeg
    // tentar bufferizar ~13 horas de áudio e travar consumindo GB de RAM
    // (acontecido, medido em 915MB e subindo). Bufferizar exatamente o que o
    // vídeo dura basta: numa faixa mais curta, isso é o suficiente para repetir
    // até o fim; numa mais longa, o `-t` corta antes de o loop acontecer.
    //
    // O aresample vem ANTES do aloop de propósito: assim o tamanho abaixo é em
    // amostras de 44100Hz, e não na taxa nativa da faixa, que é desconhecida.
    const loopSamples = Math.ceil(durationSec * AUDIO_SAMPLE_RATE);

    parts.push(
      `[${input.music}:a]` +
        `aresample=${AUDIO_SAMPLE_RATE},` +
        `aloop=loop=-1:size=${loopSamples},` +
        `volume=${gain.toFixed(3)},` +
        `afade=t=in:st=0:d=${MUSIC_FADE_IN_SEC},` +
        `afade=t=out:st=${fadeOutStart.toFixed(2)}:d=${MUSIC_FADE_OUT_SEC}` +
        `[bed]`,
    );
  }

  if (hasVoice && hasMusic) {
    // O sidechaincompress abaixa a música (entrada principal) sempre que a voz
    // (entrada de sidechain) soa. É o que evita as duas disputarem o mesmo
    // espaço — sem isso, ou a música cobre a narração, ou fica baixa demais o
    // tempo todo. A voz é duplicada com asplit porque serve de sidechain e
    // também entra na mixagem.
    parts.push(
      `[voice]asplit=2[voiceDuck][voiceMix]`,
      `[bed][voiceDuck]sidechaincompress=` +
        `threshold=0.03:ratio=12:attack=25:release=450:makeup=1[ducked]`,
      `[ducked][voiceMix]amix=inputs=2:duration=first:dropout_transition=0,` +
        `alimiter=limit=0.95[aout]`,
    );
  } else if (hasVoice) {
    parts.push(`[voice]anull[aout]`);
  } else {
    // Só trilha: normaliza para o mesmo alvo que a voz teria.
    parts.push(`[bed]loudnorm=I=${LOUDNESS_TARGET}:TP=-1.5:LRA=11,aresample=${AUDIO_SAMPLE_RATE}[aout]`);
  }

  return parts;
}

function buildArgs(
  job: RenderJob,
  profile: EncodeProfile,
  paths: { scrim: string; verse: string; meta: string | null; output: string },
): string[] {
  const args: string[] = ["-y", "-hide_banner", "-loglevel", "error"];

  // Loop incondicional. Um clipe mais curto que o Reel precisa dele; num mais
  // longo, o `-t` da saída corta antes de o loop acontecer. Assim não é preciso
  // sondar a duração do arquivo — o que seria um problema no serverless, onde
  // o ffmpeg-static não traz o ffprobe junto.
  args.push("-stream_loop", "-1", "-i", job.backgroundPath);

  args.push("-framerate", String(profile.fps), "-loop", "1", "-i", paths.scrim);
  args.push("-framerate", String(profile.fps), "-loop", "1", "-i", paths.verse);
  if (paths.meta) {
    args.push("-framerate", String(profile.fps), "-loop", "1", "-i", paths.meta);
  }
  // A ordem das entradas tem que casar com inputIndexes(): narração e depois
  // trilha, sempre por último.
  if (job.narrationPath) {
    args.push("-i", job.narrationPath);
  }
  if (job.musicPath) {
    args.push("-i", job.musicPath);
  }

  args.push(
    "-filter_complex",
    buildFilterGraph(job, profile),
    "-map",
    "[out]",
    "-t",
    String(job.durationSec),
    "-r",
    String(profile.fps),
    "-c:v",
    "libx264",
    "-preset",
    profile.preset,
    "-crf",
    String(profile.crf),
    "-pix_fmt",
    "yuv420p",
    "-profile:v",
    "high",
    "-level",
    "4.2",
    // O player começa a tocar sem baixar o arquivo inteiro — importante para o
    // preview e para o upload nas redes.
    "-movflags",
    "+faststart",
  );

  if (job.narrationPath || job.musicPath) {
    // Sem `-shortest`: a duração continua sendo a do `-t`. Com ele, o áudio
    // passaria a mandar no tamanho do vídeo, que é o oposto do combinado.
    args.push("-map", "[aout]", "-c:a", "aac", "-b:a", "128k", "-ar", String(AUDIO_SAMPLE_RATE));
  } else {
    args.push("-an");
  }

  args.push(
    // Progresso legível por máquina no stdout, sem as estatísticas humanas.
    "-progress",
    "pipe:1",
    "-nostats",
    paths.output,
  );

  return args;
}

/**
 * Lê o stream de `-progress` do FFmpeg e converte em percentual.
 * O formato é `chave=valor` por linha, com blocos terminados em `progress=`.
 */
function parseProgress(chunk: string, durationSec: number): number | null {
  let pct: number | null = null;
  for (const line of chunk.split(/\r?\n/)) {
    const [key, value] = line.split("=");
    if (key === "out_time_ms" || key === "out_time_us") {
      const micros = Number(value);
      if (Number.isFinite(micros) && micros >= 0) {
        pct = Math.min(100, (micros / 1_000_000 / durationSec) * 100);
      }
    }
  }
  return pct;
}

export interface RunOptions {
  binary: string;
  profile: EncodeProfile;
}

/**
 * Executa o FFmpeg num diretório temporário e devolve o MP4 em memória.
 * O diretório é sempre removido, inclusive quando o render falha.
 */
export async function runFfmpeg(
  job: RenderJob,
  options: RunOptions,
  onProgress: (p: RenderProgress) => void,
): Promise<Buffer> {
  const dir = await mkdtemp(join(tmpdir(), "reel-"));

  try {
    const paths = {
      scrim: join(dir, "scrim.png"),
      verse: join(dir, "verse.png"),
      meta: job.layers.meta ? join(dir, "meta.png") : null,
      output: join(dir, "reel.mp4"),
    };

    await writeFile(paths.scrim, job.layers.scrim);
    await writeFile(paths.verse, job.layers.verse);
    if (paths.meta && job.layers.meta) await writeFile(paths.meta, job.layers.meta);

    const args = buildArgs(job, options.profile, paths);

    await new Promise<void>((resolve, reject) => {
      const child = spawn(options.binary, args, { windowsHide: true });

      let stderr = "";
      child.stderr.on("data", (d: Buffer) => {
        // Só o suficiente para diagnosticar; o filter_complex é verboso.
        stderr = (stderr + d.toString()).slice(-4000);
      });

      child.stdout.on("data", (d: Buffer) => {
        const pct = parseProgress(d.toString(), job.durationSec);
        if (pct !== null) onProgress({ stage: "rendering", pct });
      });

      child.on("error", (err) => {
        reject(new Error(`Não foi possível executar o FFmpeg (${options.binary}): ${err.message}`));
      });

      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg terminou com código ${code}.\n${stderr.trim()}`));
      });
    });

    return await readFile(paths.output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
