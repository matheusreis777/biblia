import { useCallback, useEffect, useMemo, useState } from "react";

// ─── Preferências de leitura ──────────────────────────────────────────────────
// Tamanho, entrelinha e família do texto bíblico. Aplicadas como variáveis CSS
// no <html> em vez de classes: o texto do versículo lê `var(--reading-size)`
// direto, então nenhum componente precisa saber que a preferência existe.

const STORAGE_KEY = "biblia.reader";

export type ReadingFont = "serif" | "sans";

export interface ReaderSettings {
  /** Índice na escala de tamanhos. */
  size: number;
  /** Índice na escala de entrelinhas. */
  leading: number;
  font: ReadingFont;
}

/** Em rem. O padrão (índice 2) é 17px, o tamanho que o leitor já usava. */
export const SIZE_STEPS = [0.9375, 1, 1.0625, 1.1875, 1.3125] as const;
export const LEADING_STEPS = [1.6, 1.75, 1.9, 2.05] as const;

export const DEFAULT_SETTINGS: ReaderSettings = { size: 2, leading: 1, font: "serif" };

const FONT_STACKS: Record<ReadingFont, string> = {
  serif: '"Source Serif 4", Georgia, serif',
  sans: '"Inter", system-ui, sans-serif',
};

function clampIndex(value: unknown, length: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value < length
    ? value
    : fallback;
}

function read(): ReaderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
    return {
      size: clampIndex(parsed.size, SIZE_STEPS.length, DEFAULT_SETTINGS.size),
      leading: clampIndex(parsed.leading, LEADING_STEPS.length, DEFAULT_SETTINGS.leading),
      font: parsed.font === "sans" ? "sans" : "serif",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(read);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--reading-size", `${SIZE_STEPS[settings.size]}rem`);
    root.style.setProperty("--reading-leading", String(LEADING_STEPS[settings.leading]));
    root.style.setProperty("--reading-family", FONT_STACKS[settings.font]);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* modo privado: vale só para esta sessão */
    }
  }, [settings]);

  const patch = useCallback((next: Partial<ReaderSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_SETTINGS), []);

  const isDefault = useMemo(
    () =>
      settings.size === DEFAULT_SETTINGS.size &&
      settings.leading === DEFAULT_SETTINGS.leading &&
      settings.font === DEFAULT_SETTINGS.font,
    [settings],
  );

  return { settings, patch, reset, isDefault };
}
