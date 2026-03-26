import type { VercelRequest, VercelResponse } from "@vercel/node";

// Lista com 365 referências — o dia do ano (UTC) determina qual buscar.
// Assim, todos os devices recebem EXATAMENTE o mesmo versículo a cada dia.
const VERSE_SCHEDULE = [
  "genesis 1:1", "genesis 15:1", "genesis 28:15", "exodus 14:14", "exodus 20:3",
  "numeros 6:24-26", "deuteronomio 6:4-5", "deuteronomio 31:6", "deuteronomio 33:27",
  "josue 1:9", "josue 24:15", "1 samuel 16:7", "2 samuel 22:31", "1 reis 8:57",
  "1 cronicas 16:11", "esdras 8:22", "neemias 8:10", "jo 19:25", "jo 42:2",
  "salmos 1:1-2", "salmos 16:8", "salmos 18:2", "salmos 19:14", "salmos 23:1",
  "salmos 23:4", "salmos 27:1", "salmos 27:14", "salmos 29:11", "salmos 30:5",
  "salmos 31:24", "salmos 32:8", "salmos 34:8", "salmos 34:18", "salmos 37:4",
  "salmos 37:5", "salmos 40:1-2", "salmos 46:1", "salmos 51:10", "salmos 55:22",
  "salmos 62:1-2", "salmos 73:26", "salmos 84:11", "salmos 91:1-2", "salmos 91:4",
  "salmos 103:1-2", "salmos 107:1", "salmos 118:24", "salmos 119:105", "salmos 121:1-2",
  "salmos 139:14", "salmos 145:18", "salmos 150:6", "proverbios 3:5-6", "proverbios 3:9",
  "proverbios 4:23", "proverbios 10:22", "proverbios 11:2", "proverbios 12:25",
  "proverbios 14:12", "proverbios 15:1", "proverbios 16:3", "proverbios 17:22",
  "proverbios 18:10", "proverbios 22:6", "proverbios 31:25", "eclesiastes 3:1",
  "isaias 26:3", "isaias 40:28-29", "isaias 40:31", "isaias 41:10", "isaias 43:1",
  "isaias 43:2", "isaias 43:18-19", "isaias 53:5", "isaias 55:8-9", "isaias 55:11",
  "isaias 58:10", "isaias 60:1", "jeremias 17:7-8", "jeremias 29:11", "jeremias 31:3",
  "jeremias 33:3", "lamentacoes 3:22-23", "ezequiel 36:26", "daniel 6:22",
  "oseas 14:4", "joel 2:28", "miqueas 6:8", "naum 1:7", "habacuque 2:4",
  "sofonias 3:17", "malaquias 3:10", "mateus 5:3", "mateus 5:9", "mateus 5:14",
  "mateus 5:16", "mateus 6:6", "mateus 6:25", "mateus 6:33", "mateus 7:7-8",
  "mateus 11:28-29", "mateus 22:37-39", "mateus 28:19-20", "marcos 9:23",
  "marcos 10:45", "marcos 11:24", "marcos 16:15", "lucas 6:38", "lucas 10:27",
  "lucas 17:6", "lucas 18:27", "lucas 21:33", "joao 1:14", "joao 3:16",
  "joao 3:17", "joao 6:35", "joao 8:12", "joao 10:10", "joao 11:25",
  "joao 13:34-35", "joao 14:1-2", "joao 14:6", "joao 14:27", "joao 15:5",
  "joao 15:13", "joao 16:33", "atos 1:8", "atos 4:12", "atos 17:28",
  "romanos 1:16", "romanos 3:23", "romanos 5:8", "romanos 6:23", "romanos 8:1",
  "romanos 8:28", "romanos 8:38-39", "romanos 10:9", "romanos 12:2", "romanos 12:12",
  "romanos 15:13", "1 corintios 9:24", "1 corintios 10:13", "1 corintios 13:4-5",
  "1 corintios 13:13", "1 corintios 16:13-14", "2 corintios 1:3-4", "2 corintios 4:17",
  "2 corintios 5:7", "2 corintios 5:17", "2 corintios 9:8", "2 corintios 12:9",
  "galatas 2:20", "galatas 5:22-23", "galatas 6:9", "efesios 2:8-9", "efesios 2:10",
  "efesios 3:20-21", "efesios 4:32", "efesios 6:10", "efesios 6:11", "efesios 6:13-14",
  "filipenses 1:6", "filipenses 2:14-15", "filipenses 4:4", "filipenses 4:6-7",
  "filipenses 4:13", "filipenses 4:19", "colossenses 3:15", "colossenses 3:23-24",
  "colossenses 4:2", "1 tessalonicenses 5:16-18", "1 tessalonicenses 5:24",
  "2 tessalonicenses 3:3", "1 timoteo 6:12", "2 timoteo 1:7", "2 timoteo 2:15",
  "2 timoteo 3:16-17", "2 timoteo 4:7-8", "tito 3:5",
  "hebreus 4:12", "hebreus 4:16", "hebreus 11:1", "hebreus 11:6", "hebreus 12:1-2",
  "hebreus 13:5", "hebreus 13:8", "tiago 1:2-3", "tiago 1:5", "tiago 1:17",
  "tiago 4:7-8", "tiago 5:16", "1 pedro 1:6-7", "1 pedro 2:9", "1 pedro 3:15",
  "1 pedro 4:10", "1 pedro 5:7", "1 pedro 5:10", "2 pedro 1:3-4", "2 pedro 3:9",
  "1 joao 1:9", "1 joao 3:18", "1 joao 4:4", "1 joao 4:7-8", "1 joao 4:9",
  "1 joao 4:19", "1 joao 5:14", "apocalipse 3:20", "apocalipse 21:4", "apocalipse 22:13",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // Usa o dia do ano em UTC como índice determinístico
    // → mesmo resultado para qualquer device, browser ou fuso horário
    const now = new Date();
    const startOfYear = new Date(Date.UTC(now.getUTCFullYear(), 0, 0));
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000);
    const ref = VERSE_SCHEDULE[dayOfYear % VERSE_SCHEDULE.length];

    const apiRes = await fetch(
      `https://bible-api.com/${encodeURIComponent(ref)}?translation=almeida`
    );
    if (!apiRes.ok) throw new Error("Bible API error");

    const data = await apiRes.json();

    // Cache no Vercel Edge por 1h — evita requisições repetidas
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

    return res.status(200).json({
      text: data.text.trim(),
      reference: data.reference,
      date: now.toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("daily-verse error:", err);
    return res.status(500).json({ error: "Não foi possível buscar o versículo." });
  }
}
