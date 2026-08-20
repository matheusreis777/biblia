// ─── Contrato dos provedores de trilha ────────────────────────────────────────
// Mesma forma dos provedores de vídeo e de voz.

export interface MusicTrack {
  id: string;
  providerId: string;
  title: string;
  artist: string;
  durationSec: number;
  /** URL do MP3 — usada tanto no preview quanto no render. */
  audioUrl: string;
  /** Página da faixa, para o crédito. */
  sourceUrl: string;
  /**
   * Texto de crédito exigido pela licença, ou `null` quando ela não exige.
   * A pasta local não exige; um provedor de acervo Creative Commons exigiria,
   * e a interface mostra este texto quando ele existe.
   */
  attribution: string | null;
  /** Nome curto da licença, exibido na interface. */
  license: string;
}

export interface MusicSearchOptions {
  limit: number;
  page: number;
  /** Duração mínima aceitável, para a faixa cobrir o Reel sem loop audível. */
  minDurationSec: number;
}

export interface MusicProvider {
  readonly id: string;
  readonly label: string;
  isAvailable(): boolean;
  search(mood: string, options: MusicSearchOptions): Promise<MusicTrack[]>;
}

/** Climas oferecidos na interface, com a busca correspondente em cada API. */
export const MOODS = ["calm", "hopeful", "cinematic", "worship", "uplifting"] as const;
export type Mood = (typeof MOODS)[number];

export function isMood(value: string): value is Mood {
  return (MOODS as readonly string[]).includes(value);
}

/** Termos de busca por clima. Instrumental sempre, para não brigar com a voz. */
export const MOOD_QUERIES: Record<Mood, string[]> = {
  calm: ["calm ambient instrumental", "peaceful piano"],
  hopeful: ["hopeful inspiring instrumental", "uplifting ambient"],
  cinematic: ["cinematic emotional instrumental", "epic ambient"],
  worship: ["worship instrumental", "spiritual meditation music"],
  uplifting: ["uplifting acoustic instrumental", "warm inspiring"],
};

/**
 * Uma faixa mais curta que o Reel entraria em loop, e a emenda aparece.
 * O mesmo critério usado nos clipes de vídeo.
 */
export const MIN_TRACK_DURATION_SEC = 20;

export function isUsableTrack(track: MusicTrack, minDurationSec: number): boolean {
  return Boolean(track.audioUrl) && track.durationSec >= minDurationSec;
}
