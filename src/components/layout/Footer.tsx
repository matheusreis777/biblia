import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// ─── Rodapé ───────────────────────────────────────────────────────────────────
// É aqui que o link para matheusreis.dev vive agora. Ele saiu do header, onde
// era o primeiro controle da barra e disputava atenção com a navegação bíblica
// — crédito de autoria não é CTA.

export function Footer({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <footer className={cn("border-t border-border/70 px-4 py-10", className)}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <div>
          <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
            {t("shell.brand")}
          </p>
          <p className="mt-1.5 font-body text-xs leading-relaxed text-muted-foreground">
            {t("shell.footer_tagline")}
          </p>
        </div>

        <span className="h-px w-16 bg-border" aria-hidden="true" />

        <p className="font-body text-[11px] text-muted-foreground">
          {t("shell.footer_credit")}{" "}
          <a
            href="https://www.matheusreis.dev/"
            target="_blank"
            rel="noreferrer"
            className="rounded-sm font-medium text-foreground/70 underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            {t("shell.footer_author")}
          </a>
        </p>
      </div>
    </footer>
  );
}
