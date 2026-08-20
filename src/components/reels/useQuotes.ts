import { useEffect, useState } from "react";
import type { ThemeId } from "@/reels/types";

// ─── Frases ───────────────────────────────────────────────────────────────────
// Consome /api/reels/quotes, que esconde a cadeia de provedores
// (espelho do Quotable em inglês → biblioteca curada) e traduz as tags de
// origem para os temas do projeto.

export interface Quote {
  id: string;
  text: string;
  author: string;
  themes: ThemeId[];
  language: string;
  /** Página do autor, quando o provedor oferece — serve para conferir a autoria. */
  sourceUrl: string | null;
  providerId: string;
}

export interface QuotesState {
  quotes: Quote[];
  providers: string[];
  loading: boolean;
  error: string | null;
}

/** Resultado carregado, junto da consulta a que ele pertence. */
interface Loaded {
  key: string;
  quotes: Quote[];
  providers: string[];
  error: string | null;
}

export function useQuotes(theme: ThemeId, language: string, enabled: boolean): QuotesState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const key = `${theme}|${language}`;

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    const [currentTheme, currentLanguage] = key.split("|");

    fetch(
      `/api/reels/quotes?theme=${currentTheme}&language=${currentLanguage}&limit=12`,
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        return data;
      })
      .then((data) => {
        if (!active) return;
        setLoaded({
          key,
          quotes: data.quotes ?? [],
          providers: data.providers ?? [],
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoaded({
          key,
          quotes: [],
          providers: [],
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      active = false;
    };
  }, [key, enabled]);

  // `loading` é derivado: marcá-lo dentro do efeito exigiria um setState
  // síncrono ali, que dispara renderização em cascata.
  const current = enabled && loaded?.key === key ? loaded : null;

  return {
    quotes: current?.quotes ?? [],
    providers: current?.providers ?? [],
    loading: enabled && current === null,
    error: current?.error ?? null,
  };
}
