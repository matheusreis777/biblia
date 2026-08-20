// ─── Tempos da animação ───────────────────────────────────────────────────────
// Compartilhados entre o preview (animações CSS) e o render (filtros do
// FFmpeg). Ficando num lugar só, o preview mostra a mesma entrada de texto que
// o vídeo final vai ter — mudar um valor aqui muda os dois.
//
// Todos em segundos, exceto onde indicado.

export const TIMING = {
  /** O escurecimento entra quase junto com o vídeo. */
  scrimFadeIn: 0.4,

  /** O versículo espera o espectador registrar a paisagem antes de aparecer. */
  verseStart: 0.6,
  verseFade: 1.2,

  /** A referência entra depois do versículo, para não competir com ele. */
  metaStart: 1.8,
  metaFade: 1.0,

  /** Deslocamento vertical inicial do versículo, em px do canvas 1080x1920. */
  verseRisePx: 22,

  /**
   * Quando a narração começa a falar.
   *
   * Coincide com o fim da entrada do versículo (verseStart + verseFade): o
   * espectador lê a frase junto com a voz. Começar junto com o clipe faria a
   * fala anteceder o texto na tela.
   */
  narrationStart: 1.8,
} as const;

/** Zoom total do fundo ao longo do clipe. 6% nota-se sem parecer efeito barato. */
export const ZOOM_AMOUNT = 0.06;
