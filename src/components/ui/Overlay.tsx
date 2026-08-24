import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// ─── Base de todos os overlays ────────────────────────────────────────────────
// SEMPRE em portal no <body>, e isso não é preferência: os gatilhos ficam no
// <header>, que tem `backdrop-blur`. Pela spec, `backdrop-filter` cria um
// containing block para descendentes `position: fixed` — sem o portal, o
// `inset-0` se ancorava na faixa de 56px do topo e o painel saía cortado.
// (O AuthDialog já tinha descoberto isso na marra; aqui a lição virou regra.)
//
// Cuida de: trava de rolagem, Esc, clique no fundo, foco preso e devolução do
// foco ao gatilho.

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Pilha de overlays abertos. Existe porque eles ANINHAM de verdade: o diálogo
// de login é aberto de dentro do menu mobile, que é um sheet. Sem a pilha, um
// Esc fecharia os dois de uma vez e o foco ficaria preso no painel de baixo
// enquanto o de cima estava na tela.
//
// Serve também para a trava de rolagem: só o último a sair destrava.
const stack: symbol[] = [];

function pushOverlay(id: symbol): () => void {
  if (stack.length === 0) document.body.style.overflow = "hidden";
  stack.push(id);
  return () => {
    const index = stack.indexOf(id);
    if (index !== -1) stack.splice(index, 1);
    if (stack.length === 0) document.body.style.overflow = "";
  };
}

const isTopmost = (id: symbol) => stack[stack.length - 1] === id;

export interface OverlayProps {
  open: boolean;
  onClose: () => void;
  /** Nome acessível do diálogo. */
  label: string;
  /** Conteúdo do painel. O fundo é desenhado aqui. */
  children: ReactNode;
  /** Alinhamento do painel dentro da tela (ex.: `items-end justify-center`). */
  className?: string;
  /** Aparência do painel em si (largura, altura, superfície, animação). */
  panelClassName?: string;
  /** `false` mantém o fundo clicável (ex.: popover). Padrão: fecha. */
  closeOnBackdrop?: boolean;
}

export function Overlay({
  open,
  onClose,
  label,
  children,
  className,
  panelClassName,
  closeOnBackdrop = true,
}: OverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // `onClose` costuma ser uma seta inline; guardar em ref evita reassinar os
  // listeners a cada renderização do pai. Escrito em efeito, não na render.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const id = Symbol("overlay");
    restoreRef.current = document.activeElement as HTMLElement | null;
    const release = pushOverlay(id);

    const onKeyDown = (e: KeyboardEvent) => {
      // Só o overlay do topo responde: com o diálogo de login aberto por cima
      // do menu, um Esc deve fechar o diálogo e deixar o menu de pé.
      if (!isTopmost(id)) return;

      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      // Foco preso: o Tab circula dentro do painel.
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    // Foca o primeiro campo/controle, ou o próprio painel se não houver.
    const panel = panelRef.current;
    const target = panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel;
    target?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      release();
      restoreRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const onBackdrop = useCallback(() => {
    if (closeOnBackdrop) closeRef.current();
  }, [closeOnBackdrop]);

  if (!open) return null;

  return createPortal(
    <div className={cn("fixed inset-0 z-50 flex", className)}>
      <div
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px] animate-in fade-in duration-150 dark:bg-black/65"
        onClick={onBackdrop}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn("relative z-10 flex min-h-0 flex-col outline-none", panelClassName)}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
