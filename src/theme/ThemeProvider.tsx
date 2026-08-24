import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  THEME_STORAGE_KEY,
  ThemeContext,
  type ResolvedTheme,
  type ThemeMode,
} from "./ThemeContext";

// ─── Tema claro / escuro / sistema ────────────────────────────────────────────
// O primeiro `.dark` no <html> já foi posto pelo script inline do index.html,
// antes da pintura. Este provider assume dali em diante: guarda a escolha,
// acompanha o sistema quando o modo é `system` e anima a troca.
//
// `resolved` é DERIVADO de (modo × preferência do sistema), não sincronizado
// por efeito. O único estado que um efeito escreve é `systemDark`, e só em
// resposta ao evento do matchMedia — que é exatamente o papel de um efeito:
// assinar um sistema externo.
//
// A preferência é local (localStorage). A tabela `profiles` do Supabase só tem
// coluna para idioma; sincronizar o tema exigiria migração e não vale a pena —
// tema é preferência de dispositivo, não de conta.

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Cor da barra do navegador em cada tema, casada com `--background`. */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: "#faf9f5",
  dark: "#0d0d0d",
};

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  const resolved: ResolvedTheme =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  // Só anima trocas provocadas por quem está usando. Na primeira aplicação a
  // classe de transição faria a página inteira desbotar para dentro do tema em
  // que ela já nasceu.
  const firstApply = useRef(true);

  // Assina a preferência do sistema. Continua ativo mesmo com o modo fixo: se a
  // pessoa voltar para "sistema", o valor já está correto.
  useEffect(() => {
    const media = window.matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  // Espelha o tema resolvido no DOM.
  useEffect(() => {
    const root = document.documentElement;
    let timer: number | undefined;

    if (firstApply.current) {
      firstApply.current = false;
    } else {
      root.classList.add("theme-transition");
      timer = window.setTimeout(() => root.classList.remove("theme-transition"), 200);
    }

    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLOR[resolved]);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* modo privado: a escolha vale só para esta sessão */
    }
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
