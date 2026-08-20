import type { FontId } from "./types";

// ─── Registro de fontes ───────────────────────────────────────────────────────
// Os arquivos são gerados por scripts/prepare-fonts.py (instância estática +
// subset Latin das fontes variáveis do Google Fonts). Browser, opentype.js e
// resvg leem exatamente os mesmos arquivos — é isso que faz o preview bater
// com o MP4. Ao adicionar um peso aqui, adicione também no script.

export interface FontFamilyInfo {
  id: FontId;
  /** Nome exibido no seletor de fonte da interface. */
  label: string;
  serif: boolean;
  /** Pesos disponíveis, do mais leve ao mais pesado. */
  weights: number[];
  /** Serifadas rendem melhor um pouco maiores no mesmo tamanho nominal. */
  opticalScale: number;
}

export const FONT_FAMILIES: Record<FontId, FontFamilyInfo> = {
  inter: {
    id: "inter",
    label: "Inter",
    serif: false,
    weights: [400, 500, 600],
    opticalScale: 1,
  },
  spaceGrotesk: {
    id: "spaceGrotesk",
    label: "Space Grotesk",
    serif: false,
    weights: [500, 700],
    opticalScale: 1,
  },
  cormorant: {
    id: "cormorant",
    label: "Cormorant Garamond",
    serif: true,
    // Cormorant tem altura-x baixa: precisa de ~18% a mais para parecer do
    // mesmo tamanho que uma sans no mesmo corpo.
    weights: [500, 600],
    opticalScale: 1.18,
  },
  playfair: {
    id: "playfair",
    label: "Playfair Display",
    serif: true,
    weights: [500, 600],
    opticalScale: 1.04,
  },
};

// Arquivo e nome de família de cada variante.
//
// Cada peso tem uma família ÚNICA porque as três instâncias do Inter sairiam
// todas como "Inter"/"Regular" do fontTools, diferindo só no usWeightClass — e
// o resvg não conseguiria escolher o peso certo. Estes nomes são gravados no
// name table pelo scripts/prepare-fonts.py e usados literalmente tanto no
// font-family do SVG quanto no @font-face do browser.
const VARIANTS: Record<string, { file: string; family: string }> = {
  "inter@400": { file: "Inter-Regular.ttf", family: "ReelInter400" },
  "inter@500": { file: "Inter-Medium.ttf", family: "ReelInter500" },
  "inter@600": { file: "Inter-SemiBold.ttf", family: "ReelInter600" },
  "spaceGrotesk@500": { file: "SpaceGrotesk-Medium.ttf", family: "ReelSpaceGrotesk500" },
  "spaceGrotesk@700": { file: "SpaceGrotesk-Bold.ttf", family: "ReelSpaceGrotesk700" },
  "cormorant@500": { file: "CormorantGaramond-Medium.ttf", family: "ReelCormorant500" },
  "cormorant@600": { file: "CormorantGaramond-SemiBold.ttf", family: "ReelCormorant600" },
  "playfair@500": { file: "PlayfairDisplay-Medium.ttf", family: "ReelPlayfair500" },
  "playfair@600": { file: "PlayfairDisplay-SemiBold.ttf", family: "ReelPlayfair600" },
};

/** Todas as variantes em disco — usado para carregar as fontes de uma vez. */
export const FONT_VARIANTS: ReadonlyArray<{
  fontId: FontId;
  weight: number;
  file: string;
  family: string;
}> = Object.entries(VARIANTS).map(([key, { file, family }]) => {
  const [fontId, weight] = key.split("@");
  return { fontId: fontId as FontId, weight: Number(weight), file, family };
});

/** Peso realmente disponível para o par pedido — cai no vizinho mais próximo. */
export function resolveWeight(fontId: FontId, weight: number): number {
  const available = FONT_FAMILIES[fontId].weights;
  if (available.includes(weight)) return weight;
  return available.reduce((best, w) =>
    Math.abs(w - weight) < Math.abs(best - weight) ? w : best,
  );
}

function variant(fontId: FontId, weight: number) {
  return VARIANTS[`${fontId}@${resolveWeight(fontId, weight)}`];
}

/** Arquivo .ttf do peso pedido. Nunca lança: sempre cai num peso existente. */
export function fontFile(fontId: FontId, weight: number): string {
  return variant(fontId, weight).file;
}

/**
 * Nome da família a usar em font-family, no SVG e no CSS.
 * Único por peso — ver o comentário em VARIANTS.
 */
export function fontFamilyName(fontId: FontId, weight: number): string {
  return variant(fontId, weight).family;
}

/** Caminho público servido pelo Vite/Vercel (para @font-face e fetch no browser). */
export function fontUrl(fontId: FontId, weight: number): string {
  return `/fonts/${fontFile(fontId, weight)}`;
}
