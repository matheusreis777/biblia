import { createContext, useContext } from "react";
import type { FavoriteVerse, LastRead } from "@/lib/userData";

export interface UserDataContextValue {
  /**
   * true quando a última leitura já foi resolvida (localStorage e, se houver
   * sessão, a nuvem). Só depois disso vale redirecionar ou gravar — antes,
   * gravar sobrescreveria o progresso remoto com o capítulo padrão.
   */
  ready: boolean;
  /** true enquanto uma sincronização com o Supabase está em andamento. */
  syncing: boolean;
  lastRead: LastRead | null;
  saveLastRead: (bookId: string, chapter: number) => void;
  favorites: FavoriteVerse[];
  isFavorite: (bookId: string, chapter: number, verse: number) => boolean;
  toggleFavorite: (verse: Omit<FavoriteVerse, "createdAt">) => void;
  /** Troca o idioma e, com sessão ativa, guarda a escolha no perfil. */
  setLanguage: (language: string) => void;
}

export const UserDataContext = createContext<UserDataContextValue | null>(null);

export function useUserData(): UserDataContextValue {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error("useUserData precisa estar dentro de <UserDataProvider>");
  return ctx;
}
