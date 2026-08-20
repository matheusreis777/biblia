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
  /**
   * `false` desliga o zoom lento no fundo, ignorando o pedido do job.
   *
   * O zoompan é de longe o filtro mais caro da pipeline: ele reamostra cada
   * quadro a partir de uma pré-escala de 150%. Num ambiente com timeout, o
   * movimento é a primeira coisa a sacrificar.
   */
  allowMotion: boolean;
}

export const LOCAL_PROFILE: EncodeProfile = {
  // Sem timeout na máquina do usuário: vale gastar tempo por qualidade.
  preset: "slow",
  crf: 20,
  fps: 30,
  maxHeight: 1920,
  allowMotion: true,
};

export const SERVERLESS_PROFILE: EncodeProfile = {
  // MEDIDO EM PRODUÇÃO: com 1080x1920, 30fps, preset veryfast e zoom ligado, a
  // função estourou os 60s de timeout. Este perfil é o que cabe no limite:
  //
  //   720x1280   menos da metade dos pixels de 1080x1920;
  //   24fps      20% menos quadros para codificar;
  //   ultrafast  o preset mais rápido do x264;
  //   sem zoom   o zoompan é o filtro mais caro da pipeline.
  //
  // O resultado é visivelmente inferior ao render local — que é o caminho de
  // qualidade e não tem timeout. Se a conta for Pro, subir maxDuration para 300
  // no vercel.json permite devolver este perfil para perto do local.
  preset: "ultrafast",
  crf: 26,
  fps: 24,
  maxHeight: 1280,
  allowMotion: false,
};
