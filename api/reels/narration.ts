import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MAX_NARRATION_CHARS, resolveNarration } from "../../server/reels/tts/index.js";
import { narrationText } from "../../server/reels/narrationText.js";

// ─── POST /api/reels/narration ────────────────────────────────────────────────
// Sintetiza a narração e devolve o áudio direto no corpo da resposta.
//
// Resposta binária simples, sem o NDJSON do render: a narração tem algumas
// centenas de KB e leva poucos segundos, então não há progresso a reportar.
//
// Os cabeçalhos dizem o que foi realmente usado — importante porque a cadeia
// pode ter caído para outro motor e outra voz:
//   X-Reel-Voice     voz efetivamente usada
//   X-Reel-Provider  motor que atendeu ("edge" ou "windows")
//   X-Reel-Fellback  "1" quando a voz entregue não é a que foi pedida
//
// A DURAÇÃO não vem daqui: quem mede é o `<audio>` do browser, que já vai tocar
// este arquivo no preview. Evita parsear cabeçalho de MP3 no servidor e evita
// depender do ffprobe, que o ffmpeg-static não traz.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST." });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;

  const text = narrationText({
    verseText: String(body.verseText ?? ""),
    reference: String(body.reference ?? ""),
    includeReference: body.includeReference === true,
    language: String(body.language ?? "pt-BR"),
    contentType: body.contentType === "quote" ? "quote" : "verse",
  });

  if (!text) {
    return res.status(400).json({ error: "Informe o texto do versículo." });
  }
  if (text.length > MAX_NARRATION_CHARS) {
    return res.status(400).json({
      error: `O texto a narrar tem ${text.length} caracteres; o limite é ${MAX_NARRATION_CHARS}.`,
    });
  }

  try {
    const narration = await resolveNarration(
      text,
      String(body.voiceId ?? ""),
      Number(body.rate),
    );

    for (const failure of narration.failures) {
      console.warn(`reels/narration: ${failure.providerId} falhou —`, failure.message);
    }

    res.setHeader("Content-Type", narration.mime);
    res.setHeader("Content-Length", String(narration.audio.length));
    res.setHeader("X-Reel-Voice", narration.voiceId);
    res.setHeader("X-Reel-Provider", narration.providerId);
    res.setHeader("X-Reel-Fellback", narration.fellBack ? "1" : "0");
    // Sem os cabeçalhos expostos, o fetch do browser não consegue lê-los.
    res.setHeader(
      "Access-Control-Expose-Headers",
      "X-Reel-Voice, X-Reel-Provider, X-Reel-Fellback",
    );
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(narration.audio);
  } catch (err) {
    console.error("reels/narration error:", err);
    // 503, não 500: a causa típica é o serviço externo indisponível, e a
    // interface trata isso oferecendo gerar o vídeo sem narração.
    return res.status(503).json({
      error: err instanceof Error ? err.message : "Não foi possível gerar a narração.",
    });
  }
}
