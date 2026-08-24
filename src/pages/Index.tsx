import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, Film, Menu, Star } from "lucide-react";
import { useUserData } from "@/auth/UserDataContext";
import { BibleReader } from "@/components/bible/BibleReader";
import { BookSelector } from "@/components/bible/BookSelector";
import { ChapterNav } from "@/components/bible/ChapterNav";
import { CommandPalette } from "@/components/bible/CommandPalette";
import {
  ReaderSettingsButton,
  ReaderSettingsPanel,
} from "@/components/bible/ReaderSettings";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import type { MenuLink } from "@/components/layout/MobileMenu";
import { IconButton } from "@/components/ui/IconButton";
import {
  BIBLE_BOOKS,
  bookName,
  chapterPath,
  clampChapter,
  findBook,
  type BibleBook,
} from "@/data/bibleBooks";
import { useReaderShortcuts } from "@/hooks/useReaderShortcuts";
import { useSwipeChapter } from "@/hooks/useSwipeChapter";

// ─── Página do leitor ─────────────────────────────────────────────────────────
// Só composição e navegação. O que era um arquivo de 521 linhas com header,
// busca, sidebar, versículos e rodapé misturados agora mora em
// src/components/bible/ e src/components/layout/.

export default function BibliaPage() {
  const { bookId, chapter } = useParams<{ bookId?: string; chapter?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { ready, lastRead, saveLastRead, favorites } = useUserData();

  const currentBook = findBook(bookId) ?? BIBLE_BOOKS[0];
  const currentChapter = clampChapter(currentBook, Number(chapter) || 1);

  // Versículo vindo da busca por referência (/joao/3?v=16).
  const initialVerse = Number(searchParams.get("v")) || undefined;

  const [showBooks, setShowBooks] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // ── Retomada da última leitura ──────────────────────────────────────────
  // Sem livro na URL, volta para onde a pessoa parou (nuvem se houver sessão,
  // senão o que ficou guardado neste navegador).
  const restoreTarget = useMemo(() => {
    if (bookId || !lastRead) return null;
    const book = BIBLE_BOOKS.find((b) => b.id === lastRead.bookId);
    return book ? chapterPath(book, clampChapter(book, lastRead.chapter)) : null;
  }, [bookId, lastRead]);

  useEffect(() => {
    if (!ready || !restoreTarget) return;
    navigate(restoreTarget, { replace: true });
  }, [ready, restoreTarget, navigate]);

  // Registra a leitura atual. Só depois de `ready` (senão o capítulo padrão
  // sobrescreveria o progresso que ainda vem do Supabase) e só quando não há
  // redirecionamento pendente (senão gravaria Gênesis 1 antes de restaurar).
  useEffect(() => {
    if (!ready || restoreTarget) return;
    saveLastRead(currentBook.id, currentChapter);
  }, [ready, restoreTarget, currentBook.id, currentChapter, saveLastRead]);

  // ── Navegação ───────────────────────────────────────────────────────────
  const goTo = useCallback(
    (book: BibleBook, ch: number, verse?: number) => {
      navigate(chapterPath(book, ch) + (verse ? `?v=${verse}` : ""));
    },
    [navigate],
  );

  const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
  const hasPrev = currentChapter > 1 || bookIndex > 0;
  const hasNext = currentChapter < currentBook.chapters || bookIndex < BIBLE_BOOKS.length - 1;

  // Vira o livro nas pontas — chegar ao fim de Gênesis segue para Êxodo 1.
  const prevChapter = useCallback(() => {
    if (currentChapter > 1) goTo(currentBook, currentChapter - 1);
    else if (bookIndex > 0) {
      const previous = BIBLE_BOOKS[bookIndex - 1];
      goTo(previous, previous.chapters);
    }
  }, [currentBook, currentChapter, bookIndex, goTo]);

  const nextChapter = useCallback(() => {
    if (currentChapter < currentBook.chapters) goTo(currentBook, currentChapter + 1);
    else if (bookIndex < BIBLE_BOOKS.length - 1) goTo(BIBLE_BOOKS[bookIndex + 1], 1);
  }, [currentBook, currentChapter, bookIndex, goTo]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentBook.id, currentChapter]);

  const overlayOpen = showBooks || showSearch;

  useReaderShortcuts({
    onPrev: prevChapter,
    onNext: nextChapter,
    onSearch: () => setShowSearch(true),
    onBooks: () => setShowBooks(true),
    onEscape: () => {
      setShowBooks(false);
      setShowSearch(false);
    },
    suspended: overlayOpen,
  });

  const swipeRef = useSwipeChapter({
    onPrev: prevChapter,
    onNext: nextChapter,
    enabled: !overlayOpen,
  });

  // ── Chrome ──────────────────────────────────────────────────────────────
  const reference = `${bookName(currentBook, i18n.language)} ${currentChapter}`;

  const links: MenuLink[] = [
    { to: "/favoritos", label: t("favorites.title"), icon: Star, badge: favorites.length },
    { to: "/reels", label: t("bible.reels_link"), icon: Film },
  ];

  // Seletor contextual do desktop: livro e capítulo num gatilho só, porque a
  // escolha é uma coisa só — o menu abre com os dois lados lado a lado.
  const contextNav = (
    <button
      type="button"
      onClick={() => setShowBooks(true)}
      className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 transition-colors hover:border-foreground/20 hover:bg-secondary"
    >
      <span className="truncate font-heading text-sm font-semibold text-foreground">
        {bookName(currentBook, i18n.language)}
      </span>
      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-heading text-xs font-bold tabular-nums text-primary">
        {currentChapter}
      </span>
      <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
    </button>
  );

  return (
    <AppShell
      // Limpa a barra fixa de capítulos (h-16) mais a área segura do iOS —
      // senão o crédito do rodapé fica embaixo dela.
      contentClassName="pb-[calc(4rem+env(safe-area-inset-bottom))]"
      header={
        <AppHeader
          nav={contextNav}
          mobileTitle={reference}
          mobileLead={
            <IconButton label={t("shell.open_books")} onClick={() => setShowBooks(true)}>
              <Menu size={20} />
            </IconButton>
          }
          onOpenSearch={() => setShowSearch(true)}
          links={links}
          actions={<ReaderSettingsButton />}
          menuExtra={
            <section className="border-t border-border px-3 py-3">
              <p className="mb-3 px-1 font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("reader.settings_title")}
              </p>
              <ReaderSettingsPanel />
            </section>
          }
        />
      }
    >
      <div ref={swipeRef as React.RefObject<HTMLDivElement>}>
        <BibleReader book={currentBook} chapter={currentChapter} initialVerse={initialVerse} />
      </div>

      <ChapterNav
        book={currentBook}
        chapter={currentChapter}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onPrev={prevChapter}
        onNext={nextChapter}
      />

      <BookSelector
        open={showBooks}
        onClose={() => setShowBooks(false)}
        currentBook={currentBook}
        currentChapter={currentChapter}
        onNavigate={goTo}
      />

      <CommandPalette
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={goTo}
      />
    </AppShell>
  );
}
