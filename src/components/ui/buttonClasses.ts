import { cn } from "@/lib/utils";

// ─── Receita visual do botão ──────────────────────────────────────────────────
// Separada do componente para que <Link> e <a> possam vestir exatamente o mesmo
// botão sem precisar de um Slot — e para não quebrar o fast refresh do Button.
//
// A partir de `md` a altura mínima é 44px (`min-h-11`), o mínimo da WCAG 2.5.5
// e do Apple HIG. O `sm` só é aceitável dentro de painéis onde o alvo real é a
// linha inteira, nunca solto numa barra.

export type ButtonVariant = "primary" | "outline" | "ghost" | "subtle" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-soft hover:brightness-110 active:brightness-95",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-accent hover:border-foreground/20",
  ghost: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
  subtle: "bg-secondary text-secondary-foreground hover:bg-accent",
  destructive:
    "bg-transparent text-destructive border border-destructive/30 hover:bg-destructive/10",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3 gap-1.5 text-xs rounded-lg",
  md: "min-h-11 px-4 py-2 gap-2 text-sm rounded-xl",
  lg: "min-h-12 px-6 py-2.5 gap-2 text-sm rounded-xl",
};

export function buttonClasses(
  variant: ButtonVariant = "outline",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center font-heading font-semibold",
    "transition-[background-color,border-color,color,filter,transform] duration-150",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
