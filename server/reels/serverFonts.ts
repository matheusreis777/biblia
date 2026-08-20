import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FONT_VARIANTS } from "../../src/reels/fonts.js";
import { createMeasurer, fontKey } from "../../src/reels/measure.js";
import { parse, toArrayBuffer, type Font } from "../../src/reels/opentypeCompat.js";
import type { Measurer } from "../../src/reels/types.js";

// ─── Fontes no servidor ───────────────────────────────────────────────────────
// Lê os mesmos .ttf que o browser baixa de /fonts. Precisam ser exatamente os
// mesmos arquivos, senão a quebra de linha do preview e a do vídeo divergem.
//
// Na Vercel, public/ não entra no bundle da função automaticamente — o
// vercel.json declara includeFiles para essa rota. Se você mover as fontes,
// atualize os dois lugares.

const CANDIDATE_DIRS = [
  join(process.cwd(), "public", "fonts"),
  // Fallback para quando o cwd da função não é a raiz do projeto.
  join(process.cwd(), "fonts"),
];

let cachedDir: string | null = null;

export function fontsDir(): string {
  if (cachedDir) return cachedDir;

  for (const dir of CANDIDATE_DIRS) {
    if (existsSync(join(dir, FONT_VARIANTS[0].file))) {
      cachedDir = dir;
      return dir;
    }
  }

  throw new Error(
    `Fontes do Reel não encontradas. Procurei em: ${CANDIDATE_DIRS.join(", ")}. ` +
      `Rode "npm run fonts" para gerá-las.`,
  );
}

/** Caminhos absolutos dos .ttf — é o que o resvg precisa. */
export function fontFilePaths(): string[] {
  const dir = fontsDir();
  return FONT_VARIANTS.map((v) => join(dir, v.file));
}

let cachedMeasurer: Measurer | null = null;

/**
 * Medidor compartilhado. As fontes são lidas uma única vez por instância da
 * função — em execuções seguidas na mesma instância, o custo é zero.
 */
export function serverMeasurer(): Measurer {
  if (cachedMeasurer) return cachedMeasurer;

  const dir = fontsDir();
  const fonts = new Map<string, Font>(
    FONT_VARIANTS.map((v) => {
      const buffer = readFileSync(join(dir, v.file));
      return [fontKey(v.fontId, v.weight), parse(toArrayBuffer(buffer))] as const;
    }),
  );

  cachedMeasurer = createMeasurer(fonts);
  return cachedMeasurer;
}
