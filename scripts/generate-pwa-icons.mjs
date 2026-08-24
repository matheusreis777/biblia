// Gera os PNGs do manifesto a partir de public/favicon.svg.
//
// Os ícones não são versionados como binários "mágicos": rode `npm run icons`
// depois de mexer no favicon e eles se refazem. O resvg já é dependência do
// projeto (o render dos Reels usa o mesmo rasterizador), então não entra
// ferramenta nova só para isto.
//
// Três formatos, porque cada plataforma recorta de um jeito:
//   - `any`      quadrado de cantos arredondados, como um ícone de app;
//   - `maskable` quadrado cheio, com o logo dentro da zona segura (80%) que o
//                Android pode recortar em círculo/losango sem cortar nada;
//   - `apple`    quadrado cheio sem arredondar — o iOS arredonda sozinho, e
//                cantos transparentes viram preto na tela de início.

import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

/** Fundo do ícone: mesmo `--background` do tema escuro. */
const BACKGROUND = "#0d0d0d";

// O favicon declara cada cor duas vezes: o hexadecimal e, logo depois, o mesmo
// tom em `color(display-p3 …)`. O navegador fica com o segundo; o resvg não
// entende a função e resolve tudo para preto. Tirar a declaração wide-gamut
// devolve a vitória ao hexadecimal, que é justamente o fallback pretendido.
const source = readFileSync(join(publicDir, "favicon.svg"), "utf8").replace(
  /(?:fill|stop-color):color\(display-p3[^)]*\);?/g,
  "",
);
const [, viewBox] = source.match(/viewBox="([^"]+)"/) ?? [];
if (!viewBox) throw new Error("favicon.svg sem viewBox");
const [, , logoWidth, logoHeight] = viewBox.split(/\s+/).map(Number);

/**
 * Encaixa o favicon inteiro, como <svg> aninhado, num quadrado de lado `size`
 * ocupando `scale` dele. Só o primeiro width/height é trocado: os seguintes
 * pertencem à <mask> interna e precisam continuar no sistema original.
 */
function compose(size, { scale, radius }) {
  const box = size * scale;
  const ratio = Math.min(box / logoWidth, box / logoHeight);
  const width = logoWidth * ratio;
  const height = logoHeight * ratio;

  const logo = source
    .replace("<svg ", `<svg x="${(size - width) / 2}" y="${(size - height) / 2}" `)
    .replace(`width="${logoWidth}"`, `width="${width}"`)
    .replace(`height="${logoHeight}"`, `height="${height}"`);

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" rx="${size * radius}" fill="${BACKGROUND}"/>` +
    logo +
    `</svg>`
  );
}

const icons = [
  // O logo respira mais nos ícones pequenos: a 192px, um traço fino some.
  { file: "pwa-192x192.png", size: 192, scale: 0.62, radius: 0.225 },
  { file: "pwa-512x512.png", size: 512, scale: 0.58, radius: 0.225 },
  // 0.42 mantém o logo dentro do círculo de 80% que o Android pode recortar.
  { file: "pwa-maskable-512x512.png", size: 512, scale: 0.42, radius: 0 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.6, radius: 0 },
];

for (const { file, size, scale, radius } of icons) {
  const png = new Resvg(compose(size, { scale, radius }), {
    fitTo: { mode: "width", value: size },
  })
    .render()
    .asPng();
  writeFileSync(join(publicDir, file), png);
  console.log(`${file}  ${(png.length / 1024).toFixed(1)} KB`);
}
