import { useTranslation } from "react-i18next";
import { Check, Wand2 } from "lucide-react";
import { THEMES } from "@/reels/themes";
import type { ThemeId } from "@/reels/types";
import { cn } from "@/lib/utils";

// ─── Passo 2: o tema ──────────────────────────────────────────────────────────
// O tema define as buscas enviadas aos provedores de vídeo. Ele é detectado a
// partir do texto do versículo, mas continua editável: a heurística acerta a
// maioria e erra o suficiente para não valer impor.
//
// As miniaturas são gradientes, não frames de vídeo: `src/reels/themes.ts` não
// guarda cor nem thumbnail, e buscar 13 vídeos só para ilustrar a escolha
// custaria 13 requisições antes de qualquer decisão. O gradiente evoca a
// paisagem que a busca vai trazer ("sunrise over ocean", "still lake") e mora
// nesta camada de UI, sem tocar no motor.

const SWATCHES: Record<ThemeId, string> = {
  faith: "linear-gradient(160deg,#f6c66b,#c9743a 55%,#5b3a2e)",
  hope: "linear-gradient(160deg,#ffd9a0,#ff9d6c 50%,#8d4f7d)",
  peace: "linear-gradient(160deg,#a8d8e8,#5f9ec4 55%,#2c4f6b)",
  love: "linear-gradient(160deg,#f7b7c2,#d4657f 55%,#6e2b45)",
  strength: "linear-gradient(160deg,#9aa8b5,#4d5f70 55%,#1e2a35)",
  trust: "linear-gradient(160deg,#bcd6c3,#6d9c85 55%,#2f4f45)",
  prayer: "linear-gradient(160deg,#d9c7ea,#8b6fb0 55%,#3a2b52)",
  gratitude: "linear-gradient(160deg,#ffe6a7,#e0a25e 55%,#7c4a1e)",
  god: "linear-gradient(160deg,#fff2c9,#e0b95e 50%,#7a5a1f)",
  protection: "linear-gradient(160deg,#b6c4d8,#5a6f92 55%,#242f45)",
  wisdom: "linear-gradient(160deg,#cfd8b8,#8a9a63 55%,#3c4526)",
  overcoming: "linear-gradient(160deg,#ffc9a0,#d1622f 55%,#5c2416)",
  purpose: "linear-gradient(160deg,#a9c6e8,#4a72a8 55%,#1f3552)",
};

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
        <p className="flex items-center gap-2 font-body text-[11px] text-muted-foreground">
          <Wand2 size={12} className="shrink-0 text-primary" />
          {t("reels.theme_detected", {
            theme: THEMES.find((x) => x.id === detected)?.label[lang] ?? detected,
          })}
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
        {THEMES.map((theme) => {
          const active = theme.id === selected;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelect(theme.id)}
              aria-pressed={active}
              title={theme.queries[0]}
              className={cn(
                "group relative overflow-hidden rounded-xl border transition-all active:scale-95",
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-foreground/25",
              )}
            >
              <span
                aria-hidden="true"
                className="block h-12 w-full transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundImage: SWATCHES[theme.id] }}
              />
              {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}
              <span
                className={cn(
                  "block truncate px-2 py-1.5 font-heading text-[11px] font-semibold",
                  active ? "text-primary" : "text-foreground/75",
                )}
              >
                {theme.label[lang]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
