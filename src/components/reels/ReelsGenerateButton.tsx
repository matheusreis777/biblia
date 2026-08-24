import { useTranslation } from "react-i18next";
import { AlertTriangle, Download, Film, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { cn } from "@/lib/utils";
import { RenderProgress } from "./RenderProgress";
import type { ReelRenderState } from "./useReelRender";

// ─── Gerar / baixar ───────────────────────────────────────────────────────────
// Um componente para as duas posições: a coluna sticky do desktop e a barra
// fixa do mobile. Os avisos vêm junto porque é onde eles importam — avisar que
// a narração vai ser cortada longe do botão de gerar não serve de nada.

export interface ReelsWarning {
  message: string;
  /** Ação de conserto em um clique, quando existe. */
  fix?: { label: string; onClick: () => void };
}

function Warning({ warning }: { warning: ReelsWarning }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5"
    >
      <AlertTriangle size={13} className="mt-0.5 shrink-0 text-destructive" />
      <div className="min-w-0 space-y-1.5">
        <p className="font-body text-[11px] leading-snug text-destructive">{warning.message}</p>
        {warning.fix && (
          <button
            type="button"
            onClick={warning.fix.onClick}
            className="font-heading text-[11px] font-bold uppercase tracking-wider text-primary transition-opacity hover:opacity-80"
          >
            {warning.fix.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function ReelsGenerateButton({
  render,
  canGenerate,
  onGenerate,
  onReset,
  downloadName,
  withNarration,
  withMusic,
  warnings,
  /** `compact` esconde o progresso detalhado — é a versão da barra fixa. */
  compact = false,
  className,
}: {
  render: ReelRenderState;
  canGenerate: boolean;
  onGenerate: () => void;
  onReset: () => void;
  downloadName: string;
  withNarration: boolean;
  withMusic: boolean;
  warnings: ReelsWarning[];
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const running = render.phase === "running";
  const done = render.phase === "done" && render.url;

  return (
    <div className={cn("space-y-3", className)}>
      {!compact && warnings.map((w) => <Warning key={w.message} warning={w} />)}

      {!compact && (
        <RenderProgress state={render} withNarration={withNarration} withMusic={withMusic} />
      )}

      {done ? (
        <div className="space-y-2">
          <a
            href={render.url!}
            download={downloadName}
            className={buttonClasses("primary", "lg", "w-full")}
          >
            <Download size={16} />
            {t("reels.download", { size: ((render.bytes ?? 0) / 1024 / 1024).toFixed(1) })}
          </a>
          <Button variant="outline" size="md" onClick={onReset} className="w-full">
            <RotateCcw size={14} />
            {t("reels.generate_again")}
          </Button>
        </div>
      ) : (
        <Button
          variant="primary"
          size="lg"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="w-full"
        >
          {running ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
          {running ? t("reels.generating") : t("reels.generate")}
        </Button>
      )}

      {/* Na barra fixa o progresso vira uma linha só, para não roubar altura
          dos controles que estão sendo mexidos. */}
      {compact && running && (
        <p
          className="text-center font-body text-[11px] text-muted-foreground"
          aria-live="polite"
        >
          {t(`reels.stage_${render.stage ?? "preparing"}`)}
          {render.pct !== null && ` · ${render.pct}%`}
        </p>
      )}

      {compact && warnings.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 font-body text-[11px] text-destructive">
          <AlertTriangle size={11} />
          {warnings[0].message}
        </p>
      )}
    </div>
  );
}
