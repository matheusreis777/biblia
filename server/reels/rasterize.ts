import { Resvg } from "@resvg/resvg-js";

import { renderLayers } from "../../src/reels/svg";
import type { LayoutResult } from "../../src/reels/types";
import { fontFilePaths } from "./serverFonts";

// ─── Rasterização ─────────────────────────────────────────────────────────────
// Converte as camadas SVG em PNGs RGBA que o FFmpeg sobrepõe ao vídeo.
//
// Por que SVG + resvg em vez do drawtext do FFmpeg: drawtext não quebra linha,
// não tem controle de tracking e não desenha sombra decente. O resultado teria
// cara de template automático. Com SVG, a mesma composição que o browser mostra
// no preview é a que vai para o vídeo.

export interface RasterizedLayers {
  scrim: Buffer;
  verse: Buffer;
  meta: Buffer | null;
}

function toPng(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      // Só as nossas fontes: carregar as do sistema faria o resultado depender
      // da máquina onde o render rodou.
      fontFiles: fontFilePaths(),
      loadSystemFonts: false,
    },
  });
  return Buffer.from(resvg.render().asPng());
}

export function rasterizeLayers(layout: LayoutResult): RasterizedLayers {
  const layers = renderLayers(layout);
  return {
    scrim: toPng(layers.scrim, layout.width),
    verse: toPng(layers.verse, layout.width),
    meta: layers.meta ? toPng(layers.meta, layout.width) : null,
  };
}
