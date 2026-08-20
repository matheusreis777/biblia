import { fontFamilyName } from "./fonts";
import type { LayoutResult, ScrimSpec, TextBlock } from "./types";

// ─── Camadas em SVG ───────────────────────────────────────────────────────────
// O servidor rasteriza estes SVGs em PNG (resvg) e o FFmpeg os sobrepõe ao
// vídeo. São três camadas separadas porque cada uma entra num tempo diferente:
// o escurecimento aparece quase imediato, o versículo depois, a referência por
// último. Fossem uma camada só, teriam que compartilhar o mesmo fade.

export interface ReelLayers {
  /** Escurecimento/gradiente sobre o vídeo. */
  scrim: string;
  /** O versículo. */
  verse: string;
  /** Referência bíblica e branding. `null` quando ambos estão desligados. */
  meta: string | null;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function svgDocument(width: number, height: number, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}">${body}</svg>`
  );
}

// ─── Escurecimento ────────────────────────────────────────────────────────────

function scrimBody(scrim: ScrimSpec, width: number, height: number): string {
  const i = Math.min(Math.max(scrim.intensity, 0), 1);
  const rect = (fill: string) =>
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${fill}"/>`;

  switch (scrim.kind) {
    case "solid":
      return `<rect x="0" y="0" width="${width}" height="${height}" fill="#000000" fill-opacity="${round(i)}"/>`;

    case "gradientBottom": {
      // Topo limpo, escurecendo em direção ao rodapé. As paradas são
      // deliberadamente não-lineares: um gradiente linear puro deixa uma
      // "faixa" visível no meio da tela.
      const stops = [
        [0, 0],
        [0.32, 0.04],
        [0.55, 0.22],
        [0.75, 0.55],
        [1, 1],
      ] as const;
      const defs = stops
        .map(([offset, alpha]) =>
          `<stop offset="${offset * 100}%" stop-color="#000000" stop-opacity="${round(alpha * i)}"/>`,
        )
        .join("");
      return (
        `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">${defs}</linearGradient></defs>` +
        rect("url(#s)")
      );
    }

    case "gradientEdges": {
      // Escurecimento de base na tela inteira (é ele que dá contraste ao texto
      // centralizado) mais reforço no topo e no rodapé, que dá o ar de cinema.
      const base = 0.55;
      const stops = [
        [0, 1],
        [0.22, base + 0.1],
        [0.5, base],
        [0.78, base + 0.1],
        [1, 1],
      ] as const;
      const defs = stops
        .map(([offset, alpha]) =>
          `<stop offset="${offset * 100}%" stop-color="#000000" stop-opacity="${round(alpha * i)}"/>`,
        )
        .join("");
      return (
        `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">${defs}</linearGradient></defs>` +
        rect("url(#s)")
      );
    }

    case "vignette": {
      // Centro quase limpo, cantos fechados. Mesmo no centro há um piso de
      // escurecimento — sem ele, um clipe claro deixaria o texto ilegível.
      const stops = [
        [0, 0.3],
        [0.45, 0.42],
        [0.75, 0.78],
        [1, 1],
      ] as const;
      const defs = stops
        .map(([offset, alpha]) =>
          `<stop offset="${offset * 100}%" stop-color="#000000" stop-opacity="${round(alpha * i)}"/>`,
        )
        .join("");
      return (
        `<defs><radialGradient id="s" cx="50%" cy="46%" r="78%">${defs}</radialGradient></defs>` +
        rect("url(#s)")
      );
    }

    default:
      return "";
  }
}

// ─── Texto ────────────────────────────────────────────────────────────────────

/**
 * Sombra suave atrás do texto.
 *
 * Não é enfeite: sobre vídeo, o fundo muda a cada quadro e só o escurecimento
 * não garante contraste — basta uma nuvem clara passar atrás de uma linha. A
 * sombra acompanha o corpo da fonte para não virar borrão em texto pequeno.
 */
function shadowFilter(id: string, fontSizePx: number): string {
  const blur = round(fontSizePx * 0.14);
  const dy = round(fontSizePx * 0.03);
  return (
    `<filter id="${id}" x="-25%" y="-25%" width="150%" height="150%">` +
    `<feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" ` +
    `flood-color="#000000" flood-opacity="0.55"/>` +
    `</filter>`
  );
}

function textBody(block: TextBlock, filterId: string): string {
  const anchor = block.align === "center" ? "middle" : "start";
  const x = block.align === "center" ? block.x + block.width / 2 : block.x;

  const tspans = block.lines
    .map((line, index) => {
      const y = block.firstBaselineY + index * block.lineHeightPx;
      return `<tspan x="${round(x)}" y="${round(y)}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return (
    `<text text-anchor="${anchor}" ` +
    `font-family="${fontFamilyName(block.fontId, block.fontWeight)}" ` +
    `font-size="${round(block.fontSizePx)}" ` +
    `letter-spacing="${round(block.letterSpacingPx)}" ` +
    `fill="${block.color}" fill-opacity="${round(block.opacity)}" ` +
    `filter="url(#${filterId})" ` +
    `xml:space="preserve">${tspans}</text>`
  );
}

// ─── API ──────────────────────────────────────────────────────────────────────

export function renderLayers(layout: LayoutResult): ReelLayers {
  const { width, height } = layout;

  const scrim = svgDocument(width, height, scrimBody(layout.scrim, width, height));

  const verse = svgDocument(
    width,
    height,
    `<defs>${shadowFilter("vs", layout.verse.fontSizePx)}</defs>` + textBody(layout.verse, "vs"),
  );

  const metaBlocks = [layout.reference, layout.branding].filter(
    (b): b is TextBlock => b !== null,
  );

  const meta = metaBlocks.length
    ? svgDocument(
        width,
        height,
        `<defs>${metaBlocks
          .map((block, i) => shadowFilter(`m${i}`, block.fontSizePx))
          .join("")}</defs>` +
          metaBlocks.map((block, i) => textBody(block, `m${i}`)).join(""),
      )
    : null;

  return { scrim, verse, meta };
}
