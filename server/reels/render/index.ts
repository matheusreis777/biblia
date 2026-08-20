import { BundledFfmpegRenderService } from "./bundled";
import { LocalFfmpegRenderService } from "./local";
import type { VideoRenderService } from "./types";

// ─── Seleção do render ────────────────────────────────────────────────────────
// O FFmpeg do sistema vem primeiro: quando existe (máquina de desenvolvimento),
// entrega qualidade melhor e não tem timeout. O binário empacotado é o que
// atende o site publicado.
//
// Para plugar um worker externo no futuro, implemente VideoRenderService e
// coloque-o no início desta lista.

const CANDIDATES: VideoRenderService[] = [
  new LocalFfmpegRenderService(),
  new BundledFfmpegRenderService(),
];

let cached: VideoRenderService | null = null;

/**
 * Primeiro render utilizável do ambiente.
 * Lança quando nenhum está disponível — a rota traduz isso num 503 explicando
 * que o ambiente não tem FFmpeg, em vez de devolver um vídeo quebrado.
 */
export async function resolveRenderService(): Promise<VideoRenderService> {
  if (cached) return cached;

  for (const candidate of CANDIDATES) {
    if (await candidate.isAvailable()) {
      cached = candidate;
      return candidate;
    }
  }

  throw new Error(
    "Nenhum FFmpeg disponível neste ambiente. " +
      "Instale o FFmpeg e deixe-o no PATH, ou defina FFMPEG_PATH.",
  );
}

export type { VideoRenderService } from "./types";
