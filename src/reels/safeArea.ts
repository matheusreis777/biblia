import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./types.js";

// ─── Área segura ──────────────────────────────────────────────────────────────
// Instagram, TikTok e YouTube Shorts desenham a própria interface por cima do
// vídeo. Estes valores são a UNIÃO das três zonas ocupadas, em px do canvas
// 1080x1920 — texto dentro desta caixa não é encoberto em nenhuma das plataformas.
//
// Referência aproximada do que fica coberto:
//   topo    — barra de status / "Seguindo | Para você"   ~200px
//   rodapé  — legenda, @usuário, áudio, barra de progresso
//             (TikTok é o pior caso, ~390px)
//   direita — coluna de curtir/comentar/compartilhar     ~150px
//   esquerda— nada relevante, margem só por respiro visual

export const SAFE_AREA = {
  top: 210,
  bottom: 400,
  left: 96,
  right: 96,
} as const;

/**
 * A coluna direita de ícones cobre até ~150px da borda em IG e TikTok, mas só
 * na metade de baixo. Texto centralizado com margem simétrica de 96px fica
 * visualmente centrado e ainda livre dos ícones; um bloco alinhado à esquerda
 * que chegue perto da direita, não. Por isso a largura útil é conservadora.
 */
export const RIGHT_RAIL_WIDTH = 150;

export interface SafeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Caixa em que qualquer texto pode ser desenhado com segurança. */
export function safeBox(): SafeBox {
  return {
    x: SAFE_AREA.left,
    y: SAFE_AREA.top,
    width: CANVAS_WIDTH - SAFE_AREA.left - SAFE_AREA.right,
    height: CANVAS_HEIGHT - SAFE_AREA.top - SAFE_AREA.bottom,
  };
}

/**
 * Baseline do branding: encostado na borda de baixo da área segura, logo acima
 * de onde as plataformas começam a desenhar a legenda.
 */
export const BRANDING_BASELINE_Y = CANVAS_HEIGHT - SAFE_AREA.bottom - 24;

/** true se a caixa informada cabe inteira na área segura. */
export function isWithinSafeArea(box: SafeBox): boolean {
  const safe = safeBox();
  return (
    box.x >= safe.x &&
    box.y >= safe.y &&
    box.x + box.width <= safe.x + safe.width &&
    box.y + box.height <= safe.y + safe.height
  );
}
