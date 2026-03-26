import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { ref, translation } = req.query;
  if (!ref || typeof ref !== "string") {
    return res.status(400).json({ error: "Parâmetro 'ref' obrigatório. Ex: ?ref=joao+3" });
  }

  const selectedTranslation = (typeof translation === "string" && translation) || "almeida";

  try {
    // bible-api.com usa '+' para espaços no path
    const apiRef = ref.replace(/\s+/g, "+");
    const apiRes = await fetch(
      `https://bible-api.com/${apiRef}?translation=${selectedTranslation}`
    );
    if (!apiRes.ok) throw new Error("Bible API error");
    const data = await apiRes.json();

    // Cache CDN por 7 dias (conteúdo estático — versículos não mudam)
    res.setHeader("Cache-Control", "s-maxage=604800, stale-while-revalidate");

    return res.status(200).json(data);
  } catch (err) {
    console.error("bible-passage error:", err);
    return res.status(500).json({ error: "Não foi possível buscar a passagem." });
  }
}
