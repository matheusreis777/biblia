import { existsSync } from "node:fs";
import ffmpegStatic from "ffmpeg-static";

import type { RenderProgress } from "../../../src/reels/types";
import { runFfmpeg } from "./ffmpeg";
import { SERVERLESS_PROFILE, type RenderJob, type VideoRenderService } from "./types";

// ─── Render serverless ────────────────────────────────────────────────────────
// Usa o binário que vem no pacote ffmpeg-static, para o site publicado na
// Vercel, onde não existe FFmpeg instalado.
//
// Duas restrições que este caminho carrega e o local não tem:
//   • timeout da função — daí o preset veryfast e o CRF mais alto;
//   • ~78MB de binário no bundle, contra o limite de 250MB da função.

export class BundledFfmpegRenderService implements VideoRenderService {
  readonly id = "bundled-ffmpeg";

  async isAvailable(): Promise<boolean> {
    // ffmpeg-static resolve o binário da plataforma na instalação. Se o build
    // rodou num SO e a função executa em outro, o caminho não existe.
    return typeof ffmpegStatic === "string" && existsSync(ffmpegStatic);
  }

  render(job: RenderJob, onProgress: (p: RenderProgress) => void): Promise<Buffer> {
    if (typeof ffmpegStatic !== "string") {
      throw new Error("ffmpeg-static não resolveu um binário para esta plataforma.");
    }
    return runFfmpeg(job, { binary: ffmpegStatic, profile: SERVERLESS_PROFILE }, onProgress);
  }
}
