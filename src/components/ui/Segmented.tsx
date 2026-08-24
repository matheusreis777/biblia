import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Controle segmentado ──────────────────────────────────────────────────────
// Escolha única entre poucas opções, todas visíveis: AT/NT, tema, abas do
// estúdio de Reels. Usa `role="tablist"` só quando controla painéis; por
// padrão é um grupo de rádios, que é o que ele é na maioria dos usos.

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Rótulo para leitor de tela quando `label` é só um ícone. */
  srLabel?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Nome acessível do grupo. */
  label: string;
  size?: "sm" | "md";
  className?: string;
  /** Ocupa toda a largura disponível, dividida igualmente. */
  block?: boolean;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "md",
  className,
  block = false,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border border-border bg-secondary p-0.5",
        block && "flex w-full",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.srLabel}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[0.625rem]",
              "font-heading font-semibold transition-colors duration-150",
              block && "flex-1",
              size === "sm" ? "h-8 px-3 text-[11px]" : "min-h-10 px-3.5 text-xs",
              active
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
