import { BIBLE_BOOKS, clampChapter, type BibleBook } from "@/data/bibleBooks";

// ─── Referências bíblicas ─────────────────────────────────────────────────────
// Transforma o que a pessoa digita em livro + capítulo + versículo:
//
//   "João 3:16"  "joao 3.16"  "jo 3,16"  "Jo3:16"  "Gn 1"  "1 co 13"  "salmos"
//
// Sem chamada de rede: a bible-api.com não tem endpoint de busca, então a busca
// global resolve REFERÊNCIAS aqui e só depois pede o capítulo correspondente
// para mostrar o trecho.

/** Minúsculas, sem pontuação, espaços colapsados — mas COM acento. */
function soften(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** O mesmo, também sem acento. É a forma usada para comparar. */
export function normalize(text: string): string {
  return soften(
    text
      .normalize("NFD")
      // \p{M} = marcas de combinação, que o NFD acabou de separar das letras.
      // É o que faz "João" casar com "joao" e "Gênesis" com "genesis".
      .replace(/\p{M}/gu, ""),
  );
}

// Desempates e apelidos que a comparação genérica não resolve.
//
// "jo" é o caso que obriga a existir esta tabela: sem acento, a abreviação de
// João ("Jo") e o nome de Jó ("Jó") viram a mesma string. Quem digita "jo 3:16"
// quer João — Jó continua acessível por "jó", "job" e pelo nome inteiro.
const ALIASES: Record<string, string> = {
  jo: "joao",
  jn: "joao",
  jhn: "joao",
  job: "jo",
  sl: "salmos",
  ps: "salmos",
  psalm: "salmos",
  psalms: "salmos",
  ap: "apocalipse",
  apoc: "apocalipse",
  rev: "apocalipse",
  gn: "genesis",
  gen: "genesis",
  ex: "exodo",
  mt: "mateus",
  mc: "marcos",
  lc: "lucas",
  at: "atos",
  rm: "romanos",
  hb: "hebreus",
  tg: "tiago",
  pv: "proverbios",
  ec: "eclesiastes",
  is: "isaias",
  jr: "jeremias",
  ez: "ezequiel",
  dn: "daniel",
  ml: "malaquias",
};

interface IndexedBook {
  book: BibleBook;
  keys: string[];
}

/** Índice montado uma vez: 66 livros × ~6 chaves não justifica memoização. */
const INDEX: IndexedBook[] = BIBLE_BOOKS.map((book) => {
  const raw = [book.name, book.abbrev, book.nameEn, book.abbrevEn, book.id];
  const keys = new Set<string>();
  for (const value of raw) {
    const key = normalize(value);
    keys.add(key);
    // "1 samuel" também precisa casar com "1samuel".
    keys.add(key.replace(/\s+/g, ""));
  }
  return { book, keys: [...keys] };
});

const BY_ID = new Map(BIBLE_BOOKS.map((b) => [b.id, b]));

/**
 * Livros que casam com o termo, do mais provável ao menos.
 * Vazio quando o termo tem menos de um caractere útil.
 */
export function searchBooks(query: string, limit = 8): BibleBook[] {
  const q = normalize(query);
  if (!q) return [];

  const aliased = ALIASES[q];
  const scored: { book: BibleBook; score: number }[] = [];

  for (const { book, keys } of INDEX) {
    // 0 = apelido explícito, 1 = igual, 2 = começa com, 3 = contém.
    let score = Number.POSITIVE_INFINITY;
    if (aliased === book.id) score = 0;
    for (const key of keys) {
      if (key === q) score = Math.min(score, 1);
      else if (key.startsWith(q)) score = Math.min(score, 2);
      else if (q.length >= 3 && key.includes(q)) score = Math.min(score, 3);
    }
    if (Number.isFinite(score)) scored.push({ book, score });
  }

  // Empate mantém a ordem canônica da Bíblia — `sort` é estável.
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.book);
}

/** O livro mais provável para o termo, ou `undefined`. */
export function findBookByName(query: string): BibleBook | undefined {
  // Antes de tudo, uma igualdade COM acento. É o que separa "jó" (o livro) de
  // "jo" (abreviação de João): sem esta passada, o apelido `jo → joao` levaria
  // os dois para João.
  const accented = soften(query);
  if (accented) {
    const exact = BIBLE_BOOKS.find(
      (b) =>
        b.name.toLowerCase() === accented ||
        b.abbrev.toLowerCase() === accented ||
        b.nameEn.toLowerCase() === accented,
    );
    if (exact) return exact;
  }

  const q = normalize(query);
  if (!q) return undefined;
  const aliased = ALIASES[q];
  if (aliased) return BY_ID.get(aliased);
  return searchBooks(q, 1)[0];
}

export interface ParsedReference {
  book: BibleBook;
  chapter: number;
  /** Versículo, quando a referência traz um. */
  verse?: number;
}

/**
 * Lê "João 3:16", "Gn 1", "1co 13", "jo3.16".
 * Devolve `null` quando não dá para identificar o livro.
 */
export function parseReference(query: string): ParsedReference | null {
  // Roda sobre a forma acentuada: `findBookByName` precisa do acento para
  // distinguir "jó 1" de "jo 1".
  const q = soften(query);
  if (!q) return null;

  // O nome do livro é preguiçoso para "1 samuel 3" não virar livro "1".
  const withNumbers = q.match(/^(.+?)\s*(\d+)(?:\s*(\d+))?$/);

  if (withNumbers) {
    const [, namePart, chapterPart, versePart] = withNumbers;
    const book = findBookByName(namePart);
    if (book) {
      const chapter = clampChapter(book, Number(chapterPart));
      const verse = versePart ? Number(versePart) : undefined;
      return { book, chapter, verse };
    }
  }

  // Só o nome: leva ao capítulo 1.
  const book = findBookByName(q);
  return book ? { book, chapter: 1 } : null;
}

/** "João 3:16" ou "João 3", no idioma da interface. */
export function formatReference(
  book: BibleBook,
  chapter: number,
  verse: number | undefined,
  language: string,
): string {
  const name = language.startsWith("pt") ? book.name : book.nameEn;
  return verse ? `${name} ${chapter}:${verse}` : `${name} ${chapter}`;
}
