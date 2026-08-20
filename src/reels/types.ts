// ─── Tipos do gerador de Reels ────────────────────────────────────────────────
// Este módulo é TS puro: sem DOM, sem React, sem Node. É importado tanto pela
// página no browser quanto pelas funções em /api, e é o que garante que o
// preview e o MP4 final sejam a mesma composição.

/** Todo o sistema compõe num canvas fixo de 1080x1920 (9:16). */
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

// ─── Temas ────────────────────────────────────────────────────────────────────

export type ThemeId =
  | "faith" | "hope" | "peace" | "love" | "strength" | "trust" | "prayer"
  | "gratitude" | "god" | "protection" | "wisdom" | "purpose" | "overcoming";

export interface VerseTheme {
  id: ThemeId;
  /** Rótulo exibido na interface. */
  label: { pt: string; en: string };
  /** Buscas em inglês enviadas aos provedores de vídeo, da melhor para a pior. */
  queries: string[];
  /** Palavras usadas para inferir o tema a partir do texto do versículo. */
  keywords: { pt: string[]; en: string[] };
}

// ─── Vídeos ───────────────────────────────────────────────────────────────────

export interface ReelVideo {
  id: string;
  /** Qual VideoProvider devolveu este clipe. */
  providerId: string;
  width: number;
  height: number;
  durationSec: number;
  /** Imagem estática para a grade. */
  thumbUrl: string;
  /** Arquivo leve (≤720p) usado no preview dentro do browser. */
  previewUrl: string;
  /** Melhor arquivo disponível — é o que o FFmpeg baixa para renderizar. */
  downloadUrl: string;
  author: { name: string; url: string };
  /** Página do clipe no site do provedor, para dar crédito. */
  sourceUrl: string;
}

// ─── Tipografia ───────────────────────────────────────────────────────────────

export type FontId = "inter" | "spaceGrotesk" | "cormorant" | "playfair";

export interface FontMetrics {
  unitsPerEm: number;
  ascender: number;
  descender: number;
}

/**
 * Medição de texto, injetada pelo chamador.
 *
 * O browser e o servidor passam implementações diferentes, mas ambas leem os
 * MESMOS arquivos .ttf de public/fonts — por isso a quebra de linha do preview
 * é idêntica à do vídeo renderizado.
 */
export interface Measurer {
  /** Largura do texto em px, já incluindo o letter-spacing entre glifos. */
  measure(
    text: string,
    fontId: FontId,
    weight: number,
    sizePx: number,
    letterSpacingPx: number,
  ): number;
  metrics(fontId: FontId, weight: number): FontMetrics;
}

// ─── Estilo ───────────────────────────────────────────────────────────────────

export type StyleId = "classic" | "cinematic" | "minimal" | "reflective";

/** Escurecimento aplicado sobre o vídeo para o texto ter contraste. */
export type ScrimKind =
  /** Escurecimento uniforme na tela inteira. */
  | "solid"
  /** Gradiente subindo do rodapé — deixa o topo do vídeo limpo. */
  | "gradientBottom"
  /** Gradiente nas duas pontas, centro mais claro. */
  | "gradientEdges"
  /** Vinheta radial: escurece os cantos, preserva o centro. */
  | "vignette";

export interface ScrimSpec {
  kind: ScrimKind;
  /** 0 = sem escurecimento, 1 = máximo. */
  intensity: number;
}

/** Onde o bloco do versículo se ancora dentro da área segura. */
export type TextAnchor = "center" | "lowerThird" | "bottom";

export interface ReelStyle {
  id: StyleId;
  name: { pt: string; en: string };
  description: { pt: string; en: string };

  font: FontId;
  /** Tamanho desejado do versículo, em px do canvas 1080x1920. */
  fontSizePx: number;
  fontWeight: number;
  lineHeight: number;
  /** Em em, multiplicado pelo fontSize. Negativo aperta o texto. */
  letterSpacingEm: number;
  align: "left" | "center";
  anchor: TextAnchor;
  color: string;
  /** Largura útil do texto como fração da largura da área segura. */
  maxWidthPct: number;
  /** Acima disso o layout reduz a fonte em vez de criar mais linhas. */
  maxLines: number;

  scrim: ScrimSpec;

  showReference: boolean;
  showBranding: boolean;

  reference: {
    font: FontId;
    fontSizePx: number;
    fontWeight: number;
    letterSpacingEm: number;
    color: string;
    opacity: number;
    uppercase: boolean;
    /** Distância entre a última linha do versículo e a referência. */
    gapPx: number;
  };

  branding: {
    font: FontId;
    fontSizePx: number;
    fontWeight: number;
    letterSpacingEm: number;
    color: string;
    opacity: number;
    uppercase: boolean;
  };
}

// ─── Entrada da composição ────────────────────────────────────────────────────

export interface ReelSpec {
  verseText: string;
  reference: string;
  style: ReelStyle;
  /** Assinatura no rodapé do vídeo. */
  brandingText: string;
  /** Endereço no topo do vídeo, na cor da marca. */
  siteText: string;
  durationSec: number;
}

// ─── Resultado do layout ──────────────────────────────────────────────────────

export interface TextBlock {
  lines: string[];
  fontId: FontId;
  fontWeight: number;
  fontSizePx: number;
  lineHeightPx: number;
  letterSpacingPx: number;
  color: string;
  opacity: number;
  align: "left" | "center";
  /** Caixa ocupada, em px do canvas. x é a borda esquerda da coluna de texto. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Baseline da primeira linha, medida do topo do canvas. */
  firstBaselineY: number;
}

export interface LayoutResult {
  width: number;
  height: number;
  scrim: ScrimSpec;
  verse: TextBlock;
  reference: TextBlock | null;
  /** Assinatura no rodapé. */
  branding: TextBlock | null;
  /** Endereço no topo. */
  site: TextBlock | null;
  /** Ajustes que o motor precisou fazer — úteis para avisar na interface. */
  notes: LayoutNote[];
}

export type LayoutNote =
  /** A fonte foi reduzida para o texto caber na área segura. */
  | { kind: "fontShrunk"; from: number; to: number }
  /** O versículo é longo demais mesmo no menor tamanho legível. */
  | { kind: "textTooLong"; lines: number };

// ─── Render ───────────────────────────────────────────────────────────────────

export type RenderStage =
  | "preparing"
  | "composing"
  | "typesetting"
  | "narrating"
  | "fetchingMusic"
  | "fetchingVideo"
  | "rendering"
  | "done";

export interface RenderProgress {
  stage: RenderStage;
  /** 0–100 dentro da etapa atual, quando a etapa consegue reportar. */
  pct?: number;
}
