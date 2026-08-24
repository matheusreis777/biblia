import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { AccountButton } from "@/auth/AccountButton";
import { useAuth } from "@/auth/AuthContext";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Sheet } from "@/components/ui/Sheet";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// ─── Menu mobile ──────────────────────────────────────────────────────────────
// O bottom sheet que substitui os 7 ícones espremidos no topo. Cada linha tem
// 48px de altura — nada aqui depende de mira fina.
//
// Tema e idioma entram como controles inteiros, não como linhas que abrem outro
// nível: são duas escolhas curtas, e um segundo nível de navegação para trocar
// de tema seria cerimônia demais.

export interface MenuLink {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Contagem à direita (ex.: número de favoritos). */
  badge?: number;
}

function MenuRow({
  to,
  label,
  icon: Icon,
  badge,
  onClick,
}: MenuLink & { onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm text-foreground transition-colors hover:bg-accent active:bg-accent"
    >
      <Icon size={18} className="shrink-0 text-muted-foreground" />
      <span className="flex-1 font-body">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-secondary px-2 py-0.5 font-heading text-[11px] font-semibold tabular-nums text-muted-foreground">
          {badge}
        </span>
      )}
      <ChevronRight size={16} className="shrink-0 text-muted-foreground/60" />
    </Link>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="px-3 py-3">
      <p className="mb-2 px-1 font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </section>
  );
}

export function MobileMenu({
  open,
  onClose,
  links = [],
  children,
}: {
  open: boolean;
  onClose: () => void;
  links?: MenuLink[];
  /** Seções extras da página (ex.: preferências de leitura). */
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const { enabled: authEnabled } = useAuth();

  return (
    <Sheet open={open} onClose={onClose} side="bottom" title={t("shell.menu_title")}>
      {links.length > 0 && (
        <nav className="space-y-0.5 px-3 py-3">
          {links.map((link) => (
            <MenuRow key={link.to} {...link} onClick={onClose} />
          ))}
        </nav>
      )}

      {children}

      <div className="border-t border-border">
        <Section label={t("theme.label")}>
          <ThemeToggle block />
        </Section>
      </div>

      <div className="border-t border-border">
        <Section label={t("language.label")}>
          <LanguageToggle block />
        </Section>
      </div>

      {/* Sem Supabase configurado o AccountButton devolve null, e sem esta
          guarda sobrava um divisor com espaço em branco embaixo do menu. */}
      {authEnabled && (
        <div className="border-t border-border px-3 py-3">
          <AccountButton variant="inline" onNavigate={onClose} />
        </div>
      )}
    </Sheet>
  );
}
