import type { VercelRequest, VercelResponse } from "@vercel/node";

import type { RenderProgress } from "../../src/reels/types";
import { generateReel, validate, ValidationError } from "../../server/reels/reelGenerator";
import { resolveRenderService } from "../../server/reels/render";

// ─── POST /api/reels/render ───────────────────────────────────────────────────
// Responde em NDJSON streamado — uma linha JSON por evento:
//
//   {"stage":"preparing"}
//   {"stage":"fetchingVideo"}
//   {"stage":"rendering","pct":42}
//   {"stage":"done","bytes":14238211}
//   {"data":"<pedaço em base64>"}          (vários)
//   {"end":true}
//
// O MP4 vai em pedaços, e não numa linha só, de propósito: uma resposta
// bufferizada de função serverless tem teto de tamanho na Vercel, e escrever em
// pedaços mantém a resposta genuinamente streamada. De quebra, o cliente pode
// mostrar o progresso do download.

/** Tamanho de cada pedaço do MP4, antes de virar base64. */
const CHUNK_BYTES = 256 * 1024;

/** Progresso só é reenviado quando muda de verdade — evita centenas de linhas. */
const PROGRESS_STEP_PCT = 1;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  // Validação e disponibilidade do FFmpeg acontecem ANTES de abrir o stream:
  // depois da primeira linha escrita o status já foi enviado, e não daria mais
  // para responder 400 ou 503.
  let renderer;
  try {
    validate(req.body);
    renderer = await resolveRenderService();
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    console.error("reels/render indisponível:", error);
    return res.status(503).json({
      error: error instanceof Error ? error.message : "Render indisponível.",
    });
  }

  res.status(200);
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  // Impede que proxies segurem a resposta até o fim, o que anularia o progresso.
  res.setHeader("X-Accel-Buffering", "no");

  const send = (payload: unknown) => res.write(`${JSON.stringify(payload)}\n`);

  try {
    let lastStage = "";
    let lastPct = -PROGRESS_STEP_PCT;

    const onProgress = (progress: RenderProgress) => {
      const pct = progress.pct === undefined ? undefined : Math.round(progress.pct);
      const stageChanged = progress.stage !== lastStage;
      const pctChanged = pct !== undefined && pct - lastPct >= PROGRESS_STEP_PCT;
      if (!stageChanged && !pctChanged) return;

      lastStage = progress.stage;
      if (pct !== undefined) lastPct = pct;
      else lastPct = -PROGRESS_STEP_PCT;

      send(pct === undefined ? { stage: progress.stage } : { stage: progress.stage, pct });
    };

    const mp4 = await generateReel(req.body, renderer, onProgress);

    send({ stage: "done", bytes: mp4.length, mime: "video/mp4", renderer: renderer.id });

    for (let offset = 0; offset < mp4.length; offset += CHUNK_BYTES) {
      const chunk = mp4.subarray(offset, offset + CHUNK_BYTES);
      // `write` devolve false quando o buffer do socket encheu; esperar o
      // "drain" impede que um MP4 de dezenas de MB estoure a memória.
      if (!res.write(`${JSON.stringify({ data: chunk.toString("base64") })}\n`)) {
        await new Promise<void>((resolve) => res.once("drain", resolve));
      }
    }

    send({ end: true });
  } catch (error) {
    console.error("reels/render error:", error);
    // O status 200 já foi enviado, então o erro precisa viajar dentro do stream.
    send({ error: error instanceof Error ? error.message : "Falha ao gerar o vídeo." });
  } finally {
    res.end();
  }
}
