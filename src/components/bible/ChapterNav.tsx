import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bookName, type BibleBook } from "@/data/bibleBooks";
import { cn } from "@/lib/utils";

// ─── Navegação entre capítulos ────────────────────────────────────────────────
// A barra de progresso virou um FILETE de 2px na borda de cima da barra, em
// largura total. A trilha arredondada de 180px no meio, com o rótulo em cima,
// lia como controle de player — e não há nada para tocar aqui.
//
// No mobile sobram três coisas: voltar, onde estou, avançar. Os dois botões têm
// 44x44 reais e a barra respeita a área segura do iOS.

interface ChapterNavProps {
  book: BibleBook;
  chapter: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function ChapterNav({
  book,
  chapter,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  className,
}: ChapterNavProps) {
  const { t, i18n } = useTranslation();
  const progress = (chapter / book.chapters) * 100;

  return (
    <nav
      aria-label={t("bible.chapters")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      {/* O progresso vive na borda da barra, não no meio dela. */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-border/60" aria-hidden="true">
        <div
          className="h-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-2 sm:px-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={!hasPrev}
          aria-label={t("reader.prev_chapter")}
          className="group inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-heading text-sm font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-25 sm:px-4"
        >
          <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">{t("reader.prev_chapter")}</span>
        </button>

        <p
          className="min-w-0 truncate text-center font-heading text-xs font-semibold tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          <span className="sm:hidden">
            {chapter} / {book.chapters}
          </span>
          <span className="hidden sm:inline">
            {t("reader.chapter_of", {
              book: bookName(book, i18n.language),
              current: chapter,
              total: book.chapters,
            })}
          </span>
        </p>

        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          aria-label={t("reader.next_chapter")}
          className="group inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-heading text-sm font-semibold text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-25 sm:px-4"
        >
          <span className="hidden sm:inline">{t("reader.next_chapter")}</span>
          <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </nav>
  );
}
