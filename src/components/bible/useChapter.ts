import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ─── Carregamento do capítulo ─────────────────────────────────────────────────
// Estava solto dentro de Index.tsx. Além de extraído, resolveu uma corrida: com
// três setStates soltos, virar dois capítulos rápido deixava a resposta do
// primeiro chegar depois e sobrescrever o segundo — o texto na tela não batia
// com a URL.
//
// A correção é o resultado carregar A QUAL pedido ele pertence. `loading`,
// `passage` e `error` são DERIVADOS dessa comparação, então uma resposta velha
// simplesmente não casa e é ignorada; e o efeito não precisa chamar setState
// no corpo para anunciar que começou a carregar.

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface PassageResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
}

/** `pt` usa a Almeida; o resto, a World English Bible. */
export function translationFor(language: string): string {
  return language.startsWith("pt") ? "almeida" : "web";
}

async function fetchChapter(
  bookId: string,
  chapter: number,
  language: string,
  signal: AbortSignal,
): Promise<PassageResponse> {
  const translation = translationFor(language);
  // Em dev não há função serverless; em produção a rota própria adiciona cache
  // de borda (s-maxage=7d) e esconde a origem.
  const url = import.meta.env.DEV
    ? `https://bible-api.com/${`${bookId} ${chapter}`.toLowerCase().replace(/\s+/g, "+")}?translation=${translation}`
    : `/api/bible-passage?ref=${encodeURIComponent(`${bookId} ${chapter}`)}&translation=${translation}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`bible-api respondeu ${res.status}`);
  return res.json();
}

interface Result {
  /** Pedido a que este resultado pertence. */
  key: string;
  passage: PassageResponse | null;
  error: string | null;
}

export interface ChapterState {
  passage: PassageResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useChapter(bookId: string, chapter: number, language: string): ChapterState {
  const { t } = useTranslation();
  const [result, setResult] = useState<Result | null>(null);

  // `attempt` entra na chave para o botão "tentar de novo" refazer o pedido
  // sem que livro, capítulo ou idioma tenham mudado.
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const key = `${bookId}|${chapter}|${language}|${attempt}`;

  // A mensagem de erro é traduzida, mas `t` muda de identidade a cada troca de
  // idioma; guardá-la em ref impede que isso conte como motivo para refazer a
  // requisição (o idioma já está na chave por conta própria).
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    const controller = new AbortController();

    fetchChapter(bookId, chapter, language, controller.signal)
      .then((passage) => setResult({ key, passage, error: null }))
      .catch((err: unknown) => {
        // Abort é troca de capítulo, não falha: o próximo efeito já assumiu.
        if (controller.signal.aborted) return;
        console.error("Falha ao carregar o capítulo", err);
        setResult({ key, passage: null, error: tRef.current("bible.load_error") });
      });

    return () => controller.abort();
  }, [key, bookId, chapter, language]);

  const current = result?.key === key ? result : null;

  return {
    passage: current?.passage ?? null,
    loading: current === null,
    error: current?.error ?? null,
    reload,
  };
}
