import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./IconButton";
import { Overlay } from "./Overlay";

// ─── Sheet ────────────────────────────────────────────────────────────────────
// Um painel, três ancoragens. `bottom` é o bottom sheet de toque: limitado a
// 85svh de propósito — cobrir a tela inteira faz perder o contexto do que
// estava sendo lido, que é justamente o que o menu de livros precisa manter.
//
// A alça do topo não é decorativa: é o que sinaliza "isto desliza" em toque.

export type SheetSide = "left" | "right" | "bottom";

const ALIGN: Record<SheetSide, string> = {
  left: "justify-start",
  right: "justify-end",
  bottom: "items-end justify-center",
};

const PANEL: Record<SheetSide, string> = {
  left:
    "h-full w-[min(22rem,88vw)] border-r bg-card shadow-overlay " +
    "animate-in slide-in-from-left duration-200",
  right:
    "h-full w-[min(24rem,90vw)] border-l bg-card shadow-overlay " +
    "animate-in slide-in-from-right duration-200",
  bottom:
    "w-full sm:max-w-lg max-h-[85svh] rounded-t-3xl border-t border-x bg-card shadow-overlay " +
    "animate-in slide-in-from-bottom duration-250",
};

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  title: string;
  /** Esconde o cabeçalho visual, mantendo `title` como nome acessível. */
  hideHeader?: boolean;
  /** Linha de controles à direita do título. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Corpo do painel. Passe `overflow-hidden` quando o filho rola sozinho. */
  bodyClassName?: string;
}

export function Sheet({
  open,
  onClose,
  side = "bottom",
  title,
  hideHeader = false,
  actions,
  children,
  className,
  bodyClassName,
}: SheetProps) {
  const { t } = useTranslation();

  return (
    <Overlay
      open={open}
      onClose={onClose}
      label={title}
      className={ALIGN[side]}
      panelClassName={cn(PANEL[side], className)}
    >
      {side === "bottom" && (
        <div className="flex justify-center pt-3 pb-1 shrink-0" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>
      )}

      {!hideHeader && (
        <header
          className={cn(
            "flex items-center gap-2 px-4 shrink-0 border-b border-border",
            side === "bottom" ? "pb-3 pt-1" : "h-14",
          )}
        >
          <h2 className="flex-1 min-w-0 truncate font-heading text-sm font-semibold uppercase tracking-widest">
            {title}
          </h2>
          {actions}
          <IconButton label={t("common.close")} size="sm" onClick={onClose}>
            <X size={17} />
          </IconButton>
        </header>
      )}

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
          // Respeita a barra de gestos do iOS quando o painel encosta embaixo.
          side === "bottom" && "pb-[max(1rem,env(safe-area-inset-bottom))]",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </Overlay>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
// Mesmo overlay, centralizado. Usado pelo diálogo de login.

interface ModalProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, label, children, className }: ModalProps) {
  return (
    <Overlay
      open={open}
      onClose={onClose}
      label={label}
      className="items-center justify-center overflow-y-auto p-4"
      panelClassName={cn(
        "w-full max-w-sm rounded-2xl border bg-card shadow-overlay",
        "animate-in fade-in zoom-in-95 duration-200",
        className,
      )}
    >
      {children}
    </Overlay>
  );
}
