// ─── Contrato dos provedores de voz ───────────────────────────────────────────
// Mesmo formato dos provedores de vídeo (server/reels/providers/types.ts):
// interface + implementações + um resolve*() que percorre a lista.
//
// Acrescentar um motor de voz = implementar TtsProvider e incluí-lo no array
// de PROVIDERS em ./index.ts.

export interface TtsVoice {
  /** Identificador entendido pelo provedor dono da voz. */
  id: string;
  providerId: string;
  label: string;
  gender: "female" | "male";
  /** Tag BCP-47, ex.: "pt-BR". */
  language: string;
  /** Nota curta exibida na interface, quando houver algo a ressalvar. */
  note?: string;
}

export interface NarrationResult {
  audio: Buffer;
  /** "audio/mpeg" ou "audio/wav" — os provedores devolvem formatos diferentes. */
  mime: string;
  /** Extensão do arquivo temporário que o FFmpeg vai ler. */
  extension: "mp3" | "wav";
  /** A voz efetivamente usada, que pode não ser a pedida se houve fallback. */
  voiceId: string;
  providerId: string;
}

export interface TtsProvider {
  readonly id: string;

  /**
   * `false` quando o provedor não funciona neste ambiente — o caso concreto é
   * a voz do Windows, que não existe no Linux da Vercel.
   *
   * Note que `true` NÃO garante sucesso: o motor do Edge depende de um endpoint
   * externo e só se sabe ao tentar. Por isso a cadeia em ./index.ts também
   * trata exceções de `synthesize`, não só a indisponibilidade declarada.
   */
  isAvailable(): Promise<boolean>;

  voices(): TtsVoice[];

  /**
   * @param rate Multiplicador de velocidade da fala. 1 = normal, 0.8 = mais
   *             lento, 1.2 = mais rápido. Cada provedor converte para a própria
   *             escala.
   */
  synthesize(text: string, voiceId: string, rate: number): Promise<NarrationResult>;
}

/** Limites da velocidade da fala, compartilhados pela interface e pela rota. */
export const MIN_RATE = 0.7;
export const MAX_RATE = 1.3;
export const DEFAULT_RATE = 0.95;

export function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return DEFAULT_RATE;
  return Math.min(Math.max(rate, MIN_RATE), MAX_RATE);
}

/**
 * Escapa o texto para entrar em SSML.
 *
 * Não é opcional: os provedores montam um documento XML em volta do texto, e um
 * "&" cru num versículo quebraria a requisição inteira. O README do msedge-tts
 * alerta explicitamente para isso.
 */
export function escapeSsml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
