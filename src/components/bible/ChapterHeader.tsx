import { useTranslation } from "react-i18next";
import { bookName, type BibleBook } from "@/data/bibleBooks";

// ─── Cabeçalho do capítulo ────────────────────────────────────────────────────
// Editorial, não painel: o nome do livro grande, a linha de contexto pequena em
// versalete e um filete. Saíram o ladrilho de ícone verde e a caixa que
// existiam antes — eram um selo administrativo em cima de um texto literário.

export function ChapterHeader({ book, chapter }: { book: BibleBook; chapter: number }) {
  const { t, i18n } = useTranslation();
  const testament =
    book.testament === "AT" ? t("bible.old_testament") : t("bible.new_testament");

  return (
    <header className="mb-9 border-b border-border pb-6">
      <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {testament}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {bookName(book, i18n.language)}
      </h1>
      <p className="mt-1.5 font-body text-sm text-muted-foreground">
        {t("reader.chapter_label", { number: chapter })}
        <span className="mx-1.5 text-border">·</span>
        {book.chapters} {t("bible.chapters").toLowerCase()}
      </p>
    </header>
  );
}
