import { useEffect, useRef } from "react";

// ─── Swipe entre capítulos ────────────────────────────────────────────────────
// COMPLEMENTO dos botões, nunca a única forma de virar capítulo.
//
// A trava de eixo é o ponto delicado: o gesto só conta se for claramente
// horizontal (|dx| maior que |dy| por uma margem) e se o dedo quase não subiu.
// Sem isso, uma rolagem vertical um pouco torta viraria a página no meio da
// leitura — que é pior do que não ter o gesto.
//
// Os listeners são passivos: nunca chamamos preventDefault, então a rolagem
// nativa continua com a prioridade que tem.

const MIN_DISTANCE = 60;
const MAX_VERTICAL = 40;
const AXIS_RATIO = 1.5;
/** Acima disso é arrastar devagar, não um gesto de virar página. */
const MAX_DURATION_MS = 700;

export function useSwipeChapter({
  onPrev,
  onNext,
  enabled,
}: {
  onPrev: () => void;
  onNext: () => void;
  enabled: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);

  // Espelho das callbacks, atualizado em efeito (não durante a renderização):
  // é o que permite reassinar os listeners só quando `enabled` muda.
  const handlers = useRef({ onPrev, onNext });
  useEffect(() => {
    handlers.current = { onPrev, onNext };
  }, [onPrev, onNext]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startedAt = 0;
    let tracking = false;

    const onTouchStart = (e: TouchEvent) => {
      // Multitoque é pinça/zoom, não navegação.
      if (e.touches.length !== 1) {
        tracking = false;
        return;
      }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startedAt = Date.now();
      tracking = true;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;

      if (Date.now() - startedAt > MAX_DURATION_MS) return;
      if (Math.abs(dx) < MIN_DISTANCE) return;
      if (Math.abs(dy) > MAX_VERTICAL) return;
      if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return;

      // Selecionar texto também produz um arrasto horizontal; se há seleção,
      // o gesto era outro.
      if (!window.getSelection()?.isCollapsed) return;

      // Arrastar para a esquerda avança, como virar a página de um livro.
      if (dx < 0) handlers.current.onNext();
      else handlers.current.onPrev();
    };

    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled]);

  return ref;
}
