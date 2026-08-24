import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { FONT_FAMILIES } from "@/reels/fonts";
import { STYLE_ORDER, STYLES, type StyleOverrides } from "@/reels/styles";
import type { FontId, ScrimKind, StyleId, TextAnchor } from "@/reels/types";
import { Chip, FieldLabel, Slider, Toggle } from "@/components/ui/Field";

// ─── Passo 4: estilo e personalização ─────────────────────────────────────────
// Os quatro presets definem uma composição inteira; os controles abaixo ajustam
// pontos dela. O que não for tocado continua vindo do preset.

const TEXT_COLORS = ["#FFFFFF", "#F5F0E6", "#FFE9C7", "#DFF3E4", "#E8E4FF"];

export function StyleStep({
  styleId,
  overrides,
  durationSec,
  onStyle,
  onOverrides,
  onDuration,
  brandingText,
  onBranding,
  siteText,
  onSite,
}: {
  styleId: StyleId;
  overrides: StyleOverrides;
  durationSec: number;
  onStyle: (id: StyleId) => void;
  onOverrides: (patch: StyleOverrides) => void;
  onDuration: (seconds: number) => void;
  brandingText: string;
  onBranding: (text: string) => void;
  siteText: string;
  onSite: (text: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang: "pt" | "en" = i18n.language.startsWith("pt") ? "pt" : "en";
  const preset = STYLES[styleId];

  // Cada controle mostra o valor efetivo: o ajuste do usuário quando existe,
  // senão o que o preset define.
  const scrimKind = overrides.scrimKind ?? preset.scrim.kind;
  const scrimIntensity = overrides.scrimIntensity ?? preset.scrim.intensity;
  const font = overrides.font ?? preset.font;
  const anchor = overrides.anchor ?? preset.anchor;
  const align = overrides.align ?? preset.align;
  const color = overrides.color ?? preset.color;
  const fontScale = overrides.fontScale ?? 1;
  const showReference = overrides.showReference ?? preset.showReference;
  const showBranding = overrides.showBranding ?? preset.showBranding;

  const anchors: { id: TextAnchor; label: string }[] = [
    { id: "center", label: t("reels.anchor_center") },
    { id: "lowerThird", label: t("reels.anchor_lower") },
    { id: "bottom", label: t("reels.anchor_bottom") },
  ];

  const scrims: { id: ScrimKind; label: string }[] = [
    { id: "solid", label: t("reels.scrim_solid") },
    { id: "gradientBottom", label: t("reels.scrim_gradient_bottom") },
    { id: "gradientEdges", label: t("reels.scrim_gradient_edges") },
    { id: "vignette", label: t("reels.scrim_vignette") },
  ];

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="grid grid-cols-2 gap-2.5">
        {STYLE_ORDER.map((id) => {
          const style = STYLES[id];
          const active = id === styleId;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onStyle(id)}
              className={cn(
                "text-left rounded-xl border p-3 transition-all active:scale-95",
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "block text-xs font-heading font-bold uppercase tracking-wider",
                  active ? "text-primary" : "text-foreground/80",
                )}
              >
                {style.name[lang]}
              </span>
              <span className="block mt-1 text-[10px] leading-snug text-muted-foreground font-body">
                {style.description[lang]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="h-px bg-border" />

      {/* Personalização */}
      <div className="space-y-5">
        <div className="space-y-2">
          <FieldLabel>{t("reels.custom_font")}</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FONT_FAMILIES) as FontId[]).map((id) => (
              <Chip key={id} active={id === font} onClick={() => onOverrides({ font: id })}>
                {FONT_FAMILIES[id].label}
              </Chip>
            ))}
          </div>
        </div>

        <Slider
          label={t("reels.custom_size")}
          value={fontScale}
          min={0.7}
          max={1.4}
          step={0.05}
          onChange={(v) => onOverrides({ fontScale: v })}
          display={`${Math.round(fontScale * 100)}%`}
        />

        <div className="space-y-2">
          <FieldLabel>{t("reels.custom_position")}</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {anchors.map((option) => (
              <Chip
                key={option.id}
                active={option.id === anchor}
                onClick={() => onOverrides({ anchor: option.id })}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel>{t("reels.custom_align")}</FieldLabel>
          <div className="flex flex-wrap gap-2">
            <Chip active={align === "center"} onClick={() => onOverrides({ align: "center" })}>
              {t("reels.align_center")}
            </Chip>
            <Chip active={align === "left"} onClick={() => onOverrides({ align: "left" })}>
              {t("reels.align_left")}
            </Chip>
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel>{t("reels.custom_color")}</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {TEXT_COLORS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onOverrides({ color: value })}
                aria-label={value}
                className={cn(
                  "w-7 h-7 rounded-lg border-2 transition-all active:scale-90",
                  color.toUpperCase() === value ? "border-primary scale-110" : "border-border",
                )}
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel>{t("reels.custom_scrim")}</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {scrims.map((option) => (
              <Chip
                key={option.id}
                active={option.id === scrimKind}
                onClick={() => onOverrides({ scrimKind: option.id })}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        <Slider
          label={t("reels.custom_scrim_intensity")}
          value={scrimIntensity}
          min={0}
          max={1}
          step={0.02}
          onChange={(v) => onOverrides({ scrimIntensity: v })}
          display={`${Math.round(scrimIntensity * 100)}%`}
        />

        <Slider
          label={t("reels.custom_duration")}
          value={durationSec}
          min={8}
          max={30}
          step={1}
          onChange={onDuration}
          display={`${durationSec}s`}
        />

        <div className="space-y-3 pt-1">
          <Toggle
            checked={showReference}
            onChange={(v) => onOverrides({ showReference: v })}
            label={t("reels.custom_show_reference")}
          />
          <Toggle
            checked={showBranding}
            onChange={(v) => onOverrides({ showBranding: v })}
            label={t("reels.custom_show_branding")}
          />
        </div>

        {/* Editáveis porque "Bíblia Online" não faz sentido num Reel de frase
            motivacional. O endereço vai no topo, na cor da marca. */}
        {showBranding && (
          <div className="space-y-3">
            <label className="block space-y-2">
              <FieldLabel>{t("reels.custom_branding_text")}</FieldLabel>
              <input
                value={brandingText}
                onChange={(e) => onBranding(e.target.value)}
                maxLength={40}
                placeholder={t("reels.custom_branding_placeholder")}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              />
            </label>

            <label className="block space-y-2">
              <FieldLabel>{t("reels.custom_site_text")}</FieldLabel>
              <input
                value={siteText}
                onChange={(e) => onSite(e.target.value)}
                maxLength={40}
                placeholder={t("reels.custom_site_placeholder")}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
