import { useTranslation } from "react-i18next";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeMode } from "@/theme/ThemeContext";
import { IconButton } from "./IconButton";
import { Popover } from "./Popover";
import { Segmented } from "./Segmented";
import { Tooltip } from "./Tooltip";

// ─── Alternância de tema ──────────────────────────────────────────────────────
// Três estados de verdade, não um interruptor: "sistema" é uma escolha, não a
// ausência de uma. Um toggle de dois estados obrigaria quem prefere seguir o SO
// a fixar um dos lados.

const ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

/** O controle em si. Usado solto no menu mobile e dentro do popover no desktop. */
export function ThemeToggle({ block = false }: { block?: boolean }) {
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();

  return (
    <Segmented<ThemeMode>
      label={t("theme.label")}
      value={mode}
      onChange={setMode}
      block={block}
      options={[
        { value: "light", label: <><Sun size={14} /> {t("theme.light")}</> },
        { value: "dark", label: <><Moon size={14} /> {t("theme.dark")}</> },
        { value: "system", label: <><Monitor size={14} /> {t("theme.system")}</> },
      ]}
    />
  );
}

/** Botão de ícone do header, abrindo o controle acima. */
export function ThemeMenuButton() {
  const { t } = useTranslation();
  const { mode } = useTheme();
  const Icon = ICONS[mode];

  return (
    <Popover
      label={t("theme.label")}
      className="w-max p-3"
      trigger={(props) => (
        <Tooltip content={t("theme.label")}>
          <IconButton {...props} label={t("theme.toggle")}>
            <Icon size={18} />
          </IconButton>
        </Tooltip>
      )}
    >
      <p className="mb-2 px-0.5 font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t("theme.label")}
      </p>
      <ThemeToggle />
    </Popover>
  );
}
