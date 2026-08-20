import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isThemeId } from "../../src/reels/themes.js";
import { MIN_DURATION_SEC } from "../../server/reels/providers/types.js";
import { resolveVideos } from "../../server/reels/providers/index.js";

// ─── GET /api/reels/videos ────────────────────────────────────────────────────
// Busca clipes verticais para um tema. As chaves das APIs ficam só aqui, no
// servidor — o browser nunca as vê.
//
//   ?theme=peace   tema (obrigatório)
//   ?page=1        paginação, para o "carregar mais" da galeria
//   ?limit=12      quantidade máxima de clipes

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

  const rawTheme = Array.isArray(req.query.theme) ? req.query.theme[0] : req.query.theme;
  if (!rawTheme || !isThemeId(rawTheme)) {
    return res.status(400).json({ error: "Informe um tema válido em ?theme=" });
  }

  try {
    const result = await resolveVideos({
      theme: rawTheme,
      page: toInt(req.query.page, 1),
      limit: Math.min(toInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT),
      minDurationSec: MIN_DURATION_SEC,
    });

    for (const failure of result.failures) {
      console.error(`reels/videos: provedor ${failure.providerId} falhou:`, failure.message);
    }

    // O acervo de cada tema muda devagar. Cachear na borda protege o limite de
    // 200 requisições/hora do Pexels, que uma galeria com "carregar mais"
    // consumiria rápido.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

    return res.status(200).json({
      theme: rawTheme,
      videos: result.videos,
      providers: result.usedProviders,
    });
  } catch (err) {
    console.error("reels/videos error:", err);
    return res.status(500).json({ error: "Não foi possível buscar vídeos." });
  }
}
