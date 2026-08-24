import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Versículo ────────────────────────────────────────────────────────────────
// NÃO é um card. O texto bíblico corre como uma publicação editorial: número
// pendurado numa coluna fixa à esquerda e a seleção desenhada como uma banda
// que sangra para fora da coluna de leitura (margem negativa + padding igual).
// Caixas em volta de cada versículo picotam a leitura, que é justamente o que a
// página deveria proteger.
//
// São DOIS botões irmãos, não um dentro do outro: selecionar o versículo e
// favoritá-lo são ações diferentes, e botão aninhado em `role="button"` não é
// exposto de forma confiável por leitor de tela. O `grid-cols-subgrid` do botão
// de seleção é o que permite essa separação sem perder o alinhamento das
// colunas — número e texto continuam presos à mesma grade da linha.
//
// A ESTRELA é o defeito mais grave do layout antigo, e a correção tem duas
// partes:
//
//   1. `pointer-coarse:opacity-100` — em toque não existe hover, então ela era
//      invisível e favoritar não tinha affordance nenhuma no celular;
//   2. o alvo mede 44x44 de verdade, na própria coluna, em vez de flutuar por
//      cima da última palavra da linha.
//
// Em ponteiro fino ela continua discreta: aparece no hover ou no foco da linha,
// e fica sempre visível quando o versículo já está favoritado.

interface VerseProps {
  number: number;
  text: string;
  selected: boolean;
  favorited: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

function VerseRow({
  number,
  text,
  selected,
  favorited,
  onSelect,
  onToggleFavorite,
}: VerseProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "group grid scroll-mt-24 grid-cols-[1.75rem_1fr_2.75rem] items-start gap-x-2",
        // A banda de seleção sangra para os lados: -mx compensado por px igual.
        "-mx-3 rounded-xl px-3 py-2 transition-colors duration-150 sm:-mx-4 sm:px-4",
        selected ? "bg-highlight" : "hover:bg-accent/60",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={t("verse.select", { number })}
        className="col-span-2 grid grid-cols-subgrid items-start gap-x-2 rounded-lg text-left"
      >
        <span
          aria-hidden="true"
          className={cn(
            "select-none pt-[0.35em] text-right font-heading text-[0.7rem] font-semibold tabular-nums transition-colors",
            selected
              ? "text-primary"
              : "text-muted-foreground/60 group-hover:text-muted-foreground",
          )}
        >
          {number}
        </span>

        <span
          className={cn(
            "block font-[family-name:var(--reading-family)] text-[length:var(--reading-size)]",
            "leading-[var(--reading-leading)] transition-colors",
            selected ? "text-foreground" : "text-foreground/90",
          )}
        >
          {text}
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={favorited}
        aria-label={favorited ? t("bible.unfavorite") : t("bible.favorite")}
        className={cn(
          "-mt-0.5 flex h-11 w-11 items-center justify-center justify-self-end rounded-xl",
          "transition-[opacity,color,transform] duration-150 active:scale-90",
          favorited
            ? "text-primary opacity-100"
            : cn(
                "text-muted-foreground/50 opacity-0 hover:text-primary",
                // Em toque, sempre visível — é o conserto do defeito 7.3.
                "pointer-coarse:opacity-70",
                "group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
              ),
        )}
      >
        <Star size={16} fill={favorited ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

// O capítulo mais longo tem 176 versículos; sem memo, selecionar um redesenha
// todos.
export const Verse = memo(VerseRow);
