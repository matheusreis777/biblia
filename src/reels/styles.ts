import type { FontId, ReelStyle, ScrimKind, StyleId, TextAnchor } from "./types.js";

// ─── Estilos prontos ──────────────────────────────────────────────────────────
// Todos os tamanhos estão em px do canvas 1080x1920. O motor de layout reduz a
// fonte quando o versículo é longo, então estes valores são o TETO — o tamanho
// ideal para um versículo de tamanho médio, não um valor fixo.

const WHITE = "#FFFFFF";

export const STYLES: Record<StyleId, ReelStyle> = {
  // ── 1. Clássico ─────────────────────────────────────────────────────────────
  // Composição central, escurecimento uniforme. É o mais seguro: funciona com
  // qualquer clipe de fundo, inclusive os mais claros e movimentados.
  classic: {
    id: "classic",
    name: { pt: "Clássico", en: "Classic" },
    description: {
      pt: "Texto centralizado sobre escurecimento uniforme. Funciona com qualquer vídeo.",
      en: "Centered text over an even dark overlay. Works with any clip.",
    },
    font: "inter",
    fontSizePx: 62,
    fontWeight: 500,
    lineHeight: 1.42,
    letterSpacingEm: -0.005,
    align: "center",
    anchor: "center",
    color: WHITE,
    maxWidthPct: 0.94,
    maxLines: 9,
    scrim: { kind: "solid", intensity: 0.46 },
    showReference: true,
    showBranding: true,
    reference: {
      font: "inter",
      fontSizePx: 30,
      fontWeight: 600,
      letterSpacingEm: 0.16,
      color: WHITE,
      opacity: 0.82,
      uppercase: true,
      gapPx: 56,
    },
    branding: {
      font: "spaceGrotesk",
      fontSizePx: 24,
      fontWeight: 500,
      letterSpacingEm: 0.24,
      color: WHITE,
      opacity: 0.55,
      uppercase: true,
    },
  },

  // ── 2. Cinematográfico ──────────────────────────────────────────────────────
  // Terço inferior, serifada grande, gradiente subindo do rodapé. O topo do
  // clipe fica limpo — é o que dá a sensação de still de filme.
  cinematic: {
    id: "cinematic",
    name: { pt: "Cinematográfico", en: "Cinematic" },
    description: {
      pt: "Serifada grande no terço inferior, gradiente subindo do rodapé.",
      en: "Large serif in the lower third, gradient rising from the bottom.",
    },
    font: "playfair",
    fontSizePx: 70,
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacingEm: -0.012,
    align: "left",
    anchor: "bottom",
    color: WHITE,
    maxWidthPct: 0.9,
    maxLines: 8,
    scrim: { kind: "gradientBottom", intensity: 0.9 },
    showReference: true,
    showBranding: true,
    reference: {
      font: "inter",
      fontSizePx: 26,
      fontWeight: 500,
      letterSpacingEm: 0.2,
      color: WHITE,
      opacity: 0.62,
      uppercase: true,
      gapPx: 44,
    },
    branding: {
      font: "spaceGrotesk",
      fontSizePx: 22,
      fontWeight: 500,
      letterSpacingEm: 0.28,
      color: WHITE,
      opacity: 0.45,
      uppercase: true,
    },
  },

  // ── 3. Minimalista ──────────────────────────────────────────────────────────
  // Muito ar em volta do texto e escurecimento leve — depende de um clipe
  // calmo e escuro para manter contraste. Sem branding, para não poluir.
  minimal: {
    id: "minimal",
    name: { pt: "Minimalista", en: "Minimal" },
    description: {
      pt: "Muito espaço, tipografia elegante e escurecimento leve. Peça um vídeo calmo.",
      en: "Lots of space, elegant type and a light overlay. Pick a calm clip.",
    },
    font: "cormorant",
    fontSizePx: 68,
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacingEm: 0.008,
    align: "center",
    anchor: "center",
    color: WHITE,
    // Coluna estreita de propósito: linhas curtas são o que cria o "ar".
    maxWidthPct: 0.76,
    maxLines: 8,
    scrim: { kind: "vignette", intensity: 0.5 },
    showReference: true,
    showBranding: false,
    reference: {
      font: "cormorant",
      fontSizePx: 30,
      fontWeight: 600,
      letterSpacingEm: 0.22,
      color: WHITE,
      opacity: 0.7,
      uppercase: true,
      gapPx: 64,
    },
    branding: {
      font: "spaceGrotesk",
      fontSizePx: 22,
      fontWeight: 500,
      letterSpacingEm: 0.28,
      color: WHITE,
      opacity: 0.4,
      uppercase: true,
    },
  },

  // ── 4. Reflexivo ────────────────────────────────────────────────────────────
  // Prioriza legibilidade acima de tudo: sans média, gradiente nas duas pontas
  // (centro mais claro), corpo um pouco menor com entrelinha generosa.
  reflective: {
    id: "reflective",
    name: { pt: "Reflexivo", en: "Reflective" },
    description: {
      pt: "Contraste alto e entrelinha generosa. A opção mais legível no celular.",
      en: "High contrast and generous leading. The most readable on a phone.",
    },
    font: "inter",
    fontSizePx: 56,
    fontWeight: 500,
    lineHeight: 1.55,
    letterSpacingEm: 0,
    align: "center",
    anchor: "center",
    color: WHITE,
    maxWidthPct: 0.88,
    maxLines: 10,
    scrim: { kind: "gradientEdges", intensity: 0.66 },
    showReference: true,
    showBranding: true,
    reference: {
      font: "inter",
      fontSizePx: 28,
      fontWeight: 600,
      letterSpacingEm: 0.14,
      color: WHITE,
      opacity: 0.78,
      uppercase: true,
      gapPx: 60,
    },
    branding: {
      font: "spaceGrotesk",
      fontSizePx: 24,
      fontWeight: 500,
      letterSpacingEm: 0.24,
      color: WHITE,
      opacity: 0.5,
      uppercase: true,
    },
  },
};

