import { BIBLE_BOOKS, chapterPath, clampChapter, findBook } from "../data/bibleBooks";

// ─── Metadados de cada página ─────────────────────────────────────────────────
// Fonte única de título, descrição e imagem de compartilhamento por rota. Quem
// lê:
//   - vite/openGraph.ts, que no build grava um HTML por rota com <title>,
//     canônica e Open Graph no <head> — os crawlers do WhatsApp/Instagram não
//     executam JS, então a prévia precisa estar no HTML inicial;
//   - o App, que só sincroniza o document.title ao navegar dentro do SPA.
//
// Import relativo (sem "@/") porque o vite.config.ts também importa isto.

export const SITE_NAME = "Bíblia Online";

export interface PageMeta {
  title: string;
  description: string;
  /** Caminho em public/. Precisa ter 1200×630: é o tamanho que as tags declaram. */
  image: string;
  imageAlt: string;
  /** Caminho canônico, sem query nem barra final. */
  path: string;
}

const DEFAULTS: Omit<PageMeta, "path"> = {
  title: SITE_NAME,
  description:
    "Leia a Bíblia em português e inglês, salve versículos favoritos e gere Reels a partir deles.",
  image: "/og-image.jpg",
  imageAlt: "Bíblia Online: ícone de uma Bíblia aberta com uma cruz sobre fundo escuro",
};

/** Páginas fixas. Para uma rota nova ter prévia própria, basta uma entrada aqui. */
const PAGES: Record<string, Partial<Omit<PageMeta, "path">>> = {
  "/": {},
  "/favoritos": {
    title: `Favoritos · ${SITE_NAME}`,
    description: "Os versículos que você salvou na Bíblia Online, em um só lugar.",
  },
  "/reels": {
    title: `Gerador de Reels · ${SITE_NAME}`,
    description: "Transforme um versículo em Reel, com vídeo de fundo, narração e trilha.",
  },
};

export function pageMeta(pathname: string): PageMeta {
  const path = pathname.replace(/\/+$/, "") || "/";
  const page = PAGES[path];
  if (page) return { ...DEFAULTS, ...page, path };

  // /:bookId e /:bookId/:chapter — mesma regra de fallback do leitor (Index).
  const [, bookId, chapter] = path.split("/");
  const book = findBook(bookId);
  if (book) {
    const number = clampChapter(book, Number(chapter) || 1);
    const reference = `${book.name} ${number}`;
    return {
      ...DEFAULTS,
      title: `${reference} · ${SITE_NAME}`,
      description: `Leia ${reference} na ${SITE_NAME}, em português e inglês.`,
      path: chapterPath(book, number),
    };
  }

  // Rotas sem página própria (/auth/callback, o "*") acabam redirecionadas à home.
  return { ...DEFAULTS, path: "/" };
}

/** Toda rota que ganha HTML próprio no build, fora a home (que é o index.html). */
export function prerenderedPaths(): string[] {
  return [
    ...Object.keys(PAGES).filter((path) => path !== "/"),
    ...BIBLE_BOOKS.flatMap((book) => [
      `/${book.id}`,
      ...Array.from({ length: book.chapters }, (_, i) => chapterPath(book, i + 1)),
    ]),
  ];
}
