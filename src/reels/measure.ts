import { parse, type Font } from "./opentypeCompat.js";
import { FONT_VARIANTS, fontUrl, resolveWeight } from "./fonts.js";
import type { FontId, FontMetrics, Measurer } from "./types.js";

// ─── Medição de texto ─────────────────────────────────────────────────────────
// A quebra de linha precisa dar o MESMO resultado no browser e no servidor.
// Medir com a API do canvas de um lado e com o resvg do outro divergiria, então
// os dois lados usam opentype.js lendo os mesmos arquivos .ttf de public/fonts.

function key(fontId: FontId, weight: number): string {
  return `${fontId}@${resolveWeight(fontId, weight)}`;
}

/**
 * Constrói o medidor a partir das fontes já carregadas.
 * O carregamento em si fica com o chamador — o browser busca por HTTP, o
 * servidor lê do disco — porque este módulo não pode depender de nenhum dos dois.
 */
export function createMeasurer(fonts: Map<string, Font>): Measurer {
  function get(fontId: FontId, weight: number): Font {
    const font = fonts.get(key(fontId, weight));
    if (!font) {
      throw new Error(
        `Fonte não carregada: ${key(fontId, weight)}. ` +
          `Carregue todas as variantes de FONT_VARIANTS antes de medir.`,
      );
    }
    return font;
  }

  return {
    measure(text, fontId, weight, sizePx, letterSpacingPx) {
      const font = get(fontId, weight);
      const advance = font.getAdvanceWidth(text, sizePx, { kerning: true });
      // O tracking entra entre os glifos, por isso são (n - 1) intervalos.
      const gaps = Math.max(0, [...text].length - 1);
      return advance + letterSpacingPx * gaps;
    },

    metrics(fontId, weight): FontMetrics {
      const font = get(fontId, weight);
      return {
        unitsPerEm: font.unitsPerEm,
        ascender: font.ascender,
        descender: font.descender,
      };
    },
  };
}

/** Chave usada no Map de fontes, para quem precisa preencher o Map na mão. */
export function fontKey(fontId: FontId, weight: number): string {
  return key(fontId, weight);
}

/**
 * Carrega todas as variantes no browser, a partir de /fonts.
 * O resultado deve ser memoizado pelo chamador — são ~520KB no total.
 */
export async function loadFontsForBrowser(): Promise<Map<string, Font>> {
  const entries = await Promise.all(
    FONT_VARIANTS.map(async ({ fontId, weight }) => {
      const res = await fetch(fontUrl(fontId, weight));
      if (!res.ok) {
        throw new Error(`Falha ao carregar ${fontUrl(fontId, weight)}: ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      return [key(fontId, weight), parse(buffer)] as const;
    }),
  );
  return new Map(entries);
}
