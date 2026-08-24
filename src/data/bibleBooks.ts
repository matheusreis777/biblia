// Estrutura completa dos 66 livros da Bíblia com seus capítulos.
//
// `id` é o slug aceito pela bible-api.com e é o que vai na URL — NÃO muda com o
// idioma, senão os links salvos pelas pessoas quebrariam ao trocar de língua.
// Os nomes e abreviações existem nas duas línguas porque a interface inteira
// (título do capítulo, menu, busca, favoritos) mostra o nome do livro, e antes
// ele ficava em português mesmo com a interface em inglês.
export interface BibleBook {
  /** Slug para a API e para a URL. Estável, independente do idioma. */
  id: string;
  name: string;
  abbrev: string;
  nameEn: string;
  abbrevEn: string;
  testament: "AT" | "NT";
  chapters: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // ── Antigo Testamento ─────────────────────────────────────────────
  { id: "genesis",          name: "Gênesis",           abbrev: "Gn",  nameEn: "Genesis",         abbrevEn: "Gen", testament: "AT", chapters: 50  },
  { id: "exodo",            name: "Êxodo",             abbrev: "Ex",  nameEn: "Exodus",          abbrevEn: "Exo", testament: "AT", chapters: 40  },
  { id: "levitico",         name: "Levítico",          abbrev: "Lv",  nameEn: "Leviticus",       abbrevEn: "Lev", testament: "AT", chapters: 27  },
  { id: "numeros",          name: "Números",           abbrev: "Nm",  nameEn: "Numbers",         abbrevEn: "Num", testament: "AT", chapters: 36  },
  { id: "deuteronomio",     name: "Deuteronômio",      abbrev: "Dt",  nameEn: "Deuteronomy",     abbrevEn: "Deu", testament: "AT", chapters: 34  },
  { id: "josue",            name: "Josué",             abbrev: "Js",  nameEn: "Joshua",          abbrevEn: "Jos", testament: "AT", chapters: 24  },
  { id: "juizes",           name: "Juízes",            abbrev: "Jz",  nameEn: "Judges",          abbrevEn: "Jdg", testament: "AT", chapters: 21  },
  { id: "rute",             name: "Rute",              abbrev: "Rt",  nameEn: "Ruth",            abbrevEn: "Rut", testament: "AT", chapters: 4   },
  { id: "1samuel",          name: "1 Samuel",          abbrev: "1Sm", nameEn: "1 Samuel",        abbrevEn: "1Sa", testament: "AT", chapters: 31  },
  { id: "2samuel",          name: "2 Samuel",          abbrev: "2Sm", nameEn: "2 Samuel",        abbrevEn: "2Sa", testament: "AT", chapters: 24  },
  { id: "1reis",            name: "1 Reis",            abbrev: "1Rs", nameEn: "1 Kings",         abbrevEn: "1Ki", testament: "AT", chapters: 22  },
  { id: "2reis",            name: "2 Reis",            abbrev: "2Rs", nameEn: "2 Kings",         abbrevEn: "2Ki", testament: "AT", chapters: 25  },
  { id: "1cronicas",        name: "1 Crônicas",        abbrev: "1Cr", nameEn: "1 Chronicles",    abbrevEn: "1Ch", testament: "AT", chapters: 29  },
  { id: "2cronicas",        name: "2 Crônicas",        abbrev: "2Cr", nameEn: "2 Chronicles",    abbrevEn: "2Ch", testament: "AT", chapters: 36  },
  { id: "esdras",           name: "Esdras",            abbrev: "Ed",  nameEn: "Ezra",            abbrevEn: "Ezr", testament: "AT", chapters: 10  },
  { id: "neemias",          name: "Neemias",           abbrev: "Ne",  nameEn: "Nehemiah",        abbrevEn: "Neh", testament: "AT", chapters: 13  },
  { id: "ester",            name: "Ester",             abbrev: "Et",  nameEn: "Esther",          abbrevEn: "Est", testament: "AT", chapters: 10  },
  { id: "jo",               name: "Jó",                abbrev: "Jó",  nameEn: "Job",             abbrevEn: "Job", testament: "AT", chapters: 42  },
  { id: "salmos",           name: "Salmos",            abbrev: "Sl",  nameEn: "Psalms",          abbrevEn: "Psa", testament: "AT", chapters: 150 },
  { id: "proverbios",       name: "Provérbios",        abbrev: "Pv",  nameEn: "Proverbs",        abbrevEn: "Pro", testament: "AT", chapters: 31  },
  { id: "eclesiastes",      name: "Eclesiastes",       abbrev: "Ec",  nameEn: "Ecclesiastes",    abbrevEn: "Ecc", testament: "AT", chapters: 12  },
  { id: "canticos",         name: "Cânticos",          abbrev: "Ct",  nameEn: "Song of Solomon", abbrevEn: "Sng", testament: "AT", chapters: 8   },
  { id: "isaias",           name: "Isaías",            abbrev: "Is",  nameEn: "Isaiah",          abbrevEn: "Isa", testament: "AT", chapters: 66  },
  { id: "jeremias",         name: "Jeremias",          abbrev: "Jr",  nameEn: "Jeremiah",        abbrevEn: "Jer", testament: "AT", chapters: 52  },
  { id: "lamentacoes",      name: "Lamentações",       abbrev: "Lm",  nameEn: "Lamentations",    abbrevEn: "Lam", testament: "AT", chapters: 5   },
  { id: "ezequiel",         name: "Ezequiel",          abbrev: "Ez",  nameEn: "Ezekiel",         abbrevEn: "Eze", testament: "AT", chapters: 48  },
  { id: "daniel",           name: "Daniel",            abbrev: "Dn",  nameEn: "Daniel",          abbrevEn: "Dan", testament: "AT", chapters: 12  },
  { id: "oseias",           name: "Oseias",            abbrev: "Os",  nameEn: "Hosea",           abbrevEn: "Hos", testament: "AT", chapters: 14  },
  { id: "joel",             name: "Joel",              abbrev: "Jl",  nameEn: "Joel",            abbrevEn: "Joe", testament: "AT", chapters: 3   },
  { id: "amos",             name: "Amós",              abbrev: "Am",  nameEn: "Amos",            abbrevEn: "Amo", testament: "AT", chapters: 9   },
  { id: "obadias",          name: "Obadias",           abbrev: "Ob",  nameEn: "Obadiah",         abbrevEn: "Oba", testament: "AT", chapters: 1   },
  { id: "jonas",            name: "Jonas",             abbrev: "Jn",  nameEn: "Jonah",           abbrevEn: "Jon", testament: "AT", chapters: 4   },
  { id: "miqueias",         name: "Miquéias",          abbrev: "Mq",  nameEn: "Micah",           abbrevEn: "Mic", testament: "AT", chapters: 7   },
  { id: "naum",             name: "Naum",              abbrev: "Na",  nameEn: "Nahum",           abbrevEn: "Nah", testament: "AT", chapters: 3   },
  { id: "habacuque",        name: "Habacuque",         abbrev: "Hc",  nameEn: "Habakkuk",        abbrevEn: "Hab", testament: "AT", chapters: 3   },
  { id: "sofonias",         name: "Sofonias",          abbrev: "Sf",  nameEn: "Zephaniah",       abbrevEn: "Zep", testament: "AT", chapters: 3   },
  { id: "ageu",             name: "Ageu",              abbrev: "Ag",  nameEn: "Haggai",          abbrevEn: "Hag", testament: "AT", chapters: 2   },
  { id: "zacarias",         name: "Zacarias",          abbrev: "Zc",  nameEn: "Zechariah",       abbrevEn: "Zec", testament: "AT", chapters: 14  },
  { id: "malaquias",        name: "Malaquias",         abbrev: "Ml",  nameEn: "Malachi",         abbrevEn: "Mal", testament: "AT", chapters: 4   },
  // ── Novo Testamento ───────────────────────────────────────────────
  { id: "mateus",           name: "Mateus",            abbrev: "Mt",  nameEn: "Matthew",         abbrevEn: "Mat", testament: "NT", chapters: 28  },
  { id: "marcos",           name: "Marcos",            abbrev: "Mc",  nameEn: "Mark",            abbrevEn: "Mrk", testament: "NT", chapters: 16  },
  { id: "lucas",            name: "Lucas",             abbrev: "Lc",  nameEn: "Luke",            abbrevEn: "Luk", testament: "NT", chapters: 24  },
  { id: "joao",             name: "João",              abbrev: "Jo",  nameEn: "John",            abbrevEn: "Jhn", testament: "NT", chapters: 21  },
  { id: "atos",             name: "Atos",              abbrev: "At",  nameEn: "Acts",            abbrevEn: "Act", testament: "NT", chapters: 28  },
  { id: "romanos",          name: "Romanos",           abbrev: "Rm",  nameEn: "Romans",          abbrevEn: "Rom", testament: "NT", chapters: 16  },
  { id: "1corintios",       name: "1 Coríntios",       abbrev: "1Co", nameEn: "1 Corinthians",   abbrevEn: "1Co", testament: "NT", chapters: 16  },
  { id: "2corintios",       name: "2 Coríntios",       abbrev: "2Co", nameEn: "2 Corinthians",   abbrevEn: "2Co", testament: "NT", chapters: 13  },
  { id: "galatas",          name: "Gálatas",           abbrev: "Gl",  nameEn: "Galatians",       abbrevEn: "Gal", testament: "NT", chapters: 6   },
  { id: "efesios",          name: "Efésios",           abbrev: "Ef",  nameEn: "Ephesians",       abbrevEn: "Eph", testament: "NT", chapters: 6   },
  { id: "filipenses",       name: "Filipenses",        abbrev: "Fp",  nameEn: "Philippians",     abbrevEn: "Php", testament: "NT", chapters: 4   },
  { id: "colossenses",      name: "Colossenses",       abbrev: "Cl",  nameEn: "Colossians",      abbrevEn: "Col", testament: "NT", chapters: 4   },
  { id: "1tessalonicenses", name: "1 Tessalonicenses", abbrev: "1Ts", nameEn: "1 Thessalonians", abbrevEn: "1Th", testament: "NT", chapters: 5   },
  { id: "2tessalonicenses", name: "2 Tessalonicenses", abbrev: "2Ts", nameEn: "2 Thessalonians", abbrevEn: "2Th", testament: "NT", chapters: 3   },
  { id: "1timoteo",         name: "1 Timóteo",         abbrev: "1Tm", nameEn: "1 Timothy",       abbrevEn: "1Ti", testament: "NT", chapters: 6   },
  { id: "2timoteo",         name: "2 Timóteo",         abbrev: "2Tm", nameEn: "2 Timothy",       abbrevEn: "2Ti", testament: "NT", chapters: 4   },
  { id: "tito",             name: "Tito",              abbrev: "Tt",  nameEn: "Titus",           abbrevEn: "Tit", testament: "NT", chapters: 3   },
  { id: "filemom",          name: "Filemom",           abbrev: "Fm",  nameEn: "Philemon",        abbrevEn: "Phm", testament: "NT", chapters: 1   },
  { id: "hebreus",          name: "Hebreus",           abbrev: "Hb",  nameEn: "Hebrews",         abbrevEn: "Heb", testament: "NT", chapters: 13  },
  { id: "tiago",            name: "Tiago",             abbrev: "Tg",  nameEn: "James",           abbrevEn: "Jas", testament: "NT", chapters: 5   },
  { id: "1pedro",           name: "1 Pedro",           abbrev: "1Pe", nameEn: "1 Peter",         abbrevEn: "1Pe", testament: "NT", chapters: 5   },
  { id: "2pedro",           name: "2 Pedro",           abbrev: "2Pe", nameEn: "2 Peter",         abbrevEn: "2Pe", testament: "NT", chapters: 3   },
  { id: "1joao",            name: "1 João",            abbrev: "1Jo", nameEn: "1 John",          abbrevEn: "1Jn", testament: "NT", chapters: 5   },
  { id: "2joao",            name: "2 João",            abbrev: "2Jo", nameEn: "2 John",          abbrevEn: "2Jn", testament: "NT", chapters: 1   },
  { id: "3joao",            name: "3 João",            abbrev: "3Jo", nameEn: "3 John",          abbrevEn: "3Jn", testament: "NT", chapters: 1   },
  { id: "judas",            name: "Judas",             abbrev: "Jd",  nameEn: "Jude",            abbrevEn: "Jud", testament: "NT", chapters: 1   },
  { id: "apocalipse",       name: "Apocalipse",        abbrev: "Ap",  nameEn: "Revelation",      abbrevEn: "Rev", testament: "NT", chapters: 22  },
];

