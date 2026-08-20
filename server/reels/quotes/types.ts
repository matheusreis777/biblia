import type { ThemeId } from "../../../src/reels/types.js";

// ─── Contrato dos provedores de frase ─────────────────────────────────────────
// Mesmo formato dos provedores de vídeo e de voz: interface, implementações, e
// um resolve*() que percorre a lista.

export type QuoteLanguage = "pt-BR" | "en-US";

export interface Quote {
  id: string;
  text: string;
  author: string;
  /**
   * Temas do catálogo já existente (src/reels/themes.ts), NÃO as tags do
   * provedor de origem. É o mesmo tema que alimenta a busca de vídeo, então
   * traduzir na entrada evita um catálogo paralelo.
   */
  themes: ThemeId[];
  language: QuoteLanguage;
  /** Página do autor, quando o provedor oferece. Usada no crédito. */
  sourceUrl: string | null;
  providerId: string;
}

export interface QuoteSearchOptions {
  theme: ThemeId;
  language: QuoteLanguage;
  limit: number;
  page: number;
}

export interface QuoteProvider {
  readonly id: string;
  readonly label: string;
  /** `false` quando o provedor não atende o idioma pedido. */
  supports(language: QuoteLanguage): boolean;
  search(options: QuoteSearchOptions): Promise<Quote[]>;
}

// ─── Tags do Quotable → nossos temas ──────────────────────────────────────────
// O acervo em inglês vem etiquetado com as 63 tags do Quotable. Este mapa
// traduz para os 13 temas do projeto.
//
// TODAS as tags abaixo foram conferidas contra /api/tags do provedor. Uma tag
// que não existe não dá erro: o filtro simplesmente devolve zero frases, em
// silêncio — por isso a lista não pode ser escrita de cabeça.
//
// O acervo é bem desigual (Wisdom tem 549 frases, Gratitude tem 1), então
// alguns temas dependem mais da biblioteca interna do que do espelho.
//
// Três temas ficam de fora de propósito:
//   `prayer` e `god` não têm equivalente num acervo secular;
//   `protection` só casaria com Family, que tem 2 frases — não vale o ruído.
// Nesses temas a galeria em inglês fica só com a biblioteca interna.

export const THEME_TO_QUOTABLE_TAGS: Partial<Record<ThemeId, string[]>> = {
  faith: ["Faith", "Spirituality", "Religion"],
  hope: ["Future", "Opportunity"],
  peace: ["Happiness", "Wellness", "Tolerance"],
  love: ["Love", "Friendship", "Family", "Generosity"],
  strength: ["Courage", "Perseverance", "Competition", "Sports"],
  trust: ["Character", "Virtue", "Honor", "Truth", "Ethics"],
  gratitude: ["Gratitude", "Generosity", "Happiness"],
  wisdom: ["Wisdom", "Philosophy", "Knowledge", "Education", "Truth"],
  purpose: ["Inspirational", "Motivational", "Success", "Life", "Work", "Business", "Leadership"],
  overcoming: ["Change", "Failure", "Perseverance", "Weakness", "Pain"],
};

/**
 * O provedor usa `|` entre as tags, que é OU. Vírgula seria E, e uma busca por
 * "Faith E Religion" devolve zero — testado.
 */
export const QUOTABLE_TAG_SEPARATOR = "|";

/** Traduz as tags que vieram do provedor para os nossos temas. */
export function themesFromQuotableTags(tags: string[]): ThemeId[] {
  const found = new Set<ThemeId>();

  for (const [theme, mapped] of Object.entries(THEME_TO_QUOTABLE_TAGS)) {
    if (tags.some((tag) => mapped.includes(tag))) {
      found.add(theme as ThemeId);
    }
  }

  return [...found];
}

// ─── Filtros de qualidade ─────────────────────────────────────────────────────
// Aplicados a todo provedor, em ./index.ts.

/**
 * Uma frase muito longa vira um bloco de texto denso no Reel — o motor de
 * layout até reduz a fonte para caber, mas o resultado fica ilegível no feed.
 */
export const MAX_QUOTE_CHARS = 240;

/** Abaixo disso não é uma frase, é um fragmento. */
export const MIN_QUOTE_CHARS = 20;

export function isUsableQuote(quote: Quote): boolean {
  if (!quote.text || !quote.author) return false;
  const length = quote.text.trim().length;
  return length >= MIN_QUOTE_CHARS && length <= MAX_QUOTE_CHARS;
}
