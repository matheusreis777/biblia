import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import {
  favoriteKey,
  loadLocalFavorites,
  loadLocalLastRead,
  mergeFavorites,
  saveLocalFavorites,
  saveLocalLastRead,
  type FavoriteVerse,
  type LastRead,
} from "@/lib/userData";
import { useAuth } from "./AuthContext";
import { UserDataContext, type UserDataContextValue } from "./UserDataContext";

/**
 * Guarda a última leitura, os versículos favoritos e o idioma preferido.
 *
 * Sem sessão, tudo vive no localStorage e o site funciona normalmente. Ao
 * entrar na conta, o que estava no navegador é mesclado com o que está na nuvem
 * e passa a valer nos dois lados.
 */
export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { i18n } = useTranslation();

  const [lastRead, setLastRead] = useState<LastRead | null>(() => loadLocalLastRead());
  const [favorites, setFavorites] = useState<FavoriteVerse[]>(() => loadLocalFavorites());
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Evita refazer a sincronização a cada re-render: só quando o usuário muda.
  const syncedUserId = useRef<string | null>(null);
  // Espelhos do estado para os callbacks lerem o valor atual sem virarem
  // dependência de si mesmos (e sem efeito colateral dentro de um updater,
  // que o StrictMode executa duas vezes).
  const lastReadRef = useRef(lastRead);
  const favoritesRef = useRef(favorites);
  const i18nRef = useRef(i18n);

  useEffect(() => {
    lastReadRef.current = lastRead;
  }, [lastRead]);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    i18nRef.current = i18n;
  }, [i18n]);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !supabase) {
      syncedUserId.current = null;
      setReady(true);
      return;
    }

    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    const client = supabase;
    const userId = user.id;
    let active = true;

    (async () => {
      setSyncing(true);
      try {
        const localLastRead = loadLocalLastRead();
        const localFavorites = loadLocalFavorites();

        const [progressRes, favoritesRes, profileRes] = await Promise.all([
          client.from("reading_progress").select("book_id, chapter, updated_at").eq("user_id", userId).maybeSingle(),
          client.from("favorite_verses").select("book_id, chapter, verse, text, created_at").eq("user_id", userId),
          client.from("profiles").select("language").eq("id", userId).maybeSingle(),
        ]);

        if (!active) return;

        // ── Última leitura: vence a mais recente ────────────────────────────
        const remoteLastRead: LastRead | null = progressRes.data
          ? {
              bookId: progressRes.data.book_id,
              chapter: progressRes.data.chapter,
              updatedAt: progressRes.data.updated_at,
            }
          : null;

        const winner =
          remoteLastRead && localLastRead
            ? remoteLastRead.updatedAt >= localLastRead.updatedAt
              ? remoteLastRead
              : localLastRead
            : (remoteLastRead ?? localLastRead);

        if (winner) {
          setLastRead(winner);
          saveLocalLastRead(winner);
          // Se quem venceu foi o navegador, a nuvem estava atrasada.
          if (winner !== remoteLastRead) {
            await client.from("reading_progress").upsert(
              {
                user_id: userId,
                book_id: winner.bookId,
                chapter: winner.chapter,
                updated_at: winner.updatedAt,
              },
              { onConflict: "user_id" },
            );
          }
        }

        // ── Favoritos: união dos dois lados ─────────────────────────────────
        const remoteFavorites: FavoriteVerse[] = (favoritesRes.data ?? []).map((row) => ({
          bookId: row.book_id,
          chapter: row.chapter,
          verse: row.verse,
          text: row.text,
          createdAt: row.created_at,
        }));

        const merged = mergeFavorites(remoteFavorites, localFavorites);
        setFavorites(merged);
        saveLocalFavorites(merged);

        const remoteKeys = new Set(remoteFavorites.map(favoriteKey));
        const missingOnRemote = merged.filter((fav) => !remoteKeys.has(favoriteKey(fav)));
        if (missingOnRemote.length > 0) {
          await client.from("favorite_verses").upsert(
            missingOnRemote.map((fav) => ({
              user_id: userId,
              book_id: fav.bookId,
              chapter: fav.chapter,
              verse: fav.verse,
              text: fav.text,
              created_at: fav.createdAt,
            })),
            { onConflict: "user_id,book_id,chapter,verse" },
          );
        }

        // ── Idioma do perfil ────────────────────────────────────────────────
        const profileLanguage = profileRes.data?.language;
        if (profileLanguage && profileLanguage !== i18nRef.current.language) {
          void i18nRef.current.changeLanguage(profileLanguage);
        }
      } catch {
        // Falha de rede não pode travar a leitura: seguimos com o que já está
        // no navegador e tentamos de novo no próximo login.
      } finally {
        if (active) {
          setSyncing(false);
          setReady(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const saveLastRead = useCallback(
    (bookId: string, chapter: number) => {
      const current = lastReadRef.current;
      if (current?.bookId === bookId && current.chapter === chapter) return;

      const next: LastRead = { bookId, chapter, updatedAt: new Date().toISOString() };
      lastReadRef.current = next;
      setLastRead(next);
      saveLocalLastRead(next);

      if (!supabase || !user) return;
      void supabase
        .from("reading_progress")
        .upsert(
          { user_id: user.id, book_id: bookId, chapter, updated_at: next.updatedAt },
          { onConflict: "user_id" },
        )
        .then(() => undefined);
    },
    [user],
  );

  const favoriteKeys = useMemo(() => new Set(favorites.map(favoriteKey)), [favorites]);

  const isFavorite = useCallback(
    (bookId: string, chapter: number, verse: number) =>
      favoriteKeys.has(favoriteKey({ bookId, chapter, verse })),
    [favoriteKeys],
  );

  const toggleFavorite = useCallback(
    (verse: Omit<FavoriteVerse, "createdAt">) => {
      const key = favoriteKey(verse);
      const current = favoritesRef.current;
      const removing = current.some((fav) => favoriteKey(fav) === key);

      const next = removing
        ? current.filter((fav) => favoriteKey(fav) !== key)
        : [...current, { ...verse, createdAt: new Date().toISOString() }];
      favoritesRef.current = next;
      setFavorites(next);
      saveLocalFavorites(next);

      if (!supabase || !user) return;
      const table = supabase.from("favorite_verses");
      if (removing) {
        void table
          .delete()
          .eq("user_id", user.id)
          .eq("book_id", verse.bookId)
          .eq("chapter", verse.chapter)
          .eq("verse", verse.verse)
          .then(() => undefined);
      } else {
        void table
          .upsert(
            {
              user_id: user.id,
              book_id: verse.bookId,
              chapter: verse.chapter,
              verse: verse.verse,
              text: verse.text,
            },
            { onConflict: "user_id,book_id,chapter,verse" },
          )
          .then(() => undefined);
      }
    },
    [user],
  );

  const setLanguage = useCallback(
    (language: string) => {
      void i18nRef.current.changeLanguage(language);
      if (!supabase || !user) return;
      void supabase
        .from("profiles")
        .upsert({ id: user.id, language }, { onConflict: "id" })
        .then(() => undefined);
    },
    [user],
  );

  const value = useMemo<UserDataContextValue>(
    () => ({
      ready,
      syncing,
      lastRead,
      saveLastRead,
      favorites,
      isFavorite,
      toggleFavorite,
      setLanguage,
    }),
    [ready, syncing, lastRead, saveLastRead, favorites, isFavorite, toggleFavorite, setLanguage],
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}
