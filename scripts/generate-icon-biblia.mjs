// Gera, a partir de public/icon-biblia.png:
//   - public/og-image.jpg  prévia de links (WhatsApp, Instagram, etc.);
//   - public/favicon.ico   ícone da aba do navegador.
// Rode `npm run icon-biblia` depois de mexer no ícone ou no texto da prévia.
//
// Mesmo caminho dos ícones do PWA: o resvg (já usado no render dos Reels)
// rasteriza o SVG e o ffmpeg-static (idem) converte a prévia para JPEG. JPEG
// porque o WhatsApp descarta prévias acima de ~300KB e um PNG deste tamanho
// passa disso.

import { Resvg } from "@resvg/resvg-js";
import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const icon = readFileSync(join(publicDir, "icon-biblia.png")).toString("base64");

/**
 * O tile branco do ícone, recortado num quadrado de lado `size` em (x, y). No
 * PNG de 1312×1199 ele ocupa só o retângulo do viewBox; o resto é transparente.
 */
const tile = (x, y, size) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="230 197 851 841">` +
  `<image width="1312" height="1199" href="data:image/png;base64,${icon}"/></svg>`;

const report = (file) => console.log(`${file}  ${(statSync(join(publicDir, file)).size / 1024).toFixed(1)} KB`);

// ─── og-image.jpg ─────────────────────────────────────────────────────────────
// 1200×630 é o que as tags og:image:width/height declaram (vite/openGraph.ts).
// Composição centralizada de propósito: o WhatsApp e o Instagram às vezes
// recortam a prévia num quadrado central, e o ícone e o título sobrevivem.
{
  const W = 1200;
  const H = 630;
  const tileSize = 188;

  // Cores do tema escuro (src/index.css): --background, --foreground,
  // --muted-foreground e o verde --primary.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="30%" r="55%">
      <stop offset="0" stop-color="#22c35d" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#22c35d" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#0d0d0d"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${tile((W - tileSize) / 2, 72, tileSize)}
  <text x="${W / 2}" y="378" text-anchor="middle" font-family="ReelSpaceGrotesk700"
        font-size="84" fill="#f2f2f2" letter-spacing="-1.5">Bíblia Online</text>
  <rect x="${W / 2 - 32}" y="408" width="64" height="4" rx="2" fill="#22c35d"/>
  <text text-anchor="middle" font-family="ReelInter400" font-size="31" fill="#a3a3a3">
    <tspan x="${W / 2}" y="474">Leia a Bíblia em português e inglês, salve versículos</tspan>
    <tspan x="${W / 2}" y="518">favoritos e gere Reels a partir deles.</tspan>
  </text>
</svg>`;

  const png = new Resvg(svg, {
    // Os .ttf foram renomeados por scripts/prepare-fonts.py: a família é o nome
    // Reel* abaixo, não "Inter" ou "Space Grotesk".
    font: {
      fontFiles: [
        join(publicDir, "fonts/SpaceGrotesk-Bold.ttf"),
        join(publicDir, "fonts/Inter-Regular.ttf"),
      ],
      loadSystemFonts: false,
    },
  })
    .render()
    .asPng();

  execFileSync(
    ffmpeg,
    ["-y", "-loglevel", "error", "-f", "png_pipe", "-i", "pipe:0", "-q:v", "3", join(publicDir, "og-image.jpg")],
    { input: png },
  );
  report("og-image.jpg");
}

// ─── favicon.ico ──────────────────────────────────────────────────────────────
// 16 e 32 para a aba (1x e 2x), 48 para o atalho do Windows. O .ico só empacota
// PNGs: formato que todo navegador e o Windows aceitam desde o Vista.
{
  // O resvg reduzindo 1312px direto para 16px amostra poucos pixels e a 16px o
  // livro vira um borrão. Rasteriza grande e deixa o ffmpeg reduzir por média
  // de área, que preserva a cruz.
  const large = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${tile(0, 0, 512)}</svg>`)
    .render()
    .asPng();
  const pngs = [16, 32, 48].map((size) => ({
    size,
    data: execFileSync(
      ffmpeg,
      ["-loglevel", "error", "-f", "png_pipe", "-i", "pipe:0", "-vf", `scale=${size}:${size}:flags=area`,
       "-frames:v", "1", "-c:v", "png", "-f", "image2pipe", "pipe:1"],
      { input: large },
    ),
  }));

  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(1, 2); // tipo 1 = ícone
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry); // largura
    header.writeUInt8(size, entry + 1); // altura
    header.writeUInt16LE(1, entry + 4); // planos de cor
    header.writeUInt16LE(32, entry + 6); // bits por pixel
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });

  writeFileSync(join(publicDir, "favicon.ico"), Buffer.concat([header, ...pngs.map((p) => p.data)]));
  report("favicon.ico");
}
