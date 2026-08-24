import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LayoutResult } from "@/reels/types";
import { PhonePreview } from "./PhonePreview";

// ─── Preview responsivo ───────────────────────────────────────────────────────
// O preview era 288x512 fixo em qualquer viewport. `PhonePreview` já derivava a
// escala de `width / layout.width`, então nada no motor precisou mudar: basta
// MEDIR o espaço disponível e passar a largura.
//
// A caixa é `aspect-[9/16]`, e a proporção resolve nas duas direções conforme
// quem manda seja a largura ou a altura:
//
//   desktop — `w-full max-w-[20rem]`: a largura manda, a altura sai da razão;
//   mobile  — `h-[38svh]`: a ALTURA manda, e a largura sai da razão. É o que
//             permite o preview morar colado no topo sem empurrar os controles
//             para fora da tela.

interface ReelsPreviewProps {
  layout: LayoutResult | null;
  videoUrl: string | null;
  posterUrl: string | null;
  animationKey: string | number;
  showSafeArea: boolean;
  narrationUrl: string | null;
  soundOn: boolean;
  onToggleSound: (on: boolean) => void;
  /** Define a caixa: largura no desktop, altura no mobile. */
  className?: string;
}

export function ReelsPreview({ layout, className, ...preview }: ReelsPreviewProps) {
  const { t } = useTranslation();
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;

    // setState dentro do callback do observer é o caminho previsto para
    // sincronizar com um sistema externo — não é setState no corpo do efeito.
    const observer = new ResizeObserver(([entry]) => {
      // Arredonda para baixo: meio pixel de largura vira meio pixel de folga
      // no fim, e a borda arredondada do preview mostraria uma fresta.
      setWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={boxRef} className={cn("relative mx-auto aspect-[9/16]", className)}>
      {layout && width > 0 ? (
        <PhonePreview layout={layout} width={width} {...preview} />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[2rem] border border-border bg-card">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
          <span className="sr-only">{t("common.loading")}</span>
        </div>
      )}
    </div>
  );
}
