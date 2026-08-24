import { cn } from "@/lib/utils";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
// Varredura em vez de `animate-pulse`: pulsar a opacidade do bloco inteiro
// pisca junto com o texto que chega depois. A varredura é mais quieta e sugere
// direção de leitura.

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/[0.06] to-transparent" />
    </div>
  );
}

/** Esqueleto do capítulo: número + duas linhas, no ritmo do texto real. */
export function VerseSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="space-y-7">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="mt-1.5 h-3 w-5 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className={i % 3 === 0 ? "h-4 w-3/5" : "h-4 w-4/5"} />
          </div>
        </div>
      ))}
    </div>
  );
}
