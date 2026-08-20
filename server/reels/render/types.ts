import type { RenderProgress } from "../../../src/reels/types.js";
import type { RasterizedLayers } from "../rasterize.js";

// ─── Contrato do render ───────────────────────────────────────────────────────
// Duas implementações hoje: o FFmpeg do sistema (local, sem limite de tempo) e
// o ffmpeg-static (serverless, com timeout). Uma terceira — um worker externo,
// por exemplo — só precisa implementar esta interface.

export interface RenderJob {
  /** Arquivo do clipe de fundo já baixado para o disco. */
  backgroundPath: string;
  layers: RasterizedLayers;
  durationSec: number;
  width: number;
  height: number;
  /** Zoom lento no fundo. Desligado, o clipe roda sem tratamento. */
  motion: boolean;
  /**
   * Narração já sintetizada em disco, ou `null` para vídeo mudo.
   * Pode ser MP3 (motor do Edge) ou WAV (voz do Windows) — o FFmpeg lê os dois.
   */
  narrationPath: string | null;
  /** Trilha de fundo em disco, ou `null`. */
  musicPath: string | null;
  /** Volume da trilha, 0–1. Aplicado antes do ducking. */
  musicGain: number;
}

export interface VideoRenderService {
  readonly id: string;
  /** `false` quando o binário do FFmpeg não está acessível neste ambiente. */
  isAvailable(): Promise<boolean>;
  render(job: RenderJob, onProgress: (p: RenderProgress) => void): Promise<Buffer>;
}

/** Parâmetros de codificação — é o que separa o render local do serverless. */
export interface EncodeProfile {
  preset: string;
  crf: number;
  fps: number;
  /** Reduz a resolução de saída quando o ambiente não aguenta 1080x1920. */
  maxHeight: number;
}

export const LOCAL_PROFILE: EncodeProfile = {
  // Sem timeout na máquina do usuário: vale gastar tempo por qualidade.
  preset: "slow",
  crf: 20,
  fps: 30,
  maxHeight: 1920,
};

export const SERVERLESS_PROFILE: EncodeProfile = {
  // A função tem minutos, não horas. Qualidade um degrau abaixo em troca de
  // caber no tempo — ainda bem acima do que as redes sociais entregam depois
  // da recompressão delas.
  preset: "veryfast",
  crf: 24,
  fps: 30,
  maxHeight: 1920,
};
