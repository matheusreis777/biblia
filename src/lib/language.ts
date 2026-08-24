// ─── Idioma da interface ──────────────────────────────────────────────────────
// O i18next pode devolver "pt", "pt-BR", "en", "en-US" ou um regional que o
// detector inventou a partir do navegador. Tudo isso colapsa nos dois idiomas
// que o app realmente tem.
//
// A escolha não é só de rótulos: decide a tradução bíblica (almeida × web), o
// nome dos livros e as vozes da narração.

export type AppLanguage = "pt-BR" | "en-US";

export function currentLanguage(raw: string): AppLanguage {
  return raw.startsWith("pt") ? "pt-BR" : "en-US";
}
