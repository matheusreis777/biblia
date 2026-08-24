import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Check, Copy, Film, Share2, Star } from "lucide-react";
import { bookName, type BibleBook } from "@/data/bibleBooks";
import { cn } from "@/lib/utils";

// ─── Barra de ações do versículo ──────────────────────────────────────────────
// Aparece ao selecionar um versículo, com clique, toque OU teclado — nenhuma
// destas ações depende de hover.
//
// Compartilhar tenta a Web Share API (que em celular abre a folha nativa) e
// cai para a área de transferência quando o navegador não a tem, em vez de
// sumir do menu em desktop.

interface VerseActionsProps {
  book: BibleBook;
  chapter: number;
  verse: number;
  text: string;
  favorited: boolean;
  onToggleFavorite: () => void;
  className?: string;
}

export function VerseActions({
  book,
  chapter,
  verse,
  text,
  favorited,
  onToggleFavorite,
  className,
}: VerseActionsProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const reference = `${bookName(book, i18n.language)} ${chapter}:${verse}`;
  const payload = `“${text}”\n${reference}`;

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
      /* clipboard negado (http, permissão): a seleção manual ainda funciona */
    }
  }, [payload]);

  const share = useCallback(async () => {
    const url = `${window.location.origin}/${encodeURIComponent(book.id)}/${chapter}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: reference, text: payload, url });
        return;
      } catch {
        // Cancelar a folha de compartilhamento cai aqui; não é erro, e copiar
        // por cima seria surpresa. Só segue para o fallback se não houve API.
        return;
      }
    }
    await copy();
  }, [book.id, chapter, reference, payload, copy]);

  const createReel = useCallback(() => {
    const params = new URLSearchParams({ ref: reference, text });
    navigate(`/reels?${params.toString()}`);
  }, [navigate, reference, text]);

  return (
    <div
      role="group"
      aria-label={t("verse.actions")}
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-lift",
        className,
      )}
    >
      <ActionButton
        onClick={onToggleFavorite}
        active={favorited}
        icon={<Star size={15} fill={favorited ? "currentColor" : "none"} />}
        label={favorited ? t("bible.unfavorite") : t("bible.favorite")}
      />
      <ActionButton
        onClick={copy}
        active={copied}
        icon={copied ? <Check size={15} /> : <Copy size={15} />}
        label={copied ? t("verse.copied") : t("verse.copy")}
      />
      <ActionButton onClick={share} icon={<Share2 size={15} />} label={t("verse.share")} />
      <ActionButton onClick={createReel} icon={<Film size={15} />} label={t("verse.create_reel")} />
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  active,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5",
        "font-heading text-xs font-semibold transition-colors active:scale-95",
        active
          ? "text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {icon}
      {/* O rótulo some no muito estreito, mas o botão continua nomeado. */}
      <span className="hidden xs:inline">{label}</span>
      <span className="sr-only xs:hidden">{label}</span>
    </button>
  );
}
