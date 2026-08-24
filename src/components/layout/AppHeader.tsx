import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MoreHorizontal, Search } from "lucide-react";
import { AccountButton } from "@/auth/AccountButton";
import { IconButton } from "@/components/ui/IconButton";
import { LanguageMenuButton } from "@/components/ui/LanguageToggle";
import { ThemeMenuButton } from "@/components/ui/ThemeToggle";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";
import { MobileMenu, type MenuLink } from "./MobileMenu";

// ─── Header ───────────────────────────────────────────────────────────────────
// Um header para as duas páginas, com dois desenhos que não são o mesmo
// comprimido:
//
//   Desktop  [marca] │ [navegação contextual]   [busca]   │ [links] [tema] [idioma] [conta]
//   Mobile   [☰]              João 3                              [⌕] [•••]
//
// O divisor de 1px entre os grupos é o que separa "onde estou lendo" de "o que
// posso fazer" — no header antigo os sete controles eram uma fileira só.
//
// O botão de voltar ao site saiu daqui de vez: virou crédito no rodapé.

export interface AppHeaderProps {
  /** Largura do miolo: leitor usa max-w-5xl, estúdio max-w-6xl. */
  containerClassName?: string;
  /** Navegação contextual no desktop (seletor de livro e capítulo). */
  nav?: ReactNode;
  /** Controle à esquerda no mobile — o gatilho de livros, ou um "voltar". */
  mobileLead?: ReactNode;
  /** Rótulo central no mobile: a referência atual ou o título da página. */
  mobileTitle?: string;
  /** Abre a busca global. Omitido, a busca não aparece. */
  onOpenSearch?: () => void;
  /** Links que viram ícones no desktop e linhas no menu mobile. */
  links?: MenuLink[];
  /** Ações da página, à esquerda das ações padrão (desktop). */
  actions?: ReactNode;
  /** Seções extras do menu mobile (ex.: preferências de leitura). */
  menuExtra?: ReactNode;
  /** Faixa abaixo da barra, na largura total (ex.: barra de ações do versículo). */
  below?: ReactNode;
}

function Divider() {
  return <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border" />;
}

export function AppHeader({
  containerClassName = "max-w-5xl",
  nav,
  mobileLead,
  mobileTitle,
  onOpenSearch,
  links = [],
  actions,
  menuExtra,
  below,
}: AppHeaderProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div
          className={cn(
            "mx-auto flex h-14 items-center gap-1 px-2 sm:h-16 sm:gap-2 sm:px-4",
            containerClassName,
          )}
        >
          {/* ── Mobile ───────────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-1 items-center gap-1 md:hidden">
            {mobileLead}
            <span className="min-w-0 flex-1 truncate px-1 text-center font-heading text-sm font-semibold tracking-tight">
              {mobileTitle}
            </span>
            {onOpenSearch && (
              <IconButton label={t("search.open")} onClick={onOpenSearch}>
                <Search size={19} />
              </IconButton>
            )}
            <IconButton label={t("shell.menu")} onClick={() => setMenuOpen(true)}>
              <MoreHorizontal size={20} />
            </IconButton>
          </div>

          {/* ── Desktop: marca + navegação bíblica ───────────────────── */}
          <div className="hidden min-w-0 items-center gap-3 md:flex">
            <Link
              to="/"
              className="shrink-0 rounded-lg font-heading text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
            >
              {t("shell.brand")}
            </Link>
            {nav && (
              <>
                <Divider />
                {nav}
              </>
            )}
          </div>

          {/* ── Desktop: busca ───────────────────────────────────────── */}
          {onOpenSearch && (
            <div className="hidden flex-1 justify-center px-2 md:flex">
              <button
                type="button"
                onClick={onOpenSearch}
                className="group flex h-10 w-full max-w-xs items-center gap-2.5 rounded-xl border border-border bg-secondary/60 px-3 text-left transition-colors hover:border-foreground/20 hover:bg-secondary"
              >
                <Search size={15} className="shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-body text-xs text-muted-foreground">
                  {t("common.search")}
                </span>
                <kbd className="hidden shrink-0 rounded border border-border bg-card px-1.5 py-0.5 font-heading text-[10px] font-semibold text-muted-foreground lg:block">
                  ⌘K
                </kbd>
              </button>
            </div>
          )}

          {/* ── Desktop: ações ───────────────────────────────────────── */}
          <div className={cn("hidden items-center gap-0.5 md:flex", !onOpenSearch && "ml-auto")}>
            {actions}
            {links.map(({ to, label, icon: Icon }) => (
              <Tooltip key={to} content={label}>
                <Link
                  to={to}
                  aria-label={label}
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon size={18} />
                </Link>
              </Tooltip>
            ))}
            <Divider />
            <ThemeMenuButton />
            <LanguageMenuButton />
            <AccountButton />
          </div>
        </div>

        {below}
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} links={links}>
        {menuExtra}
      </MobileMenu>
    </>
  );
}
