import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, ExternalLink, Quote as QuoteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES } from "@/reels/themes";
import type { ThemeId } from "@/reels/types";
import { Chip, FieldLabel } from "@/components/ui/Field";
import type { Quote, QuotesState } from "./useQuotes";
import type { Verse } from "./VerseStep";

// ─── Aba "Frase" do passo 1 ───────────────────────────────────────────────────
// Galeria de frases motivacionais filtradas por tema, mais a opção de colar uma
// frase própria.
//
// O tema aqui é o MESMO da página (o que alimenta a busca de vídeo), não um
// filtro separado: mudar por aqui muda o vídeo também. É por isso que os chips
// aparecem duplicados neste passo e no passo 2 — é o mesmo estado, exposto onde
// se precisa dele.

export function QuoteStep({
  quotes,
  theme,
  onThemeChange,
  selected,
  onSelect,
}: {
  quotes: QuotesState;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  selected: Verse | null;
  onSelect: (verse: Verse) => void;
}) {
  const { t, i18n } = useTranslation();
  const lang: "pt" | "en" = i18n.language.startsWith("pt") ? "pt" : "en";
  const [manual, setManual] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");

  const applyManual = () => {
    const text = manual.trim();
    if (!text) return;
    onSelect({ text: text.replace(/\s+/g, " "), reference: manualAuthor.trim() });
  };

  // O provedor devolve frases fora do tema quando o tema pedido tem acervo
  // insuficiente — melhor do que uma galeria vazia. A etiqueta de tema em cada
  // cartão deixa isso explícito, em vez de parecer um filtro quebrado.
  const offTheme = quotes.quotes.filter((q) => !q.themes.includes(theme)).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FieldLabel>{t("reels.quote_filter")}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((item) => (
            <Chip
              key={item.id}
              active={item.id === theme}
              onClick={() => onThemeChange(item.id)}
            >
              {item.label[lang]}
            </Chip>
          ))}
        </div>
      </div>

      {quotes.loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {quotes.error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive font-body">{quotes.error}</p>
        </div>
      )}

      {quotes.quotes.length > 0 && (
        <>
          <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {quotes.quotes.map((quote) => (
              <QuoteRow
                key={quote.id}
                quote={quote}
                theme={theme}
                selected={selected?.text === quote.text}
                onSelect={() => onSelect({ text: quote.text, reference: quote.author })}
              />
            ))}
          </div>

          {offTheme > 0 && (
            <p className="text-[11px] text-muted-foreground font-body leading-snug">
              {t("reels.quote_off_theme", { count: offTheme })}
            </p>
          )}

          <p className="text-[10px] text-muted-foreground font-body">
            {t("reels.quote_credit", { providers: quotes.providers.join(", ") })}
          </p>
        </>
      )}

      {/* Colar frase própria — o caminho para qualquer coisa fora do acervo. */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-heading font-semibold text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
          <QuoteIcon size={12} />
          {t("reels.quote_manual_toggle")}
        </summary>

        <div className="mt-3 space-y-3">
          <textarea
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder={t("reels.quote_manual_placeholder")}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body resize-none"
          />
          <div className="flex gap-2">
            <input
              value={manualAuthor}
              onChange={(e) => setManualAuthor(e.target.value)}
              placeholder={t("reels.quote_manual_author")}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
            <button
              type="button"
              onClick={applyManual}
              disabled={!manual.trim()}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-heading font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-30"
            >
              {t("reels.verse_manual_action")}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}

function QuoteRow({
  quote,
  theme,
  selected,
  onSelect,
}: {
  quote: Quote;
  theme: ThemeId;
  selected: boolean;
  onSelect: () => void;
}) {
  const { i18n } = useTranslation();
  const lang: "pt" | "en" = i18n.language.startsWith("pt") ? "pt" : "en";
  const matches = quote.themes.includes(theme);
  const shown = quote.themes[0];
  const label = THEMES.find((x) => x.id === shown)?.label[lang];

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-3 transition-colors",
        selected ? "bg-primary/10" : "hover:bg-muted/40",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex items-start gap-3 flex-1 min-w-0 text-left"
      >
        <span className="w-4 shrink-0 mt-0.5">
          {selected ? (
            <Check size={13} className="text-primary" />
          ) : (
            <QuoteIcon size={13} className="text-muted-foreground/50" />
          )}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "block text-xs font-body leading-relaxed",
              selected ? "text-primary" : "text-foreground/85",
            )}
          >
            {quote.text}
          </span>
          <span className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground">{quote.author}</span>
            {!matches && label && (
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70 px-1.5 py-0.5 rounded bg-muted/50">
                {label}
              </span>
            )}
          </span>
        </span>
      </button>

      {/* O link do autor é a forma prática de conferir a atribuição antes de
          publicar — frases célebres são muito mal atribuídas. */}
      {quote.sourceUrl && (
        <a
          href={quote.sourceUrl}
          target="_blank"
          rel="noreferrer"
          title={quote.author}
          className="shrink-0 mt-0.5 text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}
