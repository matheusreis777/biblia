import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Botão de ícone ───────────────────────────────────────────────────────────
// `label` é obrigatório: um botão só com ícone sem `aria-label` é um botão sem
// nome para leitor de tela, e era assim que quase todos os controles do topo
// estavam.
//
// Sobre a área de toque: `md` mede 44x44 de verdade. `sm` desenha 36x36 mas
// estende a área clicável com um pseudo-elemento (`after:-inset-1`), o que dá
// os 44px sem empurrar o layout — foi assim que a estrela do versículo pôde
// crescer sem afastar o texto.

export type IconButtonSize = "sm" | "md";
export type IconButtonVariant = "ghost" | "outline" | "subtle" | "primary";

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
  outline:
    "border border-border text-muted-foreground hover:text-foreground hover:bg-accent hover:border-foreground/20",
  subtle: "bg-secondary text-secondary-foreground hover:bg-accent",
  primary: "bg-primary text-primary-foreground shadow-soft hover:brightness-110",
};

const SIZES: Record<IconButtonSize, string> = {
  // O pseudo-elemento é o alvo real; não pinta nada, só amplia o clique.
  sm: "h-9 w-9 rounded-lg after:absolute after:-inset-1 after:content-['']",
  md: "h-11 w-11 rounded-xl",
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Nome acessível do botão. Vira `aria-label`. */
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = "md", variant = "ghost", className, type = "button", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        "transition-[background-color,border-color,color] duration-150",
        "active:scale-95 disabled:pointer-events-none disabled:opacity-30",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
