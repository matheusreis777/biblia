import { useTranslation } from "react-i18next";
import { AudioLines, Film, Music, Palette, Quote, Sparkles } from "lucide-react";
import { THEMES } from "@/reels/themes";
import { STYLES } from "@/reels/styles";
import type { StyleId, ThemeId } from "@/reels/types";
import { cn } from "@/lib/utils";

// ─── Finalização ──────────────────────────────────────────────────────────────
// O que exatamente vai ser gerado, em uma tela. O fluxo tem cinco áreas de
// ajuste e é fácil perder de vista o que ficou ligado — principalmente no
// mobile, onde só uma seção aparece por vez.

interface SummaryRow {
  icon: typeof Film;
  label: string;
  value: string;
  muted?: boolean;
}

export function ReelsSummary({
  reference,
  verseText,
  theme,
  styleId,
  videoAuthor,
  narrationEnabled,
  voiceLabel,
  musicLabel,
  durationSec,
  className,
}: {
  reference: string;
  verseText: string;
  theme: ThemeId;
  styleId: StyleId;
  videoAuthor: string | null;
  narrationEnabled: boolean;
  voiceLabel: string | null;
  musicLabel: string | null;
  durationSec: number;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const lang: "pt" | "en" = i18n.language.startsWith("pt") ? "pt" : "en";

  const themeLabel = THEMES.find((x) => x.id === theme)?.label[lang] ?? theme;

  const rows: SummaryRow[] = [
    {
      icon: Palette,
      label: t("reels.step_theme"),
      value: `${STYLES[styleId].name[lang]} · ${themeLabel}`,
    },
    {
      icon: Film,
      label: t("reels.step_video"),
      value: videoAuthor ?? t("reels.summary_pending"),
      muted: !videoAuthor,
    },
    {
      icon: AudioLines,
      label: t("reels.audio_enable"),
      value: narrationEnabled ? (voiceLabel ?? t("reels.audio_enable")) : t("reels.summary_off"),
      muted: !narrationEnabled,
    },
    {
      icon: Music,
      label: t("reels.music_enable"),
      value: musicLabel ?? t("reels.summary_off"),
      muted: !musicLabel,
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <p className="flex items-center gap-2 font-heading text-[10px] font-semibold uppercase tracking-widest text-primary">
          <Sparkles size={12} />
          {t("reels.summary_ready")}
        </p>
        <p className="mt-3 line-clamp-3 font-body text-sm leading-relaxed text-foreground/90">
          <Quote size={13} className="mr-1 inline -translate-y-0.5 text-muted-foreground" />
          {verseText}
        </p>
        {reference && (
          <p className="mt-2 font-heading text-xs font-semibold text-foreground">{reference}</p>
        )}
      </div>

      <dl className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
        {rows.map(({ icon: Icon, label, value, muted }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon size={15} className="shrink-0 text-muted-foreground" />
            <dt className="font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </dt>
            <dd
              className={cn(
                "ml-auto min-w-0 truncate font-body text-xs",
                muted ? "text-muted-foreground/70" : "text-foreground",
              )}
            >
              {value}
            </dd>
          </div>
        ))}
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-[15px] shrink-0" aria-hidden="true" />
          <dt className="font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("reels.custom_duration")}
          </dt>
          <dd className="ml-auto font-body text-xs tabular-nums text-foreground">
            {durationSec}s
          </dd>
        </div>
      </dl>
    </div>
  );
}
