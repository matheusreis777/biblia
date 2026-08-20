import { useTranslation } from "react-i18next";
import { BookOpen, Quote as QuoteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ThemeId } from "@/reels/types";
import { QuoteStep } from "./QuoteStep";
import type { QuotesState } from "./useQuotes";
import { VerseStep, type Verse } from "./VerseStep";

// ─── Passo 1: o conteúdo ──────────────────────────────────────────────────────
// Duas áreas sobre o mesmo fluxo: versículo bíblico ou frase motivacional.
// Da escolha para baixo — tema, vídeo, estilo, áudio — nada muda.
//
// As duas produzem o mesmo `Verse { text, reference }`: no versículo,
// `reference` é "João 3:16"; na frase, é o autor. Como o formato é o mesmo,
// o layout, o SVG, o FFmpeg e a narração não precisaram saber da diferença.

export type ContentType = "verse" | "quote";

export function ContentStep({
  contentType,
  onContentTypeChange,
  content,
  onContentChange,
  quotes,
  theme,
  onThemeChange,
}: {
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
  content: Verse | null;
  onContentChange: (content: Verse | null) => void;
  quotes: QuotesState;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}) {
  const { t } = useTranslation();

  const tabs: { id: ContentType; label: string; icon: typeof BookOpen }[] = [
    { id: "verse", label: t("reels.content_verse"), icon: BookOpen },
    { id: "quote", label: t("reels.content_quote"), icon: QuoteIcon },
  ];

  return (
    <div className="space-y-5">
      <div className="flex gap-1 p-1 rounded-xl bg-muted/30 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = contentType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onContentTypeChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-heading font-semibold transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {contentType === "verse" ? (
        <VerseStep verse={content} onChange={onContentChange} />
      ) : (
        <QuoteStep
          quotes={quotes}
          theme={theme}
          onThemeChange={onThemeChange}
          selected={content}
          onSelect={onContentChange}
        />
      )}
    </div>
  );
}
