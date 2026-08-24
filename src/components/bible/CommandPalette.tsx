import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, Loader2, Search } from "lucide-react";
import { bookAbbrev, bookName, type BibleBook } from "@/data/bibleBooks";
import { parseReference, searchBooks } from "@/lib/reference";
import { cn } from "@/lib/utils";
import { Overlay } from "@/components/ui/Overlay";
import { translationFor } from "./useChapter";

// ─── Busca global ─────────────────────────────────────────────────────────────
// Command palette, não uma caixa de texto solta. Duas coisas mudaram em relação
// à busca antiga, que só filtrava nomes de livro:
//
//   1. entende REFERÊNCIAS ("Jo 3:16", "Gn 1", "1co 13") — ver lib/reference.ts;
//   2. quando a referência aponta para um versículo, busca o capítulo e mostra
//      o TRECHO, para dar certeza antes de navegar.
//
// A bible-api.com não tem endpoint de busca por palavra, então busca full-text
// da Bíblia inteira ficaria de fora sem indexar o texto num backend próprio.
// O que existe aqui resolve o caso comum sem essa infraestrutura.

interface VersePreview {
  text: string;
  reference: string;
}

/** Busca o versículo da referência para mostrar o trecho. */
function useVersePreview(target: { book: BibleBook; chapter: number; verse?: number } | null) {
  const { i18n } = useTranslation();
  const [preview, setPreview] = useState<VersePreview | null>(null);
  const [loading, setLoading] = useState(false);

  const key = target ? `${target.book.id}:${target.chapter}:${target.verse ?? ""}` : null;

  useEffect(() => {
    if (!target?.verse) {
      setPreview(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    // Debounce: a pessoa ainda está digitando a referência.
    const timer = window.setTimeout(async () => {
      try {
        const translation = translationFor(i18n.language);
        const ref = `${target.book.id} ${target.chapter}:${target.verse}`;
        const url = import.meta.env.DEV
          ? `https://bible-api.com/${encodeURIComponent(ref)}?translation=${translation}`
          : `/api/bible-passage?ref=${encodeURIComponent(ref)}&translation=${translation}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { reference: string; text: string };
        setPreview({ text: data.text.trim(), reference: data.reference });
      } catch {
        // Referência inexistente (Salmos 23:99) ou rede fora: a linha "ir para"
        // continua servindo, só não mostra o trecho.
        if (!controller.signal.aborted) setPreview(null);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // `key` resume a identidade do alvo; `target` é um objeto novo a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, i18n.language]);

  return { preview, loading };
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (book: BibleBook, chapter: number, verse?: number) => void;
}

/** Fechar desmonta, e é assim que a busca volta vazia na próxima abertura. */
export function CommandPalette({ open, ...props }: CommandPaletteProps) {
  if (!open) return null;
  return <Palette {...props} />;
}

function Palette({ onClose, onNavigate }: Omit<CommandPaletteProps, "open">) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const reference = useMemo(() => (query.trim() ? parseReference(query) : null), [query]);
  const books = useMemo(() => (query.trim() ? searchBooks(query, 6) : []), [query]);
  const { preview, loading } = useVersePreview(reference);

  // Uma lista só para o teclado percorrer: a referência (quando há) e depois os
  // livros, sem repetir o livro que já apareceu como referência exata.
  const items = useMemo(() => {
    const list: {
      key: string;
      book: BibleBook;
      chapter: number;
      verse?: number;
      kind: "reference" | "book";
    }[] = [];

    if (reference) {
      list.push({
        key: "ref",
        book: reference.book,
        chapter: reference.chapter,
        verse: reference.verse,
        kind: "reference",
      });
    }
    for (const book of books) {
      if (reference && book.id === reference.book.id) continue;
      list.push({ key: book.id, book, chapter: 1, kind: "book" });
    }
    return list;
  }, [reference, books]);

  // O índice ativo é PRESO à lista no momento da renderização, em vez de
  // zerado por um efeito quando a lista muda: digitar mais uma letra encurta os
  // resultados, e um efeito de reset renderizaria duas vezes por tecla.
  const active = items.length ? Math.min(cursor, items.length - 1) : 0;

  const go = (index: number) => {
    const item = items[index];
    if (!item) return;
    onNavigate(item.book, item.chapter, item.verse);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(items.length ? (active + 1) % items.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(items.length ? (active - 1 + items.length) % items.length : 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(active);
    }
  };

  return (
    <Overlay
      open
      onClose={onClose}
      label={t("search.title")}
      // No mobile encosta no topo e ganha altura; no desktop flutua a 12vh.
      className="items-start justify-center p-3 sm:p-4"
      panelClassName="mt-[6vh] w-full max-w-xl rounded-2xl border bg-popover shadow-overlay animate-in fade-in slide-in-from-top-2 duration-200 sm:mt-[12vh]"
    >
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search size={18} className="shrink-0 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("search.placeholder")}
          aria-label={t("search.title")}
          className="h-14 min-w-0 flex-1 bg-transparent font-body text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {loading && <Loader2 size={16} className="shrink-0 animate-spin text-muted-foreground" />}
      </div>

      <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2" role="listbox">
        {items.length === 0 && (
          <p className="px-3 py-10 text-center font-body text-sm leading-relaxed text-muted-foreground">
            {query.trim() ? t("search.no_results") : t("search.no_results_hint")}
          </p>
        )}

        {items.map((item, index) => {
          const selected = index === active;
          const isRef = item.kind === "reference";
          const label = `${bookName(item.book, i18n.language)} ${item.chapter}${
            item.verse ? `:${item.verse}` : ""
          }`;

          return (
            <button
              key={item.key}
              type="button"
              role="option"
              aria-selected={selected}
              onMouseEnter={() => setCursor(index)}
              onClick={() => go(index)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                selected ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  isRef ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
                )}
              >
                {isRef ? <ArrowRight size={15} /> : <BookOpen size={15} />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-heading text-sm font-semibold text-foreground">
                  {label}
                </span>
                {isRef && item.verse && preview ? (
                  <span className="mt-0.5 line-clamp-2 block font-body text-xs leading-relaxed text-muted-foreground">
                    {preview.text}
                  </span>
                ) : (
                  <span className="mt-0.5 block font-body text-xs text-muted-foreground">
                    {bookAbbrev(item.book, i18n.language)}
                    <span className="mx-1.5 text-border">·</span>
                    {item.book.testament === "AT"
                      ? t("bible.old_testament")
                      : t("bible.new_testament")}
                    <span className="mx-1.5 text-border">·</span>
                    {t("search.chapters_count", { count: item.book.chapters })}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </Overlay>
  );
}
