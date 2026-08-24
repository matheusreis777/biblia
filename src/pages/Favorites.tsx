import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Film,
  Layers,
  Search,
  Share2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import type { MenuLink } from "@/components/layout/MobileMenu";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { useFavorites, type DecoratedFavorite } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

// ─── Página de favoritos ──────────────────────────────────────────────────────
// Antes o único vestígio de favoritos era a CONTAGEM no menu da conta — dava
// para guardar versículos e não havia onde revê-los. Esta rota é o outro lado
// disso: buscar, reler, compartilhar e remover.
//
// A faixa "Coleções" fica visível e desabilitada de propósito: prepara o lugar
// da funcionalidade sem fingir que ela já existe.

function FavoriteCard({
  favorite,
  onRemove,
}: {
  favorite: DecoratedFavorite;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const payload = favorite.text ? `“${favorite.text}”\n${favorite.reference}` : favorite.reference;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
    } catch {
      /* clipboard negado: a seleção manual ainda funciona */
    }
  }, [payload]);

  const share = useCallback(async () => {
    const url = `${window.location.origin}${favorite.path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: favorite.reference, text: payload, url });
      } catch {
        /* cancelado pela pessoa */
      }
      return;
    }
    await copy();
  }, [favorite.path, favorite.reference, payload, copy]);

  return (
    <article className="group rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/15 sm:p-5">
      <Link
        to={favorite.path}
        className="block rounded-lg focus-visible:outline-none"
        aria-label={favorite.reference}
      >
        <p className="font-heading text-sm font-semibold text-primary">{favorite.reference}</p>
        {favorite.text ? (
          <p className="mt-2 font-[family-name:var(--reading-family)] text-[0.95rem] leading-relaxed text-foreground/90">
            {favorite.text}
          </p>
        ) : (
          // Registros antigos foram gravados sem o texto do versículo.
          <p className="mt-2 font-body text-sm italic text-muted-foreground">
            {t("common.open")}
          </p>
        )}
      </Link>

      <div className="mt-3 flex items-center gap-1 border-t border-border/70 pt-2">
        <IconButton label={t("common.open")} size="sm" onClick={() => navigate(favorite.path)}>
          <BookOpen size={15} />
        </IconButton>
        <IconButton
          label={copied ? t("verse.copied") : t("verse.copy")}
          size="sm"
          onClick={copy}
          className={copied ? "text-primary" : undefined}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </IconButton>
        <IconButton label={t("verse.share")} size="sm" onClick={share}>
          <Share2 size={15} />
        </IconButton>
        {favorite.text && (
          <IconButton
            label={t("verse.create_reel")}
            size="sm"
            onClick={() =>
              navigate(
                `/reels?${new URLSearchParams({
                  ref: favorite.reference,
                  text: favorite.text ?? "",
                })}`,
              )
            }
          >
            <Film size={15} />
          </IconButton>
        )}
        <IconButton
          label={t("favorites.remove")}
          size="sm"
          onClick={onRemove}
          className="ml-auto hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={15} />
        </IconButton>
      </div>
    </article>
  );
}

export default function FavoritesPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const { groups, total, filtered, remove } = useFavorites(query);

  const links: MenuLink[] = [{ to: "/reels", label: t("bible.reels_link"), icon: Film }];

  return (
    <AppShell
      header={
        <AppHeader
          containerClassName="max-w-3xl"
          nav={
            <span className="font-heading text-sm font-semibold text-muted-foreground">
              {t("favorites.title")}
            </span>
          }
          mobileTitle={t("favorites.title")}
          mobileLead={
            <Link
              to="/"
              aria-label={t("common.back")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </Link>
          }
          links={links}
        />
      }
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("favorites.title")}
          </h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            {total > 0 ? t("auth.favorites_count", { count: total }) : t("favorites.subtitle")}
          </p>
        </header>

        {total > 0 && (
          <>
            <div className="relative mb-6">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("favorites.search_placeholder")}
                aria-label={t("favorites.search_placeholder")}
                className="min-h-12 w-full rounded-xl border border-input bg-card pl-10 pr-11 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {query && (
                <IconButton
                  label={t("common.close")}
                  size="sm"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2"
                >
                  <X size={15} />
                </IconButton>
              )}
            </div>

            {/* Estrutura pronta para as coleções, sem prometer o que não há. */}
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
              <Layers size={16} className="shrink-0 text-muted-foreground" />
              <p className="min-w-0 flex-1 font-body text-xs leading-relaxed text-muted-foreground">
                <span className="font-heading font-semibold text-foreground/70">
                  {t("favorites.collections")}
                </span>
                <span className="mx-1.5 text-border">·</span>
                {t("favorites.collections_soon")}
              </p>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-heading text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("common.soon")}
              </span>
            </div>
          </>
        )}

        {total === 0 && (
          <EmptyState
            icon={Star}
            title={t("favorites.empty_title")}
            description={t("favorites.empty_description")}
            action={
              <Link to="/" className={buttonClasses("primary", "md")}>
                {t("favorites.empty_action")}
              </Link>
            }
          />
        )}

        {total > 0 && filtered.length === 0 && (
          <EmptyState icon={Search} title={t("favorites.no_results")} />
        )}

        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.id}>
              <h2
                className={cn(
                  "mb-3 font-heading text-[10px] font-semibold uppercase tracking-[0.2em]",
                  "text-muted-foreground",
                )}
              >
                {t(group.labelKey)}
              </h2>
              <div className="space-y-3">
                {group.items.map((favorite) => (
                  <FavoriteCard
                    key={`${favorite.bookId}:${favorite.chapter}:${favorite.verse}`}
                    favorite={favorite}
                    onRemove={() =>
                      remove({
                        bookId: favorite.bookId,
                        chapter: favorite.chapter,
                        verse: favorite.verse,
                        text: favorite.text,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
