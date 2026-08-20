import { useEffect, useRef, useState } from "react";

// ─── Narração no browser ──────────────────────────────────────────────────────
// Busca o áudio em /api/reels/narration e mede a duração com um <audio>.
//
// Por que a duração é medida aqui e não no servidor: o motor do Edge devolve
// MP3, e parsear cabeçalho de MP3 no servidor exigiria contar quadros — ou o
// ffprobe, que o ffmpeg-static não traz. O browser já vai carregar este áudio
// para tocar no preview, então `HTMLAudioElement.duration` sai de graça e é
// exato. É essa duração que alimenta o aviso de "a narração não cabe".

export interface ReelVoice {
  id: string;
  providerId: string;
  label: string;
  gender: "female" | "male";
  language: string;
  note?: string;
}

export interface VoicesState {
  voices: ReelVoice[];
  defaultRate: number;
  loading: boolean;
  error: string | null;
}

/**
 * Vozes disponíveis NESTE ambiente — a lista vem do servidor porque as vozes
 * locais do Windows existem na máquina do usuário e não no Linux da Vercel.
 */
export function useVoices(): VoicesState {
  const [state, setState] = useState<VoicesState>({
    voices: [],
    defaultRate: 0.95,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    fetch("/api/reels/voices")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        return data;
      })
      .then((data) => {
        if (!active) return;
        setState({
          voices: data.voices ?? [],
          defaultRate: data.rate?.default ?? 0.95,
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      });

    return () => {
      active = false;
    };
  }, []);

  return state;
}

// ─── Síntese ──────────────────────────────────────────────────────────────────

export interface NarrationRequest {
  enabled: boolean;
  verseText: string;
  reference: string;
  includeReference: boolean;
  voiceId: string;
  rate: number;
  language: string;
  /**
   * Decide como a referência é lida em voz alta: "João 3:16" vira
   * "capítulo 3, versículo 16"; o autor de uma frase é lido como está.
   */
  contentType: "verse" | "quote";
}

export interface NarrationState {
  status: "idle" | "loading" | "ready" | "error";
  url: string | null;
  durationSec: number | null;
  voiceUsed: string | null;
  providerUsed: string | null;
  /** `true` quando a voz entregue não é a que foi pedida. */
  fellBack: boolean;
  error: string | null;
}

const IDLE: NarrationState = {
  status: "idle",
  url: null,
  durationSec: null,
  voiceUsed: null,
  providerUsed: null,
  fellBack: false,
  error: null,
};

interface CacheEntry {
  url: string;
  durationSec: number;
  voiceUsed: string;
  providerUsed: string;
  fellBack: boolean;
}

/**
 * Guarda o áudio já sintetizado por combinação de texto e voz.
 *
 * Sem isso, cada mexida no estilo — que não muda nada do que é falado —
 * dispararia uma síntese nova. Vive no módulo, então sobrevive à remontagem do
 * componente enquanto a aba estiver aberta.
 */
const cache = new Map<string, CacheEntry>();

function cacheKey(req: NarrationRequest): string {
  return JSON.stringify([
    req.verseText,
    req.includeReference ? req.reference : "",
    req.voiceId,
    req.rate,
    req.language,
    req.contentType,
  ]);
}

/** Lê a duração do áudio carregando os metadados. */
function measureDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";

    const timer = setTimeout(() => reject(new Error("Tempo esgotado ao ler o áudio.")), 15_000);

    audio.addEventListener("loadedmetadata", () => {
      clearTimeout(timer);
      // Blobs sempre trazem duração finita; a checagem cobre o caso raro de o
      // browser não conseguir determiná-la.
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    });
    audio.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("Não foi possível ler o áudio gerado."));
    });

    audio.src = url;
  });
}

/** Espera antes de sintetizar, para não disparar a cada tecla digitada. */
const DEBOUNCE_MS = 700;

export function useNarration(request: NarrationRequest): NarrationState {
  const [state, setState] = useState<NarrationState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);

  const key = cacheKey(request);
  const active = request.enabled && Boolean(request.verseText.trim()) && Boolean(request.voiceId);

  useEffect(() => {
    if (!active) {
      setState(IDLE);
      return;
    }

    const cached = cache.get(key);
    if (cached) {
      setState({
        status: "ready",
        url: cached.url,
        durationSec: cached.durationSec,
        voiceUsed: cached.voiceUsed,
        providerUsed: cached.providerUsed,
        fellBack: cached.fellBack,
        error: null,
      });
      return;
    }

    let cancelled = false;
    setState({ ...IDLE, status: "loading" });

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          const res = await fetch("/api/reels/narration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              verseText: request.verseText,
              reference: request.reference,
              includeReference: request.includeReference,
              voiceId: request.voiceId,
              rate: request.rate,
              language: request.language,
              contentType: request.contentType,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const detail = await res.json().catch(() => null);
            throw new Error(detail?.error ?? `O servidor respondeu ${res.status}.`);
          }

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const durationSec = await measureDuration(url);

          const entry: CacheEntry = {
            url,
            durationSec,
            voiceUsed: res.headers.get("X-Reel-Voice") ?? request.voiceId,
            providerUsed: res.headers.get("X-Reel-Provider") ?? "",
            fellBack: res.headers.get("X-Reel-Fellback") === "1",
          };
          cache.set(key, entry);

          if (cancelled) return;
          setState({ status: "ready", error: null, ...entry });
        } catch (err) {
          if (cancelled || controller.signal.aborted) return;
          setState({
            ...IDLE,
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // `key` já resume todos os campos que importam da requisição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);

  return state;
}