export const AT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "AT");
export const NT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "NT");

const isPortuguese = (language: string) => language.startsWith("pt");

/** Nome do livro no idioma da interface. */
export function bookName(book: BibleBook, language: string): string {
  return isPortuguese(language) ? book.name : book.nameEn;
}

/** Abreviação do livro no idioma da interface. */
export function bookAbbrev(book: BibleBook, language: string): string {
  return isPortuguese(language) ? book.abbrev : book.abbrevEn;
}

/** Busca por id, com decodificação — o id vem da URL. */
export function findBook(bookId: string | undefined): BibleBook | undefined {
  if (!bookId) return undefined;
  let decoded = bookId;
  try {
    decoded = decodeURIComponent(bookId);
  } catch {
    /* URL malformada: tenta o valor cru */
  }
  return BIBLE_BOOKS.find((b) => b.id === decoded);
}

/** Caminho da rota de um capítulo. Ponto único de montagem da URL. */
export function chapterPath(book: BibleBook, chapter: number): string {
  return `/${encodeURIComponent(book.id)}/${chapter}`;
}

/** Prende o capítulo ao intervalo válido do livro. */
export function clampChapter(book: BibleBook, chapter: number): number {
  return Math.min(Math.max(Math.floor(chapter) || 1, 1), book.chapters);
}
