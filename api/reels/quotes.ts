import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isThemeId } from "../../src/reels/themes.js";
import { resolveQuotes, toQuoteLanguage } from "../../server/reels/quotes/index.js";

// ─── GET /api/reels/quotes ────────────────────────────────────────────────────
// Frases motivacionais de um tema. Mesma forma de /api/reels/videos.
//
//   ?theme=purpose      tema (obrigatório, um dos 13 do catálogo)
//   ?language=pt-BR     decide quais provedores atendem
//   ?page=1
//   ?limit=12

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 24;

function toInt(value: unknown, fallback: number): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function first(value: unknown): string {
  return String(Array.isArray(value) ? value[0] : (value ?? ""));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const theme = first(req.query.theme);
  if (!theme || !isThemeId(theme)) {
    return res.status(400).json({ error: "Informe um tema válido em ?theme=" });
  }

  try {
    const language = toQuoteLanguage(first(req.query.language) || "pt-BR");

    const result = await resolveQuotes({
      theme,
      language,
      page: toInt(req.query.page, 1),
      limit: Math.min(toInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT),
    });

    for (const failure of result.failures) {
      console.error(`reels/quotes: provedor ${failure.providerId} falhou:`, failure.message);
    }

    // O acervo muda devagar; cachear na borda poupa o espelho, que é um host
    // da comunidade sem garantia de capacidade.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

    return res.status(200).json({
      theme,
      language,
      quotes: result.quotes,
      providers: result.usedProviders,
    });
  } catch (err) {
    console.error("reels/quotes error:", err);
    return res.status(500).json({ error: "Não foi possível buscar frases." });
  }
}
