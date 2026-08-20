import type { ThemeId, VerseTheme } from "./types";

// ─── Temas ────────────────────────────────────────────────────────────────────
// `queries` são enviadas aos provedores em inglês (é onde Pexels e Pixabay têm
// acervo). A ordem importa: a primeira é a busca preferida, as seguintes são
// alternativas quando a primeira devolve pouco resultado bom.
//
// `keywords` alimentam a detecção automática do tema a partir do versículo.
// Radicais, não palavras inteiras — a comparação usa "começa com".

export const THEMES: VerseTheme[] = [
  {
    id: "faith",
    label: { pt: "Fé", en: "Faith" },
    queries: ["peaceful nature sunrise", "misty mountain sunrise", "sunlight through forest"],
    keywords: {
      // "cre" é radical de crê/creio/crer/creu/credes/crente — sem ele,
      // "todo aquele que nele crê" não pontuaria em fé.
      pt: ["fé", "cre", "acredit"],
      en: ["faith", "believ", "belief"],
    },
  },
  {
    id: "hope",
    label: { pt: "Esperança", en: "Hope" },
    queries: ["sunrise over ocean", "dawn sky clouds", "horizon sunrise landscape"],
    keywords: {
      pt: ["esperança", "esperar no senhor", "espero", "aguard", "futuro", "porvir"],
      en: ["hope", "await", "future"],
    },
  },
  {
    id: "peace",
    label: { pt: "Paz", en: "Peace" },
    queries: ["calm ocean sunset", "still lake reflection", "peaceful landscape evening"],
    keywords: {
      pt: ["paz", "tranquil", "sossego", "descanso", "quieta", "repouso", "serenidade"],
      en: ["peace", "calm", "rest", "quiet", "still"],
    },
  },
  {
    id: "love",
    label: { pt: "Amor", en: "Love" },
    queries: ["beautiful sunset flowers", "golden field wildflowers", "soft sunset landscape"],
    keywords: {
      // "amo" cobre amou/amor/amoroso/amos; "ama" cobre ama/amai/amar/amado.
      pt: ["amo", "ama", "caridade", "querido"],
      en: ["love", "beloved", "charity"],
    },
  },
  {
    id: "strength",
    label: { pt: "Força", en: "Strength" },
    queries: ["mountain peak dramatic", "storm clouds nature", "waves crashing rocks"],
    keywords: {
      pt: ["força", "forte", "fortalec", "poder", "vigor", "esforça", "ânimo", "corajos"],
      en: ["strength", "strong", "power", "might", "courage"],
    },
  },
  {
    id: "trust",
    label: { pt: "Confiança", en: "Trust" },
    queries: ["steady mountain landscape", "solid rock coastline", "calm river valley"],
    keywords: {
      pt: ["confia", "confian", "entrega o teu caminho", "seguro", "refúgio"],
      en: ["trust", "rely", "refuge", "safe"],
    },
  },
  {
    id: "prayer",
    label: { pt: "Oração", en: "Prayer" },
    queries: ["sunrise sky clouds peaceful", "light rays through clouds", "quiet chapel window light"],
    keywords: {
      pt: ["ora", "oração", "orai", "clam", "súplica", "invoc", "peça", "pedi"],
      en: ["pray", "prayer", "cry out", "ask", "supplication"],
    },
  },
  {
    id: "gratitude",
    label: { pt: "Gratidão", en: "Gratitude" },
    queries: ["golden sunset nature", "autumn golden light", "warm sunlight meadow"],
    keywords: {
      pt: ["graça", "graças", "gratid", "louv", "agradec", "bendiz", "bendito", "celebr"],
      en: ["thank", "grateful", "praise", "bless"],
    },
  },
  {
    id: "god",
    label: { pt: "Deus", en: "God" },
    queries: ["dramatic sky clouds light", "vast starry night sky", "sunbeams over mountains"],
    keywords: {
      pt: ["deus", "senhor", "altíssimo", "criador", "jeová", "todo-poderoso"],
      en: ["god", "lord", "almighty", "creator"],
    },
  },
  {
    id: "protection",
    label: { pt: "Proteção", en: "Protection" },
    queries: ["sheltering tree landscape", "mountain fortress cliffs", "calm forest canopy"],
    keywords: {
      pt: ["prote", "guard", "abrigo", "escudo", "fortaleza", "livrar", "socorro", "sombra"],
      en: ["protect", "shield", "shelter", "fortress", "deliver", "keep"],
    },
  },
  {
    id: "wisdom",
    label: { pt: "Sabedoria", en: "Wisdom" },
    queries: ["ancient forest light", "path through woods", "quiet mountain lake dawn"],
    keywords: {
      pt: ["sabedoria", "sábio", "entendimento", "prudên", "conhecimento", "instru", "ensina"],
      en: ["wisdom", "wise", "understanding", "knowledge", "instruct"],
    },
  },
  {
    id: "purpose",
    label: { pt: "Propósito", en: "Purpose" },
    queries: ["long winding road landscape", "horizon path sunrise", "open valley road"],
    keywords: {
      pt: ["propósito", "planos", "chamado", "vocação", "destino", "caminho", "obra"],
      en: ["purpose", "plan", "calling", "path", "work"],
    },
  },
  {
    id: "overcoming",
    label: { pt: "Superação", en: "Overcoming" },
    queries: ["climbing mountain summit", "sunrise after storm", "breaking clouds light"],
    keywords: {
      pt: ["venc", "supera", "vitória", "triunf", "prova", "tribula", "aflição", "luta"],
      en: ["overcome", "victory", "conquer", "trial", "tribulation"],
    },
  },
];

