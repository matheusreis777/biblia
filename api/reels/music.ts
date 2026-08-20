import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isMood, MOODS, resolveMusic } from "../../server/reels/music";

// ─── GET /api/reels/music ─────────────────────────────────────────────────────
// Trilhas para um clima. Mesma forma de /api/reels/videos.
//
//   ?mood=calm   clima (padrão: calm)
//   ?page=1
//   ?limit=12

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

function toInt(value: unknown, fallback: number): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const raw = Array.isArray(req.query.mood) ? req.query.mood[0] : req.query.mood;
  const mood = raw && isMood(raw) ? raw : "calm";

  try {
    const result = await resolveMusic({
      mood,
      page: toInt(req.query.page, 1),
      limit: Math.min(toInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT),
    });

    for (const failure of result.failures) {
      console.error(`reels/music: provedor ${failure.providerId} falhou:`, failure.message);
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

    return res.status(200).json({
      mood,
      moods: MOODS,
      tracks: result.tracks,
      providers: result.usedProviders,
    });
  } catch (err) {
    console.error("reels/music error:", err);
    return res.status(500).json({ error: "Não foi possível buscar trilhas." });
  }
}