export const STYLE_ORDER: StyleId[] = ["classic", "cinematic", "minimal", "reflective"];

// ─── Personalização ───────────────────────────────────────────────────────────
// A interface aplica ajustes por cima de um preset. Tudo é opcional: o que não
// vier fica como o preset definiu.

export interface StyleOverrides {
  font?: FontId;
  /** Multiplicador sobre o fontSize do preset (0.7 = 30% menor). */
  fontScale?: number;
  anchor?: TextAnchor;
  align?: "left" | "center";
  color?: string;
  scrimKind?: ScrimKind;
  /** 0–1. Substitui a intensidade do preset. */
  scrimIntensity?: number;
  showReference?: boolean;
  showBranding?: boolean;
}

const MIN_FONT_SCALE = 0.6;
const MAX_FONT_SCALE = 1.6;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Aplica os ajustes da interface sobre um preset, devolvendo um novo estilo.
 * Não muta o preset — `STYLES` precisa continuar sendo a referência limpa.
 */
export function applyOverrides(style: ReelStyle, overrides: StyleOverrides = {}): ReelStyle {
  const scale = clamp(overrides.fontScale ?? 1, MIN_FONT_SCALE, MAX_FONT_SCALE);

  return {
    ...style,
    font: overrides.font ?? style.font,
    fontSizePx: Math.round(style.fontSizePx * scale),
    anchor: overrides.anchor ?? style.anchor,
    align: overrides.align ?? style.align,
    color: overrides.color ?? style.color,
    scrim: {
      kind: overrides.scrimKind ?? style.scrim.kind,
      intensity: clamp(overrides.scrimIntensity ?? style.scrim.intensity, 0, 1),
    },
    showReference: overrides.showReference ?? style.showReference,
    showBranding: overrides.showBranding ?? style.showBranding,
    reference: {
      ...style.reference,
      color: overrides.color ?? style.reference.color,
      // A referência acompanha a escala do versículo, mas com menos amplitude:
      // ela precisa continuar secundária mesmo com o versículo bem grande.
      fontSizePx: Math.round(style.reference.fontSizePx * (1 + (scale - 1) * 0.5)),
    },
    branding: {
      ...style.branding,
      color: overrides.color ?? style.branding.color,
    },
  };
}

export function isStyleId(value: string): value is StyleId {
  return value in STYLES;
}
