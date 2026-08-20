import { useEffect, useState } from "react";

// ─── Trilhas ──────────────────────────────────────────────────────────────────
// Consome /api/reels/music, que esconde as chaves e já aplica a cadeia de
// fallback (Pixabay → Jamendo → pasta local em public/music/).

export interface MusicTrack {
  id: string;
  providerId: string;
  title: string;
  artist: string;
  durationSec: number;
  audioUrl: string;
  sourceUrl: string;
  /** Crédito exigido pela licença, ou `null` quando ela dispensa. */
  attribution: string | null;
  license: string;
}

export const MOODS = ["calm", "hopeful", "cinematic", "worship", "uplifting"] as const;
export type Mood = (typeof MOODS)[number];

export interface MusicState {
  tracks: MusicTrack[];
  providers: string[];
  loading: boolean;
  error: string | null;
}

/** Resultado já carregado, junto do clima a que ele pertence. */
interface Loaded {
  mood: Mood;
  tracks: MusicTrack[];
  providers: string[];
  error: string | null;
}

export function useMusic(mood: Mood, enabled: boolean): MusicState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    fetch(`/api/reels/music?mood=${mood}&limit=12`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        return data;
      })
      .then((data) => {
        if (!active) return;
        setLoaded({
          mood,
          tracks: data.tracks ?? [],
          providers: data.providers ?? [],
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setLoaded({
          mood,
          tracks: [],
          providers: [],
          error: err instanceof Error ? err.message : String(err),
        });
      });

    return () => {
      active = false;
    };
  }, [mood, enabled]);

  // `loading` é derivado, não guardado em estado: marcá-lo dentro do efeito
  // exigiria um setState síncrono ali, que dispara renderização em cascata.
  // Se o resultado guardado não é do clima atual, ainda estamos carregando.
  const current = enabled && loaded?.mood === mood ? loaded : null;

  return {
    tracks: current?.tracks ?? [],
    providers: current?.providers ?? [],
    loading: enabled && current === null,
    error: current?.error ?? null,
  };
}
