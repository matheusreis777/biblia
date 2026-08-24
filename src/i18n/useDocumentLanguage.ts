import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { currentLanguage } from "@/lib/language";

// ─── <html lang> ──────────────────────────────────────────────────────────────
// Ficava fixo no index.html enquanto a interface trocava de idioma por baixo.
// O atributo é o que leitores de tela usam para escolher a pronúncia e o que
// o navegador usa para hifenização — errado, ele lê português com fonética
// inglesa.

export function useDocumentLanguage(): void {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = currentLanguage(i18n.language);
  }, [i18n.language]);
}
