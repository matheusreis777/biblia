import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Estado vazio ─────────────────────────────────────────────────────────────
// Um só desenho para "nada aqui ainda", "nada encontrado" e "deu erro". O que
// muda é o ícone, o texto e a ação — não o layout.

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "neutral" | "destructive";
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col items-center px-6 py-16 text-center", className)}
    >
      <div
        className={cn(
          "mb-5 flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "destructive"
            ? "bg-destructive/10 text-destructive"
            : "bg-secondary text-muted-foreground",
        )}
      >
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
