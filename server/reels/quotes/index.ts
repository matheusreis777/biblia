import { InternalQuoteProvider } from "./internal";
import { QuotableQuoteProvider } from "./quotable";
import {
  isUsableQuote,
  type Quote,
  type QuoteLanguage,
  type QuoteProvider,
  type QuoteSearchOptions,
} from "./types";

// ─── Cadeia de fallback das frases ────────────────────────────────────────────
// Ordem: Quotable (espelho, só inglês) → biblioteca interna.
//
// A diferença estrutural em relação às outras cadeias do projeto é que aqui a
// ordem depende do IDIOMA. O espelho não tem acervo em português, então em PT
// ele é pulado pelo `supports()` e a biblioteca interna atende sozinha.
//
// A interna é a QUEDA, e não o contrário, de propósito: o espelho é um host
// anônimo sem garantia nenhuma, e o acervo curado é o que sobra quando ele some.

export const QUOTE_PROVIDERS: QuoteProvider[] = [
  new QuotableQuoteProvider(),
  new InternalQuoteProvider(),
];

/** Abaixo disso vale consultar o próximo provedor. */
const ENOUGH_RESULTS = 6;

export interface ResolveQuotesResult {
  quotes: Quote[];
  usedProviders: string[];
  failures: { providerId: string; message: string }[];
}

/**
 * Busca frases de um tema, percorrendo os provedores em ordem.
 *
 * A falha de um provedor nunca derruba a requisição: é registrada e a busca
 * segue para o próximo — mesmo comportamento de resolveVideos().
 */
export async function resolveQuotes(
  options: QuoteSearchOptions,
): Promise<ResolveQuotesResult> {
  const collected = new Map<string, Quote>();
  const usedProviders: string[] = [];
  const failures: ResolveQuotesResult["failures"] = [];

  for (const provider of QUOTE_PROVIDERS) {
    if (collected.size >= ENOUGH_RESULTS) break;
    if (!provider.supports(options.language)) continue;

    try {
      let contributed = false;
      for (const quote of await provider.search(options)) {
        if (collected.has(quote.id)) continue;
        if (!isUsableQuote(quote)) continue;
        collected.set(quote.id, quote);
        contributed = true;
      }
      if (contributed) usedProviders.push(provider.id);
    } catch (error) {
      failures.push({
        providerId: provider.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    quotes: [...collected.values()].slice(0, options.limit),
    usedProviders,
    failures,
  };
}

/** Normaliza a tag de idioma da interface para as que os provedores conhecem. */
export function toQuoteLanguage(language: string): QuoteLanguage {
  return language.startsWith("pt") ? "pt-BR" : "en-US";
}

export type { Quote, QuoteLanguage } from "./types";
