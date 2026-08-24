import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentLanguage } from "@/i18n/useDocumentLanguage";
import { cn } from "@/lib/utils";
import { Footer } from "./Footer";

// ─── Casca das páginas ────────────────────────────────────────────────────────
// Header, conteúdo e rodapé com a mesma estrutura nas duas páginas.
//
// `min-h-svh` e não `min-h-screen`: em mobile, `100vh` inclui a barra do
// navegador que se retrai ao rolar, e o rodapé ficava sempre um pouco abaixo
// do fim visível.

export function AppShell({
  header,
  children,
  footer = true,
  /** Espaço extra no fim do conteúdo, para barras fixas não cobrirem o rodapé. */
  contentClassName,
  className,
}: {
  header: ReactNode;
  children: ReactNode;
  footer?: boolean;
  contentClassName?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  // Toda página passa por aqui, então é o lugar de manter o <html lang> em dia.
  useDocumentLanguage();

  return (
    <div className={cn("flex min-h-svh flex-col bg-background text-foreground", className)}>
      {/* Primeiro alvo do Tab: pula os controles do topo direto para a leitura. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-heading focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        {t("shell.skip_to_content")}
      </a>

      {header}

      <main id="conteudo" className={cn("flex-1", contentClassName)}>
        {children}
      </main>

      {footer && <Footer />}
    </div>
  );
}
