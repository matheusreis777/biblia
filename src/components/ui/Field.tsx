import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Controles de formulário ──────────────────────────────────────────────────
// Vieram de src/components/reels/ui.tsx, onde eram os únicos primitivos do
// projeto. Agora que a Bíblia também precisa deles (preferências de leitura,
// filtros de favoritos), moraram para cá — as receitas são as mesmas, só
// ganharam alvo de toque decente e estados de foco.

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

export function Chip({
  active,
  onClick,
  children,
  title,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5",
        "font-body text-xs font-medium transition-colors duration-150 active:scale-95",
        active
          ? "bg-primary text-primary-foreground shadow-soft"
          : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
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
      <span className="mb-2 flex items-baseline justify-between">
        <FieldLabel>{label}</FieldLabel>
        <span className="font-heading text-xs font-semibold tabular-nums text-foreground/70">
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
        // `py-2` dá altura de toque à trilha sem engordar o desenho do controle.
        className="w-full cursor-pointer py-2 accent-primary"
      />
    </label>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center gap-3 rounded-lg py-1.5 text-left"
    >
      <span
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-card shadow-soft transition-transform duration-150",
            checked && "translate-x-4",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block font-body text-xs text-foreground/85 transition-colors group-hover:text-foreground">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block font-body text-[11px] leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}

/** Campo de texto com o mesmo desenho em todo o app. */
export function TextInput({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-xl border border-input bg-card px-3.5 py-2",
        "font-body text-sm text-foreground placeholder:text-muted-foreground",
        "transition-colors focus:border-primary focus:outline-none",
        className,
      )}
      {...rest}
    />
  );
}
