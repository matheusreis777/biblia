import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Popover ──────────────────────────────────────────────────────────────────
// Dropdown ancorado ao gatilho. Não usa portal — e aqui isso é seguro porque
// ele é `absolute`, não `fixed`: o containing block criado pelo `backdrop-blur`
// do header é exatamente o que queremos como âncora. (Overlays `fixed` do topo
// continuam precisando do portal — ver Overlay.tsx.)
//
// Fecha no clique fora, no Esc e ao navegar com Tab para fora do painel.

export interface PopoverProps {
  /** Recebe as props que o gatilho precisa expor para a acessibilidade. */
  trigger: (props: {
    ref: React.RefObject<HTMLButtonElement | null>;
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "dialog";
    "aria-controls": string;
  }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  /** Nome acessível do painel. */
  label: string;
  align?: "start" | "end";
  className?: string;
  /** Painel controlado por fora (opcional). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({
  trigger,
  children,
  label,
  align = "end",
  className,
  open: controlledOpen,
  onOpenChange,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    // Tab levando o foco para fora do popover deve fechá-lo, senão ele fica
    // aberto atrás enquanto o usuário navega o resto da barra.
    const onFocusIn = (e: FocusEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);

    panelRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={wrapRef} className="relative">
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen(!open),
        "aria-expanded": open,
        "aria-haspopup": "dialog",
        "aria-controls": id,
      })}

      {open && (
        <div
          ref={panelRef}
          id={id}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-40 outline-none",
            "rounded-2xl border border-border bg-popover text-popover-foreground shadow-overlay",
            "animate-in fade-in slide-in-from-top-1 duration-150",
            align === "end" ? "right-0" : "left-0",
            className,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}
