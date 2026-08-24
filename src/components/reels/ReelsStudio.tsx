import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Estúdio ──────────────────────────────────────────────────────────────────
// As MESMAS seções, dois arranjos:
//
//   Desktop — seções empilhadas na esquerda, preview sticky na direita. As
//     seções deixaram de ser cartões pesados: agora são cabeçalho numerado,
//     divisor e respiro. Cinco caixas com borda empilhadas competiam entre si.
//
//   Mobile — o conserto principal. O preview era o ÚLTIMO elemento da página,
//     alcançável só rolando até o fim: dava para editar o Reel inteiro sem ver
//     o resultado. Agora ele fica colado no topo (sticky, com altura limitada),
//     as seções viram abas, e gerar mora numa barra fixa embaixo.
//
// O componente não conhece nenhum estado do gerador: recebe as seções prontas.

export interface StudioSection {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  node: ReactNode;
  /** Seções à frente do conteúdo ficam inertes até haver um versículo. */
  disabled?: boolean;
}

function SectionHeading({
  index,
  section,
}: {
  index: number;
  section: StudioSection;
}) {
  return (
    <header className="mb-4 flex items-baseline gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading text-[11px] font-bold text-primary">
        {index + 1}
      </span>
      <div className="min-w-0">
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
          {section.label}
        </h2>
        {section.hint && (
          <p className="mt-1 font-body text-xs text-muted-foreground">{section.hint}</p>
        )}
      </div>
    </header>
  );
}

export function ReelsStudio({
  sections,
  preview,
  aside,
  generate,
}: {
  sections: StudioSection[];
  /** Recebe a classe que define a caixa do preview em cada arranjo. */
  preview: (boxClassName: string) => ReactNode;
  /** Vai sob o preview no desktop (avisos, crédito do vídeo, área segura). */
  aside: ReactNode;
  generate: (compact: boolean) => ReactNode;
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const active = sections.find((s) => s.id === activeId) ?? sections[0];
  const activeIndex = sections.findIndex((s) => s.id === active?.id);

  return (
    <>
      {/* ── Desktop ──────────────────────────────────────────────────── */}
      <div className="hidden gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 divide-y divide-border">
          {sections.map((section, index) => (
            <section
              key={section.id}
              className={cn(
                "py-8 transition-opacity first:pt-0",
                section.disabled && "pointer-events-none select-none opacity-40",
              )}
              aria-disabled={section.disabled}
            >
              <SectionHeading index={index} section={section} />
              {section.node}
            </section>
          ))}
        </div>

        <aside className="sticky top-24 space-y-4">
          {preview("w-full max-w-[20rem]")}
          {aside}
          {generate(false)}
        </aside>
      </div>

      {/* ── Mobile e tablet ──────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Gruda logo abaixo do header, que mede h-14 no mobile e h-16 a
            partir de sm. Preview e abas andam juntos: separá-los faria as abas
            sumirem ao rolar os controles. */}
        <div className="sticky top-14 z-20 sm:top-16 -mx-4 border-b border-border bg-background/95 px-4 pb-2 pt-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          {preview("h-[34svh] max-h-80")}

          <div
            role="tablist"
            aria-label={active?.label}
            className="mt-3 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {sections.map((section) => {
              const selected = section.id === active?.id;
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  disabled={section.disabled}
                  onClick={() => setActiveId(section.id)}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3",
                    "font-heading text-xs font-semibold transition-colors disabled:opacity-30",
                    selected
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={14} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* pb generoso: a barra fixa não pode cobrir o último controle. */}
        <div className="pb-40 pt-6">
          {active && (
            <section aria-label={active.label}>
              <SectionHeading index={activeIndex} section={active} />
              {active.node}
            </section>
          )}
          {aside && <div className="mt-8 space-y-4 border-t border-border pt-6">{aside}</div>}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
          {generate(true)}
        </div>
      </div>
    </>
  );
}
