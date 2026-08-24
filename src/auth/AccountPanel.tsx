import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BookMarked, Cloud, Loader2, LogOut, Star } from "lucide-react";
import { BIBLE_BOOKS, bookName } from "@/data/bibleBooks";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "./AuthContext";
import { nameOf, type GoogleMetadata } from "./googleProfile";
import { useUserData } from "./UserDataContext";

// ─── Conteúdo do painel de conta ──────────────────────────────────────────────
// Separado do gatilho porque aparece em dois lugares: no popover do avatar
// (desktop) e como bloco dentro do menu mobile. Um dropdown `absolute` dentro
// de um sheet com `overflow-y-auto` seria cortado.

export function AccountPanel({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const { lastRead, favorites, syncing } = useUserData();

  const lastReadBook = lastRead ? BIBLE_BOOKS.find((b) => b.id === lastRead.bookId) : undefined;
  const metadata = (user.user_metadata ?? {}) as GoogleMetadata;
  const displayName = nameOf(metadata, user.email);

  return (
    <div className="w-full">
      <div className="border-b border-border px-4 py-3">
        <p className="font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("auth.account")}
        </p>
        {displayName && displayName !== user.email && (
          <p className="mt-1 truncate text-xs font-medium text-foreground">{displayName}</p>
        )}
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.email}</p>
        <p
          className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"
          aria-live="polite"
        >
          {syncing ? (
            <>
              <Loader2 size={11} className="animate-spin" />
              {t("auth.syncing")}
            </>
          ) : (
            <>
              <Cloud size={11} className="text-primary" />
              {t("auth.synced")}
            </>
          )}
        </p>
      </div>

      <div className="space-y-1 border-b border-border px-2 py-2">
        {lastReadBook ? (
          <Link
            to={`/${encodeURIComponent(lastReadBook.id)}/${lastRead!.chapter}`}
            onClick={onNavigate}
            className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-xs text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
          >
            <BookMarked size={14} className="shrink-0 text-primary" />
            <span className="truncate">
              {t("auth.continue_reading")}
              <span className="text-muted-foreground"> · </span>
              {bookName(lastReadBook, i18n.language)} {lastRead!.chapter}
            </span>
          </Link>
        ) : (
          <p className="flex min-h-11 items-center gap-2.5 px-2 text-xs text-muted-foreground">
            <BookMarked size={14} className="shrink-0" />
            {t("auth.no_last_read")}
          </p>
        )}

        <Link
          to="/favoritos"
          onClick={onNavigate}
          className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-xs text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
        >
          <Star size={14} className="shrink-0 text-primary" />
          <span className="truncate">{t("auth.favorites_count", { count: favorites.length })}</span>
        </Link>
      </div>

      <div className="p-2">
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void signOut();
          }}
          className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 text-xs text-foreground/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut size={14} />
          {t("auth.sign_out")}
        </button>
      </div>
    </div>
  );
}
