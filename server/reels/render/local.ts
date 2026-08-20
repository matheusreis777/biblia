import { spawn } from "node:child_process";

import type { RenderProgress } from "../../../src/reels/types.js";
import { runFfmpeg } from "./ffmpeg.js";
import { LOCAL_PROFILE, type RenderJob, type VideoRenderService } from "./types.js";

// ─── Render local ─────────────────────────────────────────────────────────────
// Usa o FFmpeg instalado na máquina. É o caminho de qualidade máxima: sem
// timeout de função, então dá para usar preset lento e CRF baixo.
//
// Ativado pelo plugin de dev do Vite (vite/reelsDevApi.ts) durante `npm run dev`.

const BINARY = process.env.FFMPEG_PATH ?? "ffmpeg";

let availability: Promise<boolean> | null = null;

function probeBinary(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(BINARY, ["-version"], { windowsHide: true });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

export class LocalFfmpegRenderService implements VideoRenderService {
  readonly id = "local-ffmpeg";

  isAvailable(): Promise<boolean> {
    // Verificado uma vez por processo: o binário não aparece nem some no meio
    // de uma sessão de desenvolvimento.
    availability ??= probeBinary();
    return availability;
  }

  render(job: RenderJob, onProgress: (p: RenderProgress) => void): Promise<Buffer> {
    return runFfmpeg(job, { binary: BINARY, profile: LOCAL_PROFILE }, onProgress);
  }
}
