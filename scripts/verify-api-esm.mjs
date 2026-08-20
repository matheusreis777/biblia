/**
 * Verifica que as funções de api/ carregam no runtime da Vercel.
 *
 * POR QUE ISTO EXISTE — este bug já quebrou o deploy uma vez, de forma
 * silenciosa: `npm run build` passava, o deploy era publicado, e TODAS as rotas
 * de api/reels/ devolviam FUNCTION_INVOCATION_FAILED. Nenhuma verificação local
 * pegava, porque em desenvolvimento o Vite resolve os imports com o próprio
 * resolvedor.
 *
 * A causa: o package.json tem `"type": "module"`, e o builder da Vercel decide
 *
 *     const isEsm = ext === ".mjs" || ext === ".mts" ||
 *                   pkg.type === "module" && [".js",".ts",".tsx"].includes(ext);
 *
 * ou seja, trata nossos `.ts` como ESM. Ele compila cada arquivo para `.js`
 * mas NÃO reescreve os especificadores dos imports. Sob ESM o Node exige
 * extensão explícita e não faz resolução de diretório, então
 * `from "../../src/reels/themes"` e `from "./providers"` quebram em produção
 * mesmo funcionando localmente.
 *
 * Este script reproduz exatamente essas condições: compila sem empacotar, para
 * ESM, e importa cada rota com o Node puro — sem tsx, sem Vite.
 *
 * Uso:  npm run verify:api
 */

import { build } from "esbuild";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const OUT = join(process.cwd(), "node_modules", ".tmp", "api-esm-check");
const ROTAS = [
  "api/bible-passage",
  "api/daily-verse",
  "api/reels/videos",
  "api/reels/quotes",
  "api/reels/voices",
  "api/reels/narration",
  "api/reels/music",
  "api/reels/render",
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// O marcador de ESM precisa existir na saída, senão o Node trataria os .js
// como CommonJS e o teste não valeria nada.
writeFileSync(join(OUT, "package.json"), '{"type":"module"}\n');

await build({
  entryPoints: ["api/**/*.ts", "server/**/*.ts", "src/reels/*.ts"],
  platform: "node",
  format: "esm",
  target: "node22",
  // `bundle: false` é o ponto do teste: sem empacotar, cada import relativo é
  // resolvido pelo Node em tempo de execução, exatamente como na Vercel.
  bundle: false,
  outdir: OUT,
  outbase: ".",
  logLevel: "warning",
});

let falhas = 0;

for (const rota of ROTAS) {
  const url = pathToFileURL(join(OUT, `${rota}.js`)).href;
  try {
    const mod = await import(url);
    if (typeof mod.default !== "function") {
      throw new Error("o módulo não exporta um handler padrão");
    }
    console.log(`  OK    /${rota}`);
  } catch (error) {
    falhas++;
    const err = /** @type {NodeJS.ErrnoException} */ (error);
    console.log(`  FALHA /${rota}`);
    console.log(`        ${err.code ?? err.name}: ${String(err.message).split("\n")[0]}`);
  }
}

console.log(
  falhas === 0
    ? "\nTUDO OK — as funções carregam no runtime da Vercel"
    : `\n${falhas} rota(s) NÃO carregariam na Vercel`,
);
process.exit(falhas === 0 ? 0 : 1);
