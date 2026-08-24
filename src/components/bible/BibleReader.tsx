import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { useUserData } from "@/auth/UserDataContext";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { VerseSkeleton } from "@/components/ui/Skeleton";
import type { BibleBook } from "@/data/bibleBooks";
import { ChapterHeader } from "./ChapterHeader";
import { useChapter } from "./useChapter";
import { Verse } from "./Verse";
import { VerseActions } from "./VerseActions";

// ─── Corpo do leitor ──────────────────────────────────────────────────────────
// A coluna de leitura é limitada em ~62ch: linha longa demais faz o olho perder
// o começo da próxima, que é o defeito clássico de texto corrido em tela larga.
//
// A barra de ações aparece SOB o versículo selecionado, dentro do fluxo. Fixá-la
// na tela cobriria justamente o texto que se acabou de escolher.

interface BibleReaderProps {
  book: BibleBook;
  chapter: number;
  /** Versículo a destacar ao abrir (vindo da busca por referência). */
  initialVerse?: number;
}

export function BibleReader({ book, chapter, initialVerse }: BibleReaderProps) {
  const { t, i18n } = useTranslation();
  const { isFavorite, toggleFavorite } = useUserData();
  const { passage, loading, error, reload } = useChapter(book.id, chapter, i18n.language);

  // A seleção guarda A QUAL capítulo ela pertence, e o valor exibido é
  // derivado dessa comparação. Trocar de capítulo desfaz a seleção sozinho,
  // sem um efeito que chame setState — que dispararia renderização em cascata.
  // É o mesmo padrão que o estúdio de Reels usa para o tema escolhido.
  const chapterKey = `${book.id}:${chapter}`;
  // `verse: null` é uma escolha registrada de NÃO ter seleção — é o que
  // permite desmarcar o versículo que veio da busca (senão ele voltaria
  // sozinho, porque `initialVerse` continua na URL).
  const [selection, setSelection] = useState<{ key: string; verse: number | null } | null>(
    null,
  );
  const selected =
    selection?.key === chapterKey ? selection.verse : (initialVerse ?? null);

  const select = (verse: number) =>
    setSelection({ key: chapterKey, verse: selected === verse ? null : verse });

  // Rola até o versículo pedido pela busca, depois que o texto chegou.
  useEffect(() => {
    if (!initialVerse || !passage) return;
    const node = document.getElementById(`versiculo-${initialVerse}`);
    node?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [initialVerse, passage]);

  return (
    <div className="mx-auto w-full max-w-[42rem] px-4 py-10 sm:px-6">
      <ChapterHeader book={book} chapter={chapter} />

      {loading && (
        <div aria-live="polite" aria-busy="true">
          <span className="sr-only">{t("common.loading")}</span>
          <VerseSkeleton />
        </div>
      )}

      {error && (
        <EmptyState
          icon={AlertTriangle}
          tone="destructive"
          title={error}
          action={
            <Button variant="primary" onClick={reload}>
              {t("bible.retry")}
            </Button>
          }
        />
      )}

      {passage && !loading && (
        <div className="space-y-0.5">
          {passage.verses.map((v) => {
            const favorited = isFavorite(book.id, chapter, v.verse);
            const text = v.text.trim();
            const isSelected = selected === v.verse;

            return (
              <div key={v.verse} id={`versiculo-${v.verse}`}>
                <Verse
                  number={v.verse}
                  text={text}
                  selected={isSelected}
                  favorited={favorited}
                  onSelect={() => select(v.verse)}
                  onToggleFavorite={() =>
                    toggleFavorite({ bookId: book.id, chapter, verse: v.verse, text })
                  }
                />

                {isSelected && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-150">
                    <VerseActions
                      book={book}
                      chapter={chapter}
                      verse={v.verse}
                      text={text}
                      favorited={favorited}
                      onToggleFavorite={() =>
                        toggleFavorite({ bookId: book.id, chapter, verse: v.verse, text })
                      }
                      className="ml-7 mt-1"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