const BY_ID = new Map<ThemeId, VerseTheme>(THEMES.map((t) => [t.id, t]));

export function getTheme(id: ThemeId): VerseTheme {
  const theme = BY_ID.get(id);
  if (!theme) throw new Error(`Tema desconhecido: ${id}`);
  return theme;
}

export function isThemeId(value: string): value is ThemeId {
  return BY_ID.has(value as ThemeId);
}

/** Marcas de acento que NFD separa das letras (U+0300–U+036F). */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Remove acentos e baixa a caixa, para casar "graça" com "graca". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "");
}

export interface ThemeMatch {
  theme: VerseTheme;
  score: number;
}

/**
 * Ranqueia os temas para um versículo.
 *
 * Heurística proposital: os temas mais específicos ganham dos genéricos.
 * "Deus" e "Senhor" aparecem em quase todo versículo, então `god` recebe peso
 * baixo — sem isso, praticamente tudo seria classificado como `god`.
 */
export function rankThemes(verseText: string, language: string): ThemeMatch[] {
  const haystack = normalize(` ${verseText} `);
  const lang: "pt" | "en" = language.startsWith("pt") ? "pt" : "en";

  const scored = THEMES.map((theme) => {
    let score = 0;
    for (const keyword of theme.keywords[lang]) {
      const needle = normalize(keyword);
      // Conta ocorrências: um versículo que repete "amor" é mais sobre amor.
      let from = 0;
      for (;;) {
        const at = haystack.indexOf(needle, from);
        if (at === -1) break;
        // Só conta se começa numa fronteira de palavra (radical, não sufixo).
        const before = haystack[at - 1] ?? " ";
        if (!/[a-z0-9]/.test(before)) score += 1;
        from = at + needle.length;
      }
    }
    const weight = theme.id === "god" ? 0.35 : 1;
    return { theme, score: score * weight };
  });

  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
}

/**
 * Melhor tema para o versículo. Cai em `peace` quando nada casa — é o tema
 * de paisagem mais neutro e que combina com qualquer texto.
 */
export function detectTheme(verseText: string, language: string): VerseTheme {
  const ranked = rankThemes(verseText, language);
  return ranked[0]?.theme ?? getTheme("peace");
}
