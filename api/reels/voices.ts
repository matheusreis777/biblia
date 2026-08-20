import type { VercelRequest, VercelResponse } from "@vercel/node";
import { availableVoices, DEFAULT_RATE, MAX_RATE, MIN_RATE } from "../../server/reels/tts";

// ─── GET /api/reels/voices ────────────────────────────────────────────────────
// Vozes utilizáveis NESTE ambiente.
//
// A lista não é fixa no cliente de propósito: as vozes locais do Windows
// existem na máquina do usuário e não existem no Linux da Vercel. Perguntar ao
// servidor evita oferecer na interface uma voz que falharia ao ser usada.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const voices = await availableVoices();

    // Muda só quando o ambiente muda; um cache curto evita repetir a checagem
    // de plataforma a cada carregamento da página.
    res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=3600");

    return res.status(200).json({
      voices,
      rate: { min: MIN_RATE, max: MAX_RATE, default: DEFAULT_RATE },
    });
  } catch (err) {
    console.error("reels/voices error:", err);
    return res.status(500).json({ error: "Não foi possível listar as vozes." });
  }
}
