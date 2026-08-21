import { parse as parseEsm } from "opentype.js/dist/opentype.mjs";
import type { Font } from "opentype.js";

// ─── Compatibilidade do opentype.js ───────────────────────────────────────────
// O pacote (v2) publica dois bundles e nenhum funciona nos dois ambientes com
// um import comum:
//
//   dist/opentype.js   (campo "main", CJS)  — monta os exports dentro de uma
//     fábrica UMD com spread, então o detector de exports do Node não enxerga
//     os nomes. `import { parse } from "opentype.js"` falha no Node ESM.
//   dist/opentype.mjs  (campo "module", ESM) — tem os named exports, mas NÃO
//     tem default. `import opentype from "opentype.js"` falha aqui.
//
// Como o pacote não declara um mapa "exports", apontar direto para o arquivo
// ESM é permitido e resolve para browser, dev server e função da Vercel de uma
// vez só. Se um dia isso quebrar numa atualização, é o único lugar a corrigir.

export type { Font };

export const parse = parseEsm as (buffer: ArrayBuffer) => Font;

/**
 * Converte um Buffer do Node no ArrayBuffer que o parse espera.
 *
 * `buffer.buffer` sozinho não serve: o Node aloca Buffers pequenos dentro de um
 * pool compartilhado, então essa propriedade costuma apontar para uma região
 * bem maior que o arquivo — e o parse leria lixo.
 */
export function toArrayBuffer(buffer: Uint8Array): ArrayBuffer {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
}
