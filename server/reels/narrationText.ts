// ─── Texto a narrar ───────────────────────────────────────────────────────────
// Usado pela rota de narração e pela pipeline de render, para que a prévia e o
// vídeo falem exatamente a mesma coisa.

export interface NarrationTextInput {
  verseText: string;
  reference: string;
  includeReference: boolean;
  /** Tag BCP-47 da voz; decide como a referência é lida. */
  language?: string;
  /**
   * "verse" lê a referência como "capítulo X, versículo Y"; "quote" lê o autor
   * como está.
   *
   * Sem essa distinção, um autor terminado em número — "Einstein 1932" — vira
   * "Einstein, capítulo 1932", porque o padrão de referência bíblica casa.
   */
  contentType?: "verse" | "quote";
}

/**
 * Converte "João 3:16" em "João, capítulo 3, versículo 16".
 *
 * Não é firula: os sintetizadores leem "3:16" como hora ("três e dezesseis") ou
 * soletram os dois-pontos. Escrever por extenso é o que faz a referência soar
 * como alguém citando a Bíblia.
 *
 * Intervalos viram "versículos 1 a 2"; listas ("1,3") viram "versículos 1 e 3".
 */
function referenceToSpeech(reference: string, language: string): string {
  const pt = language.startsWith("pt");
  const words = pt
    ? { chapter: "capítulo", verse: "versículo", verses: "versículos", to: "a", and: "e" }
    : { chapter: "chapter", verse: "verse", verses: "verses", to: "to", and: "and" };

  const match = reference.trim().match(/^(.+?)\s+(\d+)(?::([\d,\s-]+))?$/);
  if (!match) return reference.trim();

  const [, book, chapter, versePart] = match;
  const head = `${book.trim()}, ${words.chapter} ${chapter}`;
  if (!versePart) return head;

  const verses = versePart.trim().replace(/\s+/g, "");
  const multiple = /[,-]/.test(verses);
  const spoken = verses
    .replace(/-/g, ` ${words.to} `)
    .replace(/,/g, ` ${words.and} `);

  return `${head}, ${multiple ? words.verses : words.verse} ${spoken}`;
}

/**
 * Monta o texto final. Devolve string vazia quando não há versículo — quem
 * chama trata isso como entrada inválida.
 */
export function narrationText(input: NarrationTextInput): string {
  const verse = input.verseText.trim().replace(/\s+/g, " ");
  if (!verse) return "";

  if (!input.includeReference || !input.reference.trim()) return verse;

  // A pausa antes da referência vem de terminar a frase do versículo com
  // pontuação: sem isso, a voz emenda o versículo na referência.
  const separator = /[.!?…]$/.test(verse) ? " " : ". ";
  const spoken =
    (input.contentType ?? "verse") === "verse"
      ? referenceToSpeech(input.reference, input.language ?? "pt-BR")
      : input.reference.trim().replace(/\s+/g, " ");

  return verse + separator + spoken;
}
