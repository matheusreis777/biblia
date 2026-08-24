import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldLabel } from "@/components/ui/Field";

// ─── Passo 1: o versículo ─────────────────────────────────────────────────────
// Três caminhos, como pedido: versículo do dia, busca por referência, ou texto
// colado à mão. Reaproveita as duas funções serverless que já existem no
// projeto — /api/daily-verse (que até agora nenhuma tela consumia) e
// /api/bible-passage.

export interface Verse {
  text: string;
  reference: string;
}

type Mode = "daily" | "search" | "manual";

// As duas rotas abaixo são as funções serverless que já existiam no projeto.
// O plugin de dev (vite/reelsDevApi.ts) as serve também em `npm run dev`, então
// aqui não há nenhum desvio condicional por ambiente.

async function fetchPassage(ref: string, language: string): Promise<Verse> {
  const translation = language.startsWith("pt") ? "almeida" : "web";
  const res = await fetch(
    `/api/bible-passage?ref=${encodeURIComponent(ref)}&translation=${translation}`,
  );
  if (!res.ok) throw new Error("not-found");
  const data = await res.json();
  if (!data?.text) throw new Error("not-found");
  return { text: String(data.text).replace(/\s+/g, " ").trim(), reference: data.reference };
}

/** O versículo do dia vem sempre em português — /api/daily-verse fixa "almeida". */
async function fetchDailyVerse(): Promise<Verse> {
  const res = await fetch("/api/daily-verse");
  if (!res.ok) throw new Error("daily-failed");
  const data = await res.json();
  if (!data?.text) throw new Error("daily-failed");
  return { text: String(data.text).replace(/\s+/g, " ").trim(), reference: data.reference };
}

export function VerseStep({
  verse,
  onChange,
}: {
  verse: Verse | null;
  onChange: (verse: Verse | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<Mode>("daily");
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState("");
  const [manualRef, setManualRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDaily = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      onChange(await fetchDailyVerse());
    } catch {
      setError(t("reels.verse_daily_error"));
    } finally {
      setLoading(false);
    }
  }, [onChange, t]);

  // Carrega o versículo do dia na abertura da página, para a tela já nascer
  // com algo utilizável em vez de um formulário vazio.
  //
  // Só quando não há conteúdo ainda: este passo é desmontado ao trocar para a
  // aba Frase, e sem esta guarda o retorno para cá sobrescreveria a frase que o
  // usuário tinha acabado de escolher.
  const bootstrapped = useRef(false);
  const startedWithContent = useRef(verse !== null);

  useEffect(() => {
    if (bootstrapped.current || startedWithContent.current) return;
    bootstrapped.current = true;
    void loadDaily();
  }, [loadDaily]);

  const search = async () => {
    const ref = query.trim();
    if (!ref) return;
    setLoading(true);
    setError(null);
    try {
      onChange(await fetchPassage(ref, i18n.language));
    } catch {
      setError(t("reels.verse_search_error"));
    } finally {
      setLoading(false);
    }
  };

  const applyManual = () => {
    const text = manual.trim();
    if (!text) return;
    onChange({ text: text.replace(/\s+/g, " "), reference: manualRef.trim() });
    setError(null);
  };

  const tabs: { id: Mode; label: string }[] = [
    { id: "daily", label: t("reels.verse_mode_daily") },
    { id: "search", label: t("reels.verse_mode_search") },
    { id: "manual", label: t("reels.verse_mode_manual") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all",
              mode === tab.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "daily" && (
        <button
          type="button"
          onClick={loadDaily}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin text-primary" />
          ) : (
            <Sparkles size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span className="text-xs font-heading font-semibold text-foreground/80 uppercase tracking-wider">
            {t("reels.verse_reload_daily")}
          </span>
        </button>
      )}

      {mode === "search" && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder={t("reels.verse_search_placeholder")}
              className="w-full bg-background border border-border rounded-xl pl-11 pr-24 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
            />
            <button
              type="button"
              onClick={search}
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-heading font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-30"
            >
              {loading ? "…" : t("reels.verse_search_action")}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground font-body">
            {t("reels.verse_search_hint")}
          </p>
        </div>
      )}

      {mode === "manual" && (
        <div className="space-y-3">
          <label className="block space-y-2">
            <FieldLabel>{t("reels.verse_manual_text")}</FieldLabel>
            <textarea
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder={t("reels.verse_manual_placeholder")}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body resize-none"
            />
          </label>
          <div className="flex gap-2">
            <input
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              placeholder={t("reels.verse_manual_reference")}
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
          <p className="text-[11px] text-muted-foreground font-body tabular-nums">
            {manual.length}/600
          </p>
        </div>
      )}

      {error && <p className="text-xs text-destructive font-body">{error}</p>}

      {verse && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm text-foreground/90 font-body leading-relaxed">{verse.text}</p>
          {verse.reference && (
            <p className="mt-2 text-[10px] uppercase tracking-widest text-primary font-heading font-semibold">
              {verse.reference}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
