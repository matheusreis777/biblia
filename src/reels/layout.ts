import { FONT_FAMILIES, resolveWeight } from "./fonts.js";
import { BRAND_GREEN } from "./styles.js";
import { BRANDING_BASELINE_Y, safeBox, SITE_TOP_MARGIN } from "./safeArea.js";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type LayoutNote,
  type LayoutResult,
  type Measurer,
  type ReelSpec,
  type ReelStyle,
  type TextBlock,
} from "./types.js";

// ─── Motor de layout ──────────────────────────────────────────────────────────
// Roda igual no browser (preview) e no servidor (rasterização para o vídeo).
// Não toca em DOM nem em Node: a medição de texto entra por injeção.
//
// Duas coisas resolvem os problemas listados no briefing — linha longa, texto
// cortado, excesso de texto, elemento colado na borda:
//
//   1. quebra de linha balanceada (minimiza a variação de largura entre linhas)
//      em vez de guloso, que deixa a última linha órfã e o bloco torto;
//   2. redução automática do corpo até o bloco caber na área segura.

/** Tamanho de referência para medir uma vez e escalar. */
const REF_SIZE = 1000;

/** Abaixo disso o texto fica ilegível no feed do celular. */
const MIN_FONT_PX = 34;

/** Passo da redução automática. */
const FONT_STEP_PX = 2;

/**
 * Quanto a marca d'água do topo é mais apagada que a assinatura do rodapé.
 *
 * Aplicado sobre a opacidade que o estilo já define para a assinatura, então a
 * marca acompanha a discrição de cada preset em vez de ter um valor fixo que
 * ficaria forte demais no Minimalista e fraco demais no Clássico.
 */
const WATERMARK_OPACITY_FACTOR = 0.8;

interface WordMetrics {
  words: string[];
  /** Largura de cada palavra medida em REF_SIZE, sem letter-spacing. */
  widths: number[];
  spaceWidth: number;
}

function tokenize(text: string): string[] {
  return text.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
}

/**
 * A largura de um texto é linear no corpo da fonte, e o letter-spacing também
 * (é definido em em). Então medimos cada palavra UMA vez em REF_SIZE e
 * escalamos — em vez de re-medir a cada tentativa de redução de corpo.
 */
function measureWords(
  words: string[],
  style: ReelStyle,
  weight: number,
  measurer: Measurer,
): WordMetrics {
  return {
    words,
    widths: words.map((w) => measurer.measure(w, style.font, weight, REF_SIZE, 0)),
    spaceWidth: measurer.measure(" ", style.font, weight, REF_SIZE, 0),
  };
}

/** Largura da linha formada pelas palavras [from, to], no corpo informado. */
function lineWidth(
  m: WordMetrics,
  from: number,
  to: number,
  fontSizePx: number,
  letterSpacingPx: number,
): number {
  let glyphs = 0;
  let chars = 0;
  for (let i = from; i <= to; i++) {
    glyphs += m.widths[i];
    chars += [...m.words[i]].length;
  }
  glyphs += m.spaceWidth * (to - from);
  chars += to - from; // os espaços também recebem tracking

  const scaled = (glyphs * fontSizePx) / REF_SIZE;
  return scaled + letterSpacingPx * Math.max(0, chars - 1);
}

/**
 * Quebra balanceada por programação dinâmica: minimiza a soma dos quadrados do
 * espaço que sobra em cada linha, INCLUINDO a última.
 *
 * Incluir a última linha é o que diferencia isto de um quebrador de parágrafo
 * comum. Num parágrafo de livro a última linha é livre; num bloco de texto
 * centralizado na tela, uma última linha com uma palavra solta estraga a
 * composição. Ao cobrar o rag da última linha, o bloco sai visualmente
 * equilibrado.
 */
function breakLines(
  m: WordMetrics,
  maxWidth: number,
  fontSizePx: number,
  letterSpacingPx: number,
): string[] {
  const n = m.words.length;
  if (n === 0) return [];

  const cost = new Array<number>(n + 1).fill(Number.POSITIVE_INFINITY);
  const nextBreak = new Array<number>(n + 1).fill(n);
  cost[n] = 0;

  for (let i = n - 1; i >= 0; i--) {
    for (let j = i; j < n; j++) {
      const w = lineWidth(m, i, j, fontSizePx, letterSpacingPx);

      // Uma palavra sozinha maior que a coluna precisa ser aceita mesmo
      // estourando — quebrar dentro da palavra ficaria pior.
      if (w > maxWidth && j > i) break;

      const slack = Math.max(0, maxWidth - w);
      const total = slack * slack + cost[j + 1];
      if (total < cost[i]) {
        cost[i] = total;
        nextBreak[i] = j;
      }
    }
  }

  const lines: string[] = [];
  let i = 0;
  while (i < n) {
    const end = nextBreak[i];
    lines.push(m.words.slice(i, end + 1).join(" "));
    i = end + 1;
  }
  return lines;
}

