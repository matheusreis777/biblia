/**
 * Verificação do motor de layout do gerador de Reels.
 *
 * Roda o layout de versículos curto/médio/longo nos quatro estilos e confere
 * as regras que o briefing pede: nenhuma linha estourando a coluna, nada
 * invadindo a área segura das plataformas, corpo reduzido quando necessário.
 * Também rasteriza cada camada em PNG para inspeção visual.
 *
 * Uso:  npm run verify:layout
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

import { FONT_VARIANTS } from "../src/reels/fonts";
import { layoutReel } from "../src/reels/layout";
import { createMeasurer, fontKey } from "../src/reels/measure";
import { parse, toArrayBuffer } from "../src/reels/opentypeCompat";
import { safeBox } from "../src/reels/safeArea";
import { STYLES, STYLE_ORDER } from "../src/reels/styles";
import { renderLayers } from "../src/reels/svg";
import { detectTheme } from "../src/reels/themes";

const FONTS_DIR = join(process.cwd(), "public", "fonts");
const OUT_DIR = join(process.cwd(), "node_modules", ".tmp", "reels-verify");
mkdirSync(OUT_DIR, { recursive: true });

const fontPaths = FONT_VARIANTS.map((v) => join(FONTS_DIR, v.file));
const fonts = new Map(
  FONT_VARIANTS.map((v) => {
    const buffer = readFileSync(join(FONTS_DIR, v.file));
    return [fontKey(v.fontId, v.weight), parse(toArrayBuffer(buffer))] as const;
  }),
);
const measurer = createMeasurer(fonts);

const CASES = [
  { ref: "João 11:35", text: "Jesus chorou." },
  {
    ref: "João 3:16",
    text:
      "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, " +
      "para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
  },
  {
    ref: "Salmos 91:1-2",
    text:
      "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará. " +
      "Direi do Senhor: Ele é o meu Deus, o meu refúgio, a minha fortaleza, e nele confiarei.",
  },
];

const safe = safeBox();
let failures = 0;

console.log(`fontes carregadas: ${fonts.size}`);

for (const testCase of CASES) {
  const theme = detectTheme(testCase.text, "pt-BR");
  console.log(
    `\n=== ${testCase.ref} — ${testCase.text.length} caracteres — tema: ${theme.id} ===`,
  );

  for (const styleId of STYLE_ORDER) {
    const layout = layoutReel(
      {
        verseText: testCase.text,
        reference: testCase.ref,
        style: STYLES[styleId],
        brandingText: "Bíblia Online",
        durationSec: 15,
      },
      measurer,
    );

    const verse = layout.verse;

    const widest = Math.max(
      ...verse.lines.map((line) =>
        measurer.measure(
          line,
          verse.fontId,
          verse.fontWeight,
          verse.fontSizePx,
          verse.letterSpacingPx,
        ),
      ),
    );

    const lowest = layout.branding
      ? layout.branding.y + layout.branding.height
      : layout.reference
        ? layout.reference.y + layout.reference.height
        : verse.y + verse.height;

    const widthOk = widest - verse.width <= 0.5;
    const topOk = verse.y >= safe.y - 0.5;
    const bottomOk = lowest <= safe.y + safe.height + 0.5;
    const ok = widthOk && topOk && bottomOk;
    if (!ok) failures++;

    const notes = layout.notes.map((n) => n.kind).join(",") || "-";
    console.log(
      `  ${ok ? "OK   " : "FALHA"} ${styleId.padEnd(11)} ` +
        `${String(verse.lines.length).padStart(2)} linhas @ ${verse.fontSizePx}px  ` +
        `linha ${widest.toFixed(0)}/${verse.width.toFixed(0)}px  ` +
        `y ${verse.y.toFixed(0)}..${lowest.toFixed(0)} (seguro ${safe.y}..${safe.y + safe.height})  ` +
        `${notes}`,
    );
    if (!widthOk) console.log(`         estouro de largura: ${(widest - verse.width).toFixed(1)}px`);
    if (!topOk) console.log(`         bloco acima da área segura`);
    if (!bottomOk) console.log(`         bloco abaixo da área segura`);

    const slug = `${testCase.ref.replace(/[^a-zA-Z0-9]/g, "")}-${styleId}`;
    for (const [name, svg] of Object.entries(renderLayers(layout))) {
      if (!svg) continue;
      const png = new Resvg(svg, {
        fitTo: { mode: "width", value: layout.width },
        font: { fontFiles: fontPaths, loadSystemFonts: false },
      })
        .render()
        .asPng();
      writeFileSync(join(OUT_DIR, `${slug}-${name}.png`), png);
    }
  }
}

console.log(`\n${failures === 0 ? "TUDO OK" : `${failures} FALHA(S)`} — PNGs em ${OUT_DIR}`);
process.exit(failures === 0 ? 0 : 1);
