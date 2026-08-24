import { useCallback, useSyncExternalStore } from "react";

// ─── useMediaQuery ────────────────────────────────────────────────────────────
// `useSyncExternalStore` em vez de useState + useEffect: o valor é lido no
// mesmo instante da renderização, então componentes que escolhem ENTRE dois
// desenhos (popover no desktop, sheet no mobile) não montam o errado primeiro
// para trocar logo depois.

export function useMediaQuery(query: string): boolean {
  // Memoizado: `subscribe` com identidade nova a cada renderização faria o
  // useSyncExternalStore reassinar o listener sem parar.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** `lg` do Tailwind — o ponto onde há espaço para painéis lado a lado. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/** Ponteiro grosso: toque. Decide affordances, nunca esconde funcionalidade. */
export function useIsTouch(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
