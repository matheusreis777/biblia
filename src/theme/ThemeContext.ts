import { createContext, useContext } from "react";

/** O que o usuário escolheu. `system` acompanha o sistema operacional. */
export type ThemeMode = "light" | "dark" | "system";

/** O que está de fato aplicado — `system` já resolvido. */
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "biblia.theme";

export interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme precisa estar dentro de <ThemeProvider>");
  return ctx;
}
