import { useTranslation } from "react-i18next";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RenderStage } from "@/reels/types";
import type { ReelRenderState } from "./useReelRender";

// ─── Progresso da geração ─────────────────────────────────────────────────────
// As etapas são as que o servidor realmente emite; o percentual da etapa de
// renderização vem do `-progress` do FFmpeg. Nada aqui é uma barra fingida —
// se o servidor travar, a barra trava junto, que é o comportamento correto.

// Mesma ordem em que o servidor emite as etapas (ver generateReel).
const ALL_STAGES: RenderStage[] = [
  "preparing",
  "composing",
  "typesetting",
  "narrating",
  "fetchingMusic",
  "fetchingVideo",
  "rendering",
  "done",
];

export function RenderProgress({
  state,
  withNarration,
  withMusic,
}: {
  state: ReelRenderState;
  /** Etapas que o servidor pula quando o recurso está desligado. Listá-las
   *  assim mesmo as marcaria como concluídas sem nunca terem acontecido. */
  withNarration: boolean;
  withMusic: boolean;
}) {
  const { t } = useTranslation();
  const skipped = new Set<RenderStage>();
  if (!withNarration) skipped.add("narrating");
  if (!withMusic) skipped.add("fetchingMusic");
  const STAGE_ORDER = ALL_STAGES.filter((s) => !skipped.has(s));

  if (state.phase === "idle") return null;

  if (state.phase === "error") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-heading font-bold text-destructive uppercase tracking-wider">
            {t("reels.render_failed")}
          </p>
          <p className="mt-1 text-xs text-destructive/90 font-body">{state.error}</p>
        </div>
      </div>
    );
  }

  const currentIndex = state.stage ? STAGE_ORDER.indexOf(state.stage) : 0;

  // O download do MP4 é a última fatia da barra: depois de renderizar, os
  // megabytes ainda precisam chegar até o browser, e ficar em 100% parado
  // durante isso pareceria travamento.
  const overall =
    state.downloadPct !== null
      ? 90 + (state.downloadPct / 100) * 10
      : ((currentIndex + (state.pct ?? 0) / 100) / (STAGE_ORDER.length - 1)) * 90;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-4">
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(2, overall))}%` }}
        />
      </div>

      <ul className="space-y-1.5">
        {STAGE_ORDER.filter((s) => s !== "done").map((stage, index) => {
          const done = index < currentIndex || state.phase === "done";
          const active = index === currentIndex && state.phase === "running";
          return (
            <li key={stage} className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                {done ? (
                  <Check size={12} className="text-primary" />
                ) : active ? (
                  <Loader2 size={12} className="animate-spin text-primary" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                )}
              </span>
              <span
                className={cn(
                  "text-xs font-body transition-colors",
                  done ? "text-foreground/60" : active ? "text-foreground" : "text-muted-foreground/50",
                )}
              >
                {t(`reels.stage_${stage}`)}
              </span>
              {active && state.pct !== null && (
                <span className="ml-auto text-[10px] font-heading font-bold text-primary tabular-nums">
                  {Math.round(state.pct)}%
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {state.downloadPct !== null && state.phase === "running" && (
        <p className="text-[10px] text-muted-foreground font-body tabular-nums">
          {t("reels.stage_downloading", { pct: Math.round(state.downloadPct) })}
        </p>
      )}
    </div>
  );
}
