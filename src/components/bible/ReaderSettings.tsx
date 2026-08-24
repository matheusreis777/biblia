import { useTranslation } from "react-i18next";
import { AArrowDown, AArrowUp, RotateCcw, Type } from "lucide-react";
import {
  LEADING_STEPS,
  SIZE_STEPS,
  useReaderSettings,
  type ReadingFont,
} from "@/hooks/useReaderSettings";
import { IconButton } from "@/components/ui/IconButton";
import { Popover } from "@/components/ui/Popover";
import { Segmented } from "@/components/ui/Segmented";
import { Tooltip } from "@/components/ui/Tooltip";

// ─── Preferências de leitura ──────────────────────────────────────────────────
// Tamanho, entrelinha e família. Passos discretos em vez de sliders livres:
// numa página de texto corrido, qualquer valor entre os passos é indistinguível
// e só dá trabalho de acertar.

function Stepper({
  label,
  value,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-1">
        <IconButton
          label={decreaseLabel}
          size="sm"
          variant="subtle"
          disabled={value === 0}
          onClick={() => onChange(value - 1)}
        >
          <AArrowDown size={16} />
        </IconButton>
        {/* Pontinhos: mostram onde se está na escala sem exibir números que não
            significam nada para quem está lendo. */}
        <span className="flex items-center gap-1 px-1.5" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => (
            <span
              key={i}
              className={`h-1 w-1 rounded-full transition-colors ${
                i <= value ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </span>
        <IconButton
          label={increaseLabel}
          size="sm"
          variant="subtle"
          disabled={value === max - 1}
          onClick={() => onChange(value + 1)}
        >
          <AArrowUp size={16} />
        </IconButton>
      </div>
    </div>
  );
}

export function ReaderSettingsPanel() {
  const { t } = useTranslation();
  const { settings, patch, reset, isDefault } = useReaderSettings();

  return (
    <div className="w-full space-y-4">
      <Stepper
        label={t("reader.font_size")}
        value={settings.size}
        max={SIZE_STEPS.length}
        onChange={(size) => patch({ size })}
        decreaseLabel={`${t("reader.font_size")} −`}
        increaseLabel={`${t("reader.font_size")} +`}
      />

      <Stepper
        label={t("reader.line_height")}
        value={settings.leading}
        max={LEADING_STEPS.length}
        onChange={(leading) => patch({ leading })}
        decreaseLabel={`${t("reader.line_height")} −`}
        increaseLabel={`${t("reader.line_height")} +`}
      />

      <div className="space-y-2">
        <span className="font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("reader.font_family")}
        </span>
        <Segmented<ReadingFont>
          label={t("reader.font_family")}
          value={settings.font}
          onChange={(font) => patch({ font })}
          block
          size="sm"
          options={[
            { value: "serif", label: <span className="font-reading">{t("reader.font_serif")}</span> },
            { value: "sans", label: <span className="font-body">{t("reader.font_sans")}</span> },
          ]}
        />
      </div>

      {!isDefault && (
        <button
          type="button"
          onClick={reset}
          className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg font-heading text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw size={12} />
          {t("reader.reset")}
        </button>
      )}
    </div>
  );
}

/** Botão do header que abre o painel. */
export function ReaderSettingsButton() {
  const { t } = useTranslation();

  return (
    <Popover
      label={t("shell.reader_settings")}
      className="w-64 p-4"
      trigger={(props) => (
        <Tooltip content={t("shell.reader_settings")}>
          <IconButton {...props} label={t("shell.reader_settings")}>
            <Type size={18} />
          </IconButton>
        </Tooltip>
      )}
    >
      <ReaderSettingsPanel />
    </Popover>
  );
}