/**
 * Distância do topo da caixa de linha até a baseline.
 * Mesma fórmula que o browser usa para posicionar texto dentro de uma linha —
 * é o que mantém o preview em HTML alinhado com o SVG rasterizado.
 */
function baselineOffset(
  fontId: ReelStyle["font"],
  weight: number,
  fontSizePx: number,
  lineHeightPx: number,
  measurer: Measurer,
): number {
  const { unitsPerEm, ascender, descender } = measurer.metrics(fontId, weight);
  const ascenderPx = (ascender / unitsPerEm) * fontSizePx;
  const descenderPx = (descender / unitsPerEm) * fontSizePx; // negativo
  const contentHeight = ascenderPx - descenderPx;
  const halfLeading = (lineHeightPx - contentHeight) / 2;
  return halfLeading + ascenderPx;
}

export function layoutReel(spec: ReelSpec, measurer: Measurer): LayoutResult {
  const { style } = spec;
  const notes: LayoutNote[] = [];
  const safe = safeBox();

  const verseWeight = resolveWeight(style.font, style.fontWeight);
  const optical = FONT_FAMILIES[style.font].opticalScale;

  const columnWidth = safe.width * style.maxWidthPct;
  const columnX =
    style.align === "center" ? safe.x + (safe.width - columnWidth) / 2 : safe.x;

  const words = tokenize(spec.verseText);
  const metrics = measureWords(words, style, verseWeight, measurer);

  const brandingWeight = resolveWeight(style.branding.font, style.branding.fontWeight);
  const brandingLineHeight = style.branding.fontSizePx * 1.4;

  const referenceWeight = resolveWeight(style.reference.font, style.reference.fontWeight);
  const referenceText = style.showReference ? formatReference(spec.reference, style) : "";
  const referenceLineHeight = style.reference.fontSizePx * 1.3;

  // A área segura inteira fica para o versículo e a referência: a assinatura
  // vive no rodapé do vídeo, abaixo dela, e não disputa espaço aqui.
  const availableHeight = safe.height;

  // ── Redução automática do corpo ─────────────────────────────────────────────
  // Desce de FONT_STEP em FONT_STEP até o bloco caber em altura e em número de
  // linhas. O primeiro tamanho que couber vence.
  const requestedSize = style.fontSizePx;
  let fontSizePx = requestedSize;
  let lines: string[] = [];

  for (;;) {
    const rendered = Math.round(fontSizePx * optical);
    const letterSpacingPx = style.letterSpacingEm * rendered;
    lines = breakLines(metrics, columnWidth, rendered, letterSpacingPx);

    const verseHeight = lines.length * rendered * style.lineHeight;
    const blockHeight =
      verseHeight + (referenceText ? style.reference.gapPx + referenceLineHeight : 0);

    const fits = lines.length <= style.maxLines && blockHeight <= availableHeight;
    if (fits || fontSizePx <= MIN_FONT_PX) break;

    fontSizePx -= FONT_STEP_PX;
  }

  if (fontSizePx < requestedSize) {
    notes.push({ kind: "fontShrunk", from: requestedSize, to: fontSizePx });
  }

  const renderedSize = Math.round(fontSizePx * optical);
  const letterSpacingPx = style.letterSpacingEm * renderedSize;
  const verseLineHeight = renderedSize * style.lineHeight;
  const verseHeight = lines.length * verseLineHeight;
  const blockHeight =
    verseHeight + (referenceText ? style.reference.gapPx + referenceLineHeight : 0);

  if (blockHeight > availableHeight || lines.length > style.maxLines) {
    notes.push({ kind: "textTooLong", lines: lines.length });
  }

  // ── Posicionamento vertical ─────────────────────────────────────────────────
  const anchorTop = (() => {
    switch (style.anchor) {
      case "bottom":
        return safe.y + availableHeight - blockHeight;
      case "lowerThird":
        return safe.y + availableHeight * 0.58 - blockHeight / 2;
      case "center":
      default:
        return safe.y + (availableHeight - blockHeight) / 2;
    }
  })();

  // Nunca deixa o bloco vazar a área segura, mesmo quando ele não cabe.
  const blockTop = Math.max(
    safe.y,
    Math.min(anchorTop, safe.y + availableHeight - blockHeight),
  );

  const verse: TextBlock = {
    lines,
    fontId: style.font,
    fontWeight: verseWeight,
    fontSizePx: renderedSize,
    lineHeightPx: verseLineHeight,
    letterSpacingPx,
    color: style.color,
    opacity: 1,
    align: style.align,
    x: columnX,
    y: blockTop,
    width: columnWidth,
    height: verseHeight,
    firstBaselineY:
      blockTop +
      baselineOffset(style.font, verseWeight, renderedSize, verseLineHeight, measurer),
  };

  const reference: TextBlock | null = referenceText
    ? (() => {
        const top = blockTop + verseHeight + style.reference.gapPx;
        return {
          lines: [referenceText],
          fontId: style.reference.font,
          fontWeight: referenceWeight,
          fontSizePx: style.reference.fontSizePx,
          lineHeightPx: referenceLineHeight,
          letterSpacingPx: style.reference.letterSpacingEm * style.reference.fontSizePx,
          color: style.reference.color,
          opacity: style.reference.opacity,
          align: style.align,
          x: columnX,
          y: top,
          width: columnWidth,
          height: referenceLineHeight,
          firstBaselineY:
            top +
            baselineOffset(
              style.reference.font,
              referenceWeight,
              style.reference.fontSizePx,
              referenceLineHeight,
              measurer,
            ),
        };
      })()
    : null;

  const branding: TextBlock | null =
    style.showBranding && spec.brandingText.trim()
      ? (() => {
        const brandingText = style.branding.uppercase
          ? spec.brandingText.toUpperCase()
          : spec.brandingText;
        const top =
          BRANDING_BASELINE_Y -
          baselineOffset(
            style.branding.font,
            brandingWeight,
            style.branding.fontSizePx,
            brandingLineHeight,
            measurer,
          );
        return {
          lines: [brandingText],
          fontId: style.branding.font,
          fontWeight: brandingWeight,
          fontSizePx: style.branding.fontSizePx,
          lineHeightPx: brandingLineHeight,
          letterSpacingPx: style.branding.letterSpacingEm * style.branding.fontSizePx,
          color: style.branding.color,
          opacity: style.branding.opacity,
          align: style.align,
          x: style.align === "center" ? safe.x : safe.x,
          y: top,
          width: safe.width,
          height: brandingLineHeight,
          firstBaselineY: BRANDING_BASELINE_Y,
        };
      })()
    : null;

  // ── Marca d'água do site, no topo ───────────────────────────────────────
  // Usa a mesma configuração tipográfica da assinatura do rodapé, para os dois
  // lerem como um par. Duas diferenças de propósito:
  //
  //   cor — o verde da marca é fixo e não segue o seletor de cor do texto;
  //   opacidade — mais baixa que a da assinatura, para ficar como marca
  //     d'água: presente para quem procura, sem competir com o versículo.
  const site: TextBlock | null =
    style.showBranding && spec.siteText.trim()
      ? (() => {
          const text = style.branding.uppercase
            ? spec.siteText.toUpperCase()
            : spec.siteText;
          return {
            lines: [text],
            fontId: style.branding.font,
            fontWeight: brandingWeight,
            fontSizePx: style.branding.fontSizePx,
            lineHeightPx: brandingLineHeight,
            letterSpacingPx: style.branding.letterSpacingEm * style.branding.fontSizePx,
            color: BRAND_GREEN,
            opacity: style.branding.opacity * WATERMARK_OPACITY_FACTOR,
            align: style.align,
            x: safe.x,
            y: SITE_TOP_MARGIN,
            width: safe.width,
            height: brandingLineHeight,
            firstBaselineY:
              SITE_TOP_MARGIN +
              baselineOffset(
                style.branding.font,
                brandingWeight,
                style.branding.fontSizePx,
                brandingLineHeight,
                measurer,
              ),
          };
        })()
      : null;

  return {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    scrim: style.scrim,
    verse,
    reference,
    branding,
    site,
    notes,
  };
}

/**
 * A API devolve a referência já formatada ("João 3:16"). Só normalizamos o
 * espaçamento e aplicamos a caixa alta do estilo.
 */
function formatReference(reference: string, style: ReelStyle): string {
  const clean = reference.trim().replace(/\s+/g, " ");
  return style.reference.uppercase ? clean.toUpperCase() : clean;
}
