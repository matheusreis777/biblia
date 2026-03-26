// Estrutura completa dos 66 livros da Bíblia com seus capítulos
// Os IDs usam os slugs aceitos pela bible-api.com com translation=almeida
export interface BibleBook {
  id: string;       // slug para a API (nome em português/inglês aceito pela bible-api.com)
  name: string;     // nome em português
  abbrev: string;   // abreviação
  testament: "AT" | "NT";
  chapters: number;
}

export const BIBLE_BOOKS: BibleBook[] = [
  // ── Antigo Testamento ─────────────────────────────────────────────
  { id: "genesis",         name: "Gênesis",          abbrev: "Gn",   testament: "AT", chapters: 50  },
  { id: "exodo",           name: "Êxodo",             abbrev: "Ex",   testament: "AT", chapters: 40  },
  { id: "levitico",        name: "Levítico",          abbrev: "Lv",   testament: "AT", chapters: 27  },
  { id: "numeros",         name: "Números",           abbrev: "Nm",   testament: "AT", chapters: 36  },
  { id: "deuteronomio",    name: "Deuteronômio",      abbrev: "Dt",   testament: "AT", chapters: 34  },
  { id: "josue",           name: "Josué",             abbrev: "Js",   testament: "AT", chapters: 24  },
  { id: "juizes",          name: "Juízes",            abbrev: "Jz",   testament: "AT", chapters: 21  },
  { id: "rute",            name: "Rute",              abbrev: "Rt",   testament: "AT", chapters: 4   },
  { id: "1samuel",         name: "1 Samuel",          abbrev: "1Sm",  testament: "AT", chapters: 31  },
  { id: "2samuel",         name: "2 Samuel",          abbrev: "2Sm",  testament: "AT", chapters: 24  },
  { id: "1reis",           name: "1 Reis",            abbrev: "1Rs",  testament: "AT", chapters: 22  },
  { id: "2reis",           name: "2 Reis",            abbrev: "2Rs",  testament: "AT", chapters: 25  },
  { id: "1cronicas",       name: "1 Crônicas",        abbrev: "1Cr",  testament: "AT", chapters: 29  },
  { id: "2cronicas",       name: "2 Crônicas",        abbrev: "2Cr",  testament: "AT", chapters: 36  },
  { id: "esdras",          name: "Esdras",            abbrev: "Ed",   testament: "AT", chapters: 10  },
  { id: "neemias",         name: "Neemias",           abbrev: "Ne",   testament: "AT", chapters: 13  },
  { id: "ester",           name: "Ester",             abbrev: "Et",   testament: "AT", chapters: 10  },
  { id: "jo",              name: "Jó",                abbrev: "Jó",   testament: "AT", chapters: 42  },
  { id: "salmos",          name: "Salmos",            abbrev: "Sl",   testament: "AT", chapters: 150 },
  { id: "proverbios",      name: "Provérbios",        abbrev: "Pv",   testament: "AT", chapters: 31  },
  { id: "eclesiastes",     name: "Eclesiastes",       abbrev: "Ec",   testament: "AT", chapters: 12  },
  { id: "canticos",        name: "Cânticos",          abbrev: "Ct",   testament: "AT", chapters: 8   },
  { id: "isaias",          name: "Isaías",            abbrev: "Is",   testament: "AT", chapters: 66  },
  { id: "jeremias",        name: "Jeremias",          abbrev: "Jr",   testament: "AT", chapters: 52  },
  { id: "lamentacoes",     name: "Lamentações",       abbrev: "Lm",   testament: "AT", chapters: 5   },
  { id: "ezequiel",        name: "Ezequiel",          abbrev: "Ez",   testament: "AT", chapters: 48  },
  { id: "daniel",          name: "Daniel",            abbrev: "Dn",   testament: "AT", chapters: 12  },
  { id: "oseias",          name: "Oseias",            abbrev: "Os",   testament: "AT", chapters: 14  },
  { id: "joel",            name: "Joel",              abbrev: "Jl",   testament: "AT", chapters: 3   },
  { id: "amos",            name: "Amós",              abbrev: "Am",   testament: "AT", chapters: 9   },
  { id: "obadias",         name: "Obadias",           abbrev: "Ob",   testament: "AT", chapters: 1   },
  { id: "jonas",           name: "Jonas",             abbrev: "Jn",   testament: "AT", chapters: 4   },
  { id: "miqueias",        name: "Miquéias",          abbrev: "Mq",   testament: "AT", chapters: 7   },
  { id: "naum",            name: "Naum",              abbrev: "Na",   testament: "AT", chapters: 3   },
  { id: "habacuque",       name: "Habacuque",         abbrev: "Hc",   testament: "AT", chapters: 3   },
  { id: "sofonias",        name: "Sofonias",          abbrev: "Sf",   testament: "AT", chapters: 3   },
  { id: "ageu",            name: "Ageu",              abbrev: "Ag",   testament: "AT", chapters: 2   },
  { id: "zacarias",        name: "Zacarias",          abbrev: "Zc",   testament: "AT", chapters: 14  },
  { id: "malaquias",       name: "Malaquias",         abbrev: "Ml",   testament: "AT", chapters: 4   },
  // ── Novo Testamento ───────────────────────────────────────────────
  { id: "mateus",          name: "Mateus",            abbrev: "Mt",   testament: "NT", chapters: 28  },
  { id: "marcos",          name: "Marcos",            abbrev: "Mc",   testament: "NT", chapters: 16  },
  { id: "lucas",           name: "Lucas",             abbrev: "Lc",   testament: "NT", chapters: 24  },
  { id: "joao",            name: "João",              abbrev: "Jo",   testament: "NT", chapters: 21  },
  { id: "atos",            name: "Atos",              abbrev: "At",   testament: "NT", chapters: 28  },
  { id: "romanos",         name: "Romanos",           abbrev: "Rm",   testament: "NT", chapters: 16  },
  { id: "1corintios",      name: "1 Coríntios",       abbrev: "1Co",  testament: "NT", chapters: 16  },
  { id: "2corintios",      name: "2 Coríntios",       abbrev: "2Co",  testament: "NT", chapters: 13  },
  { id: "galatas",         name: "Gálatas",           abbrev: "Gl",   testament: "NT", chapters: 6   },
  { id: "efesios",         name: "Efésios",           abbrev: "Ef",   testament: "NT", chapters: 6   },
  { id: "filipenses",      name: "Filipenses",        abbrev: "Fp",   testament: "NT", chapters: 4   },
  { id: "colossenses",     name: "Colossenses",       abbrev: "Cl",   testament: "NT", chapters: 4   },
  { id: "1tessalonicenses", name: "1 Tessalonicenses", abbrev: "1Ts",  testament: "NT", chapters: 5   },
  { id: "2tessalonicenses", name: "2 Tessalonicenses", abbrev: "2Ts",  testament: "NT", chapters: 3   },
  { id: "1timoteo",        name: "1 Timóteo",         abbrev: "1Tm",  testament: "NT", chapters: 6   },
  { id: "2timoteo",        name: "2 Timóteo",         abbrev: "2Tm",  testament: "NT", chapters: 4   },
  { id: "tito",            name: "Tito",              abbrev: "Tt",   testament: "NT", chapters: 3   },
  { id: "filemom",         name: "Filemom",           abbrev: "Fm",   testament: "NT", chapters: 1   },
  { id: "hebreus",         name: "Hebreus",           abbrev: "Hb",   testament: "NT", chapters: 13  },
  { id: "tiago",           name: "Tiago",             abbrev: "Tg",   testament: "NT", chapters: 5   },
  { id: "1pedro",          name: "1 Pedro",           abbrev: "1Pe",  testament: "NT", chapters: 5   },
  { id: "2pedro",          name: "2 Pedro",           abbrev: "2Pe",  testament: "NT", chapters: 3   },
  { id: "1joao",           name: "1 João",            abbrev: "1Jo",  testament: "NT", chapters: 5   },
  { id: "2joao",           name: "2 João",            abbrev: "2Jo",  testament: "NT", chapters: 1   },
  { id: "3joao",           name: "3 João",            abbrev: "3Jo",  testament: "NT", chapters: 1   },
  { id: "judas",           name: "Judas",             abbrev: "Jd",   testament: "NT", chapters: 1   },
  { id: "apocalipse",      name: "Apocalipse",        abbrev: "Ap",   testament: "NT", chapters: 22  },
];

export const AT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "AT");
export const NT_BOOKS = BIBLE_BOOKS.filter((b) => b.testament === "NT");
