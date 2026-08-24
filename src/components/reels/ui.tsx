import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Primitivo do estúdio de Reels ────────────────────────────────────────────
// Chip, FieldLabel, Slider e Toggle saíram daqui para @/components/ui/Field —
// a Bíblia passou a usar os mesmos controles. Ficou só o `Step`, que é
// específico do fluxo do gerador.

export function Step({
  index,
  title,
  hint,
  children,
  disabled,
}: {
  index: number;
  title: string;
  hint?: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-opacity sm:p-6",
        disabled && "pointer-events-none select-none opacity-40",
      )}
    >
      <header className="mb-4 flex items-baseline gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-[11px] font-bold text-primary">
          {index}
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h2>
          {hint && <p className="mt-1 font-body text-xs text-muted-foreground">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
