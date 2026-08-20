import {
  QUOTABLE_TAG_SEPARATOR,
  THEME_TO_QUOTABLE_TAGS,
  themesFromQuotableTags,
  type Quote,
  type QuoteLanguage,
  type QuoteProvider,
  type QuoteSearchOptions,
} from "./types.js";

// ─── Quotable (espelho da comunidade) ─────────────────────────────────────────
// O Quotable original (api.quotable.io) está fora do ar — a conexão nem
// estabelece. Este é um espelho da comunidade que serve o mesmo acervo:
// ~2.000 frases com 63 tags, sem chave.
//
// RESSALVA: o host é um Swagger sem operador identificado, sem termos de uso e
// sem garantia de disponibilidade. Pode sumir a qualquer momento. É por isso
// que a biblioteca interna é a QUEDA desta cadeia, e não o contrário — ver
// ./index.ts.
//
// Só serve inglês; em português este provedor nem é consultado.

const ENDPOINT = "https://api.quotable.kurokeita.dev/api/quotes";

/** O provedor só aceita estes valores em `limit`; outro qualquer dá 400. */
const ALLOWED_LIMITS = [10, 25, 50, 100];

const TIMEOUT_MS = 15_000;

interface QuotableAuthor {
  name?: string;
  link?: string;
}

interface QuotableQuote {
  id?: string;
  content?: string;
  tags?: { name?: string }[];
  author?: QuotableAuthor;
}

interface QuotableResponse {
  data?: QuotableQuote[];
}

/** Arredonda para cima até um dos limites aceitos pelo provedor. */
function allowedLimit(requested: number): number {
  return ALLOWED_LIMITS.find((n) => n >= requested) ?? ALLOWED_LIMITS[ALLOWED_LIMITS.length - 1];
}

function toQuote(raw: QuotableQuote): Quote | null {
  const text = raw.content?.trim();
  const author = raw.author?.name?.trim();
  if (!text || !author || !raw.id) return null;

  const tags = (raw.tags ?? [])
    .map((t) => t.name)
    .filter((n): n is string => Boolean(n));

  return {
    id: `quotable-${raw.id}`,
    text,
    author,
    themes: themesFromQuotableTags(tags),
    language: "en-US",
    // O acervo já traz o link da Wikipédia do autor. Mostrar isso na interface
    // é a mitigação prática contra atribuição errada: dá para conferir.
    sourceUrl: raw.author?.link ?? null,
    providerId: "quotable",
  };
}

export class QuotableQuoteProvider implements QuoteProvider {
  readonly id = "quotable";
  readonly label = "Quotable";

  supports(language: QuoteLanguage): boolean {
    return language === "en-US";
  }

  async search(options: QuoteSearchOptions): Promise<Quote[]> {
    const tags = THEME_TO_QUOTABLE_TAGS[options.theme];
    // Tema sem equivalente secular (prayer, god, protection): não há o que
    // buscar aqui, e a cadeia segue para a biblioteca interna.
    if (!tags || tags.length === 0) return [];

    const url = new URL(ENDPOINT);
    url.searchParams.set("limit", String(allowedLimit(options.limit)));
    url.searchParams.set("tags", tags.join(QUOTABLE_TAG_SEPARATOR));

    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) {
      throw new Error(`Quotable respondeu ${res.status}`);
    }

    const data = (await res.json()) as QuotableResponse;
    return (data.data ?? [])
      .map(toQuote)
      .filter((q): q is Quote => q !== null)
      // O tema pedido tem que estar entre os detectados: o provedor devolve
      // qualquer frase que tenha UMA das tags, e algumas mapeiam para outros
      // temas também.
      .map((q) => ({ ...q, themes: q.themes.includes(options.theme) ? q.themes : [options.theme, ...q.themes] }));
  }
}
