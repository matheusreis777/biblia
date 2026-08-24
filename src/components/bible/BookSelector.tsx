import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { AT_BOOKS, NT_BOOKS, bookAbbrev, bookName, type BibleBook } from "@/data/bibleBooks";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { searchBooks } from "@/lib/reference";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui/IconButton";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";

// ─── Seletor de livro e capítulo ──────────────────────────────────────────────
// Dois desenhos para o mesmo conteúdo:
//
//   Desktop — painel largo à esquerda, livros e capítulos LADO A LADO. Escolher
//     "João 3" vira um gesto só, sem o menu fechar no meio do caminho.
//   Mobile — bottom sheet a 85svh. Não ocupa a tela inteira de propósito: ver
//     uma faixa do capítulo atual por trás é o que mantém a noção de onde se
//     estava.
//
// A busca interna usa o mesmo `searchBooks` da busca global, então "jo", "joao"
// e "Gênesis" encontram o livro nos dois lugares, com as mesmas regras.

type Testament = "AT" | "NT";

function BookRow({
  book,
  selected,
  onSelect,
  innerRef,
}: {
  book: BibleBook;
  selected: boolean;
  onSelect: (book: BibleBook) => void;
  innerRef?: React.Ref<HTMLButtonElement>;
}) {
  const { i18n } = useTranslation();

  return (
    <button
      ref={innerRef}
      type="button"
      onClick={() => onSelect(book)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors",
        selected
          ? "bg-primary/10 text-primary"
          : "text-foreground/80 hover:bg-accent hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "w-8 shrink-0 font-heading text-[10px] font-bold uppercase tabular-nums",
          selected ? "text-primary" : "text-muted-foreground",
        )}
      >
        {bookAbbrev(book, i18n.language)}
      </span>
      <span className="min-w-0 flex-1 truncate font-body text-sm">
        {bookName(book, i18n.language)}
      </span>
      <span className="shrink-0 font-heading text-[10px] tabular-nums text-muted-foreground/70">
        {book.chapters}
      </span>
    </button>
  );
}

function ChapterGrid({
  book,
  current,
  onSelect,
}: {
  book: BibleBook;
  current: number | null;
  onSelect: (chapter: number) => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <p className="mb-2.5 font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t("bible.chapters")}
        <span className="mx-1.5 text-border">·</span>
        <span className="text-foreground">{bookName(book, i18n.language)}</span>
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => {
          const active = ch === current;
          return (
            <button
              key={ch}
              type="button"
              onClick={() => onSelect(ch)}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex h-11 items-center justify-center rounded-lg font-heading text-xs font-semibold tabular-nums",
                "transition-colors active:scale-95",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary text-foreground/70 hover:bg-accent hover:text-foreground",
              )}
            >
              {ch}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface BookSelectorProps {
  open: boolean;
  onClose: () => void;
  currentBook: BibleBook;
  currentChapter: number;
  onNavigate: (book: BibleBook, chapter: number) => void;
}

/**
 * Só monta o painel quando aberto. Fechar DESMONTA, e é assim que busca,
 * testamento e livro em foco voltam ao contexto da leitura na próxima abertura
 * — sem um efeito de reset chamando três setStates.
 */
export function BookSelector({ open, ...props }: BookSelectorProps) {
  if (!open) return null;
  return <BookSelectorPanel {...props} />;
}

function BookSelectorPanel({
  onClose,
  currentBook,
  currentChapter,
  onNavigate,
}: Omit<BookSelectorProps, "open">) {
  const { t } = useTranslation();
  const isDesktop = useIsDesktop();

  const [query, setQuery] = useState("");
  const [testament, setTestament] = useState<Testament>(currentBook.testament);
  // Livro em foco no painel de capítulos. Começa no que está sendo lido e
  // muda ao tocar num livro — o menu só fecha quando o capítulo é escolhido.
  const [focusBook, setFocusBook] = useState<BibleBook>(currentBook);

  const selectedRef = useRef<HTMLButtonElement>(null);

  // Rola até o livro atual — em 39 livros do AT ele quase nunca está à vista.
  useEffect(() => {
    if (query) return;
    const timer = window.setTimeout(
      () => selectedRef.current?.scrollIntoView({ block: "center" }),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [query, testament]);

  const results = useMemo(() => (query ? searchBooks(query, 12) : null), [query]);
  const visibleBooks = results ?? (testament === "AT" ? AT_BOOKS : NT_BOOKS);

  const pickBook = (book: BibleBook) => {
    setFocusBook(book);
    // Livro de um capítulo só não tem o que escolher depois.
    if (book.chapters === 1) {
      onNavigate(book, 1);
      onClose();
    }
  };

  const pickChapter = (chapter: number) => {
    onNavigate(focusBook, chapter);
    onClose();
  };

  const searchField = (
    <div className="relative">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("bible.search_placeholder")}
        aria-label={t("bible.books")}
        className="min-h-11 w-full rounded-xl border border-input bg-secondary/60 pl-9 pr-9 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      {query && (
        <IconButton
          label={t("common.close")}
          size="sm"
          onClick={() => setQuery("")}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <X size={15} />
        </IconButton>
      )}
    </div>
  );

  const bookList = (
    <div className="space-y-0.5">
      {results && results.length === 0 && (
        <p className="px-2.5 py-6 text-center font-body text-sm text-muted-foreground">
          {t("search.no_results")}
        </p>
      )}
      {visibleBooks.map((book) => (
        <BookRow
          key={book.id}
          book={book}
          selected={book.id === focusBook.id}
          onSelect={pickBook}
          innerRef={book.id === currentBook.id ? selectedRef : undefined}
        />
      ))}
    </div>
  );

  const testamentTabs = !results && (
    <Segmented<Testament>
      label={t("bible.books")}
      value={testament}
      onChange={setTestament}
      block
      size="sm"
      options={[
        { value: "AT", label: t("bible.old_testament") },
        { value: "NT", label: t("bible.new_testament") },
      ]}
    />
  );

  // ── Desktop: livros e capítulos lado a lado ──────────────────────────────
  if (isDesktop) {
    return (
      <Sheet
        open
        onClose={onClose}
        side="left"
        title={t("bible.books")}
        className="w-[min(40rem,92vw)]"
        // As duas colunas rolam por conta própria; o corpo do sheet não rola.
        bodyClassName="overflow-hidden"
      >
        <div className="grid h-full grid-cols-[17rem_1fr]">
          <div className="flex min-h-0 flex-col gap-3 border-r border-border p-3">
            {searchField}
            {testamentTabs}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">{bookList}</div>
          </div>
          <div className="min-h-0 overflow-y-auto p-4">
            <ChapterGrid
              book={focusBook}
              current={focusBook.id === currentBook.id ? currentChapter : null}
              onSelect={pickChapter}
            />
          </div>
        </div>
      </Sheet>
    );
  }

  // ── Mobile: bottom sheet, capítulos acima da lista ───────────────────────
  return (
    <Sheet open onClose={onClose} side="bottom" title={t("bible.books")}>
      <div className="space-y-3 px-3 pt-3">
        {searchField}
        {testamentTabs}
      </div>

      <div className="mt-4 border-y border-border bg-secondary/40 px-3 py-4">
        <ChapterGrid
          book={focusBook}
          current={focusBook.id === currentBook.id ? currentChapter : null}
          onSelect={pickChapter}
        />
      </div>

      <div className="space-y-0.5 px-3 py-3">{bookList}</div>
    </Sheet>
  );
}
