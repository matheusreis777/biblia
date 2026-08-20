import { EdgeTtsProvider } from "./edge";
import { clampRate, type NarrationResult, type TtsProvider, type TtsVoice } from "./types";
import { WindowsTtsProvider } from "./windows";

// ─── Cadeia de fallback da voz ────────────────────────────────────────────────
// Ordem: Edge (neural) → Windows (local) → nenhum.
//
// A ordem do array É a ordem de preferência, igual à dos provedores de vídeo.
// Acrescentar um motor novo = implementar TtsProvider e inserir aqui.

export const TTS_PROVIDERS: TtsProvider[] = [
  new EdgeTtsProvider(),
  new WindowsTtsProvider(),
];

/** Acima disso a narração fica longa demais para qualquer Reel. */
export const MAX_NARRATION_CHARS = 700;

export interface NarrationFailure {
  providerId: string;
  message: string;
}

export interface ResolvedNarration extends NarrationResult {
  /** Provedores que tentaram e falharam antes deste dar certo. */
  failures: NarrationFailure[];
  /** `true` quando a voz entregue não é a que foi pedida. */
  fellBack: boolean;
}

/** Vozes de todos os provedores utilizáveis neste ambiente. */
export async function availableVoices(): Promise<TtsVoice[]> {
  const voices: TtsVoice[] = [];
  for (const provider of TTS_PROVIDERS) {
    if (await provider.isAvailable()) voices.push(...provider.voices());
  }
  return voices;
}

function ownerOf(voiceId: string): TtsProvider | null {
  return TTS_PROVIDERS.find((p) => p.voices().some((v) => v.id === voiceId)) ?? null;
}

/**
 * Sintetiza a narração, percorrendo os provedores até um funcionar.
 *
 * O provedor dono da voz pedida vem primeiro; os demais entram na ordem da
 * cadeia. Uma falha nunca interrompe a busca — é registrada e a tentativa segue
 * para o próximo, porque entregar a narração com outra voz é melhor do que
 * entregar silêncio.
 *
 * Lança apenas quando TODOS falharam. Quem chama decide o que fazer: a rota de
 * render, por exemplo, segue em frente e gera o vídeo mudo.
 */
export async function resolveNarration(
  text: string,
  voiceId: string,
  rate: number,
): Promise<ResolvedNarration> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Não há texto para narrar.");

  const requestedOwner = ownerOf(voiceId);
  const ordered = requestedOwner
    ? [requestedOwner, ...TTS_PROVIDERS.filter((p) => p !== requestedOwner)]
    : TTS_PROVIDERS;

  const failures: NarrationFailure[] = [];
  const safeRate = clampRate(rate);

  for (const provider of ordered) {
    if (!(await provider.isAvailable())) continue;

    // Só o provedor dono usa a voz pedida; nos demais, a voz pedida não existe
    // e cada um escolhe a própria (a primeira do idioma correspondente).
    const voice =
      provider === requestedOwner
        ? voiceId
        : (matchLanguage(provider, requestedOwner, voiceId)?.id ?? provider.voices()[0]?.id);

    if (!voice) continue;

    try {
      const result = await provider.synthesize(trimmed, voice, safeRate);
      return { ...result, failures, fellBack: result.voiceId !== voiceId };
    } catch (error) {
      failures.push({
        providerId: provider.id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const detail = failures.map((f) => `${f.providerId}: ${f.message}`).join(" | ");
  throw new Error(`Nenhum motor de voz funcionou. ${detail}`);
}

/** No fallback, tenta manter ao menos o idioma da voz originalmente pedida. */
function matchLanguage(
  provider: TtsProvider,
  requestedOwner: TtsProvider | null,
  voiceId: string,
): TtsVoice | undefined {
  const language = requestedOwner?.voices().find((v) => v.id === voiceId)?.language;
  if (!language) return undefined;
  return provider.voices().find((v) => v.language === language);
}

export type { NarrationResult, TtsVoice } from "./types";
export { clampRate, DEFAULT_RATE, MAX_RATE, MIN_RATE } from "./types";
