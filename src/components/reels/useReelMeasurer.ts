import { useEffect, useState } from "react";
import { FONT_VARIANTS } from "@/reels/fonts";
import { createMeasurer, loadFontsForBrowser } from "@/reels/measure";
import type { Measurer } from "@/reels/types";

// ─── Fontes do preview ────────────────────────────────────────────────────────
// Duas coisas precisam acontecer antes de o preview poder ser desenhado:
//
//   1. o opentype.js precisa dos .ttf para MEDIR o texto e quebrar as linhas —
//      é a mesma medição que o servidor faz, e é o que garante que o preview
//      bata com o MP4;
//   2. o browser precisa ter as @font-face carregadas para DESENHAR o texto.
//
// Sem (2), a primeira renderização sairia com fonte de fallback e mudaria de
// lugar quando a fonte real chegasse.

/** Uma vez por sessão: são ~520KB no total. */
let cached: Promise<Measurer> | null = null;

async function load(): Promise<Measurer> {
  const [fonts] = await Promise.all([
    loadFontsForBrowser(),
    // document.fonts só busca uma família quando algo a usa. Aqui pedimos
    // explicitamente, para não desenhar o preview com fonte de fallback.
    Promise.all(FONT_VARIANTS.map((v) => document.fonts.load(`16px "${v.family}"`))),
  ]);
  return createMeasurer(fonts);
}

export interface ReelMeasurerState {
  measurer: Measurer | null;
  error: string | null;
}

export function useReelMeasurer(): ReelMeasurerState {
  const [state, setState] = useState<ReelMeasurerState>({ measurer: null, error: null });

  useEffect(() => {
    let active = true;
    cached ??= load();

    cached
      .then((measurer) => {
        if (active) setState({ measurer, error: null });
      })
      .catch((err: unknown) => {
        // Uma falha aqui não pode ficar silenciosa: sem medidor não há preview.
        cached = null;
        if (active) {
          setState({
            measurer: null,
            error: err instanceof Error ? err.message : "Falha ao carregar as fontes.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
