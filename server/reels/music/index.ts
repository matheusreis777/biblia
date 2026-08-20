import { LocalMusicProvider, resolveLocalTrackPath } from "./local";
import {
  MIN_TRACK_DURATION_SEC,
  MOOD_QUERIES,
  type Mood,
  type MusicProvider,
  type MusicTrack,
} from "./types";

// ─── Provedores de trilha ─────────────────────────────────────────────────────
// Hoje há só um: os arquivos que você põe em public/music/.
//
// POR QUE NÃO HÁ UM PROVEDOR DE API AQUI — as três fontes candidatas foram
// testadas e nenhuma serve:
//
//   Pixabay   /api/audio/ existe, mas responde 403 "Access denied" mesmo com
//             uma chave válida (a mesma chave retorna 200 em /api/videos/).
//             O endpoint é fechado para chaves comuns.
//   Jamendo   funciona, mas exige client_id próprio e o acervo é Creative
//             Commons com exigência de crédito. Removido a pedido.
//   Free Music Archive   API fora do ar (404).
//
// A estrutura de cadeia foi mantida: para plugar uma API no futuro, implemente
// MusicProvider (./types.ts) e insira-o ANTES do LocalMusicProvider no array
// abaixo. Nada mais no sistema precisa mudar.

export const MUSIC_PROVIDERS: MusicProvider[] = [new LocalMusicProvider()];

const ENOUGH_RESULTS = 6;

export interface ResolveMusicResult {
  tracks: MusicTrack[];
  usedProviders: string[];
  failures: { providerId: string; message: string }[];
}

export interface ResolveMusicOptions {
  mood: Mood;
  limit: number;
  page: number;
}

/** Mesma lógica de resolveVideos: percorre, pula indisponíveis, tolera falhas. */
export async function resolveMusic(
  options: ResolveMusicOptions,
): Promise<ResolveMusicResult> {
  const collected = new Map<string, MusicTrack>();
  const usedProviders: string[] = [];
  const failures: ResolveMusicResult["failures"] = [];

  const searchOptions = {
    limit: options.limit,
    page: options.page,
    minDurationSec: MIN_TRACK_DURATION_SEC,
  };

  for (const provider of MUSIC_PROVIDERS) {
    if (collected.size >= ENOUGH_RESULTS) break;
    if (!provider.isAvailable()) continue;

    // A pasta local não tem busca textual: devolve o que houver.
    const queries = provider.id === "local" ? [""] : MOOD_QUERIES[options.mood];
    let contributed = false;

    for (const query of queries) {
      if (collected.size >= ENOUGH_RESULTS) break;
      try {
        for (const track of await provider.search(query, searchOptions)) {
          if (collected.has(track.id)) continue;
          collected.set(track.id, track);
          contributed = true;
        }
      } catch (error) {
        failures.push({
          providerId: provider.id,
          message: error instanceof Error ? error.message : String(error),
        });
        break;
      }
    }

    if (contributed) usedProviders.push(provider.id);
  }

  return { tracks: [...collected.values()].slice(0, options.limit), usedProviders, failures };
}

// ─── Segurança do download ────────────────────────────────────────────────────

/**
 * Hosts remotos permitidos. Vazio enquanto só existe a pasta local — quando
 * um provedor de API entrar, acrescente aqui os domínios do CDN dele.
 */
const ALLOWED_HOSTS = new Set<string>();

/**
 * Onde o render pode buscar uma faixa: um host conhecido, ou um arquivo da
 * pasta local. Sem esta checagem, a rota de render aceitaria qualquer URL e
 * viraria um proxy de download aberto — a mesma proteção que os vídeos têm.
 */
export function isAllowedMusicUrl(rawUrl: string): boolean {
  if (resolveLocalTrackPath(rawUrl) !== null) return true;

  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export { resolveLocalTrackPath };
export { isMood, MOODS, type Mood, type MusicTrack } from "./types";
