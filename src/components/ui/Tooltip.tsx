import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Tooltip ──────────────────────────────────────────────────────────────────
// Só aparece em ponteiro fino (`pointer-fine:`): em toque não existe hover, e
// um tooltip que nunca abre é ruído no DOM.
//
// É sempre REDUNDANTE — o nome acessível do controle vem do `aria-label` do
// IconButton, nunca daqui. `aria-hidden` evita o leitor de tela anunciar duas
// vezes a mesma coisa.

export function Tooltip({
  content,
  children,
  side = "bottom",
  className,
}: {
  content: string;
  children: ReactNode;
  side?: "bottom" | "top";
  className?: string;
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap",
          "rounded-lg border border-border bg-popover px-2 py-1",
          "font-body text-[11px] text-popover-foreground shadow-lift",
          "opacity-0 transition-opacity duration-150 delay-300",
          "group-hover/tip:opacity-100 group-focus-within/tip:opacity-100",
          "pointer-fine:block",
          side === "bottom" ? "top-[calc(100%+0.375rem)]" : "bottom-[calc(100%+0.375rem)]",
        )}
      >
        {content}
      </span>
    </span>
  );
}
