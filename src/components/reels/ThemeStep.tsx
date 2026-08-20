import { useTranslation } from "react-i18next";
import { Wand2 } from "lucide-react";
import { THEMES } from "@/reels/themes";
import type { ThemeId } from "@/reels/types";
import { Chip } from "./ui";

// ─── Passo 2: o tema ──────────────────────────────────────────────────────────
// O tema define as buscas enviadas aos provedores de vídeo. Ele é detectado a
// partir do texto do versículo, mas continua editável: a heurística acerta a
// maioria e erra o suficiente para não valer impor.

export function ThemeStep({
  selected,
  detected,
  onSelect,
}: {
  selected: ThemeId;
  detected: ThemeId | null;
  onSelect: (theme: ThemeId) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang: "pt" | "en" = i18n.language.startsWith("pt") ? "pt" : "en";

  return (
    <div className="space-y-3">
      {detected && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground font-body">
          <Wand2 size={12} className="text-primary shrink-0" />
          {t("reels.theme_detected", {
            theme: THEMES.find((x) => x.id === detected)?.label[lang] ?? detected,
          })}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {THEMES.map((theme) => (
          <Chip
            key={theme.id}
            active={theme.id === selected}
            onClick={() => onSelect(theme.id)}
            title={theme.queries[0]}
          >
            {theme.label[lang]}
          </Chip>
        ))}
      </div>
    </div>
  );
}
