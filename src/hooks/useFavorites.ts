import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useUserData } from "@/auth/UserDataContext";
import { BIBLE_BOOKS, bookName, type BibleBook } from "@/data/bibleBooks";
import { normalize } from "@/lib/reference";
import type { FavoriteVerse } from "@/lib/userData";

// ─── Favoritos, prontos para exibir ───────────────────────────────────────────
// Camada FINA sobre o `useUserData`, que já resolve localStorage, Supabase e a
// mesclagem no login. Aqui só entra o que é apresentação:
//
//   • ordem decrescente — `mergeFavorites` ordena por createdAt crescente, o
//     que é certo para mesclar e errado para uma lista de "o que guardei";
//   • agrupamento por data;
//   • busca por texto e por referência;
//   • resolução do livro (o favorito guarda só o `bookId`).
//
// Nenhum armazenamento é duplicado aqui.

export type FavoriteGroupId = "today" | "week" | "month" | "older";

export interface DecoratedFavorite extends FavoriteVerse {
  book: BibleBook;
  /** "João 3:16", no idioma da interface. */
  reference: string;
  path: string;
}

export interface FavoriteGroup {
  id: FavoriteGroupId;
  labelKey: string;
  items: DecoratedFavorite[];
}

const DAY = 24 * 60 * 60 * 1000;

// O "agora" das faixas de data é fixado no carregamento da página, fora de
// qualquer renderização: assim os grupos não mudam sozinhos no meio de uma
// interação e a renderização continua pura. Uma sessão que atravessa a virada
// do dia reagrupa na próxima visita — precisão de sobra para "Hoje/Esta semana".
const SESSION_NOW = Date.now();

function groupFor(createdAt: string, now: number): FavoriteGroupId {
  const age = now - new Date(createdAt).getTime();
  // NaN (data corrompida) cai em "antes", que é o balde neutro.
  if (age < DAY) return "today";
  if (age < 7 * DAY) return "week";
  if (age < 30 * DAY) return "month";
  return "older";
}

const GROUP_ORDER: { id: FavoriteGroupId; labelKey: string }[] = [
  { id: "today", labelKey: "favorites.group_today" },
  { id: "week", labelKey: "favorites.group_week" },
  { id: "month", labelKey: "favorites.group_month" },
  { id: "older", labelKey: "favorites.group_older" },
];

export function useFavorites(query = "") {
  const { i18n } = useTranslation();
  const { favorites, toggleFavorite } = useUserData();
  const language = i18n.language;

  const decorated = useMemo(() => {
    const byId = new Map(BIBLE_BOOKS.map((b) => [b.id, b]));

    return favorites
      // Favorito de um livro que não existe mais no catálogo não tem para onde
      // levar — some da lista em vez de virar uma linha morta.
      .flatMap<DecoratedFavorite>((fav) => {
        const book = byId.get(fav.bookId);
        if (!book) return [];
        return [
          {
            ...fav,
            book,
            reference: `${bookName(book, language)} ${fav.chapter}:${fav.verse}`,
            path: `/${encodeURIComponent(book.id)}/${fav.chapter}?v=${fav.verse}`,
          },
        ];
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [favorites, language]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return decorated;
    return decorated.filter(
      (fav) =>
        normalize(fav.reference).includes(q) || normalize(fav.text ?? "").includes(q),
    );
  }, [decorated, query]);

  const groups = useMemo<FavoriteGroup[]>(() => {
    const buckets = new Map<FavoriteGroupId, DecoratedFavorite[]>();
    for (const fav of filtered) {
      const id = groupFor(fav.createdAt, SESSION_NOW);
      const list = buckets.get(id);
      if (list) list.push(fav);
      else buckets.set(id, [fav]);
    }
    return GROUP_ORDER.flatMap(({ id, labelKey }) => {
      const items = buckets.get(id);
      return items?.length ? [{ id, labelKey, items }] : [];
    });
  }, [filtered]);

  return {
    /** Todos, decrescente. */
    all: decorated,
    /** Após a busca. */
    filtered,
    groups,
    total: decorated.length,
    remove: toggleFavorite,
  };
}
