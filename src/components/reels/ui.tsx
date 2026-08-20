import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Primitivos da página de Reels ────────────────────────────────────────────
// O projeto não tem biblioteca de componentes: a página da Bíblia repete as
// classes inline. Aqui elas são extraídas porque se repetem muitas vezes nesta
// tela — mas as receitas são exatamente as mesmas já usadas no site.

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
        "bg-card border border-border rounded-xl p-5 sm:p-6 transition-opacity",
        disabled && "opacity-40 pointer-events-none select-none",
      )}
    >
      <header className="flex items-baseline gap-3 mb-4">
        <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-lg bg-primary/10 text-primary text-[11px] font-heading font-bold">
          {index}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">
            {title}
          </h2>
          {hint && <p className="text-xs text-muted-foreground mt-1 font-body">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all active:scale-95",
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "bg-muted/40 text-foreground/70 hover:bg-primary/15 hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-heading font-semibold">
      {children}
    </span>
  );
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
  display,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
  display: string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-2">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-xs text-foreground/70 font-heading font-semibold tabular-nums">
          {display}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full text-left group"
    >
      <span
        className={cn(
          "relative w-9 h-5 rounded-full transition-colors shrink-0",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform",
            checked && "translate-x-4",
          )}
        />
      </span>
      <span className="text-xs font-body text-foreground/80 group-hover:text-foreground transition-colors">
        {label}
      </span>
    </button>
  );
}
