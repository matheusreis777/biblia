/**
 * Tipos para o caminho ESM profundo do opentype.js.
 *
 * O pacote não publica declarações para `dist/opentype.mjs` — só para a raiz,
 * via @types/opentype.js. Sem isto, importar o arquivo ESM direto (que é o que
 * `opentypeCompat.ts` precisa fazer; veja o porquê lá) dá TS7016, "implicitly
 * has an 'any' type".
 *
 * O bundle ESM expõe exatamente a mesma API da raiz, então reaproveitar as
 * declarações dela é correto — e evita um `@ts-expect-error`, que era pior:
 * ele é necessário sob `moduleResolution: bundler` e desnecessário sob a
 * resolução que o builder da Vercel usa, então virava erro TS2578 no log de
 * build lá justamente por NÃO ter nada para suprimir.
 */
declare module "opentype.js/dist/opentype.mjs" {
  export * from "opentype.js";
}
