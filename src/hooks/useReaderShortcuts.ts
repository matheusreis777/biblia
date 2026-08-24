import { useEffect, useRef } from "react";

// ─── Atalhos do leitor ────────────────────────────────────────────────────────
// Complementam os botões, nunca os substituem. Ficam inertes enquanto o foco
// está num campo de texto ou enquanto há um overlay aberto — senão a seta
// esquerda dentro da busca viraria "capítulo anterior".

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable === true
  );
}

export interface ReaderShortcuts {
  onPrev: () => void;
  onNext: () => void;
  onSearch: () => void;
  onBooks: () => void;
  /** Fecha o que estiver aberto. */
  onEscape: () => void;
  /** Desliga os atalhos de navegação (algum overlay aberto). */
  suspended: boolean;
}

export function useReaderShortcuts(handlers: ReaderShortcuts): void {
  // Um só listener para a vida do leitor: as callbacks entram por ref para o
  // efeito não reassinar a cada renderização. O espelho é escrito em efeito,
  // nunca durante a renderização.
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = ref.current;

      // ⌘K / Ctrl+K abre a busca até de dentro de um campo — é o gesto que as
      // pessoas já trazem de outros produtos.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        h.onSearch();
        return;
      }

      if (e.key === "Escape") {
        h.onEscape();
        return;
      }

      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "/") {
        e.preventDefault();
        h.onSearch();
        return;
      }

      if (h.suspended) return;

      if (e.key === "ArrowLeft") h.onPrev();
      else if (e.key === "ArrowRight") h.onNext();
      else if (e.key.toLowerCase() === "b") h.onBooks();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
