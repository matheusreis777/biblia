import { getTheme, isThemeId } from "../../../src/reels/themes";
import type { ReelVideo, ThemeId } from "../../../src/reels/types";
import { InternalVideoProvider } from "./internal";
import { PEXELS_DOWNLOAD_HOSTS, PexelsVideoProvider } from "./pexels";
import { PIXABAY_DOWNLOAD_HOSTS, PixabayVideoProvider } from "./pixabay";
import { isUsable, rankVideos, type SearchOptions, type VideoProvider } from "./types";

// ─── Cadeia de fallback ───────────────────────────────────────────────────────
// Ordem: Pexels → Pixabay → biblioteca interna.
//
// Para acrescentar um provedor, implemente VideoProvider e insira-o no array.
// A ordem do array É a ordem de preferência; nenhuma outra parte do sistema
// precisa saber que ele existe.

export const PROVIDERS: VideoProvider[] = [
  new PexelsVideoProvider(),
  new PixabayVideoProvider(),
  new InternalVideoProvider(),
];

/** Quantos clipes bons já bastam para não consultar o próximo provedor. */
const ENOUGH_RESULTS = 6;

export interface ResolveResult {
  videos: ReelVideo[];
  /** Provedores que efetivamente contribuíram, na ordem em que foram usados. */
  usedProviders: string[];
  /** Provedores que falharam, para aparecer no log sem quebrar a resposta. */
  failures: { providerId: string; message: string }[];
}

export interface ResolveOptions extends SearchOptions {
  /** Tema, que define as queries usadas em cada provedor. */
  theme: ThemeId;
}

/**
 * Busca clipes para um tema percorrendo os provedores em ordem.
 *
 * Só desce para o próximo provedor quando o anterior não juntou resultados
 * suficientes — assim o Pexels atende o caso normal e o Pixabay só é
 * consultado quando realmente precisa. A falha de um provedor nunca derruba a
 * requisição: ela é registrada e a busca continua no próximo.
 */
export async function resolveVideos(options: ResolveOptions): Promise<ResolveResult> {
  const theme = getTheme(options.theme);

  const collected = new Map<string, ReelVideo>();
  const usedProviders: string[] = [];
  const failures: ResolveResult["failures"] = [];

  for (const provider of PROVIDERS) {
    if (collected.size >= ENOUGH_RESULTS) break;
    if (!provider.isAvailable()) continue;

    // A biblioteca interna busca por tema; os externos, pelas queries em inglês.
    const queries =
      provider.id === "internal" ? [theme.id] : theme.queries;

    let contributed = false;

    for (const query of queries) {
      if (collected.size >= ENOUGH_RESULTS) break;

      try {
        const results = await provider.search(query, options);
        for (const video of results) {
          if (collected.has(video.id)) continue;
          if (!isUsable(video, options.minDurationSec)) continue;
          collected.set(video.id, video);
          contributed = true;
        }
      } catch (error) {
        failures.push({
          providerId: provider.id,
          message: error instanceof Error ? error.message : String(error),
        });
        // Um provedor fora do ar não pode impedir os seguintes de responder.
        break;
      }
    }

    if (contributed) usedProviders.push(provider.id);
  }

  return {
    videos: rankVideos([...collected.values()]).slice(0, options.limit),
    usedProviders,
    failures,
  };
}

// ─── Segurança do download ────────────────────────────────────────────────────

/**
 * Hosts de onde o render aceita baixar um clipe.
 *
 * Sem esta lista, /api/reels/render aceitaria qualquer URL e viraria um proxy
 * de download aberto — alguém poderia usá-lo para buscar arquivos arbitrários
 * a partir do nosso servidor.
 */
const ALLOWED_HOSTS = new Set([...PEXELS_DOWNLOAD_HOSTS, ...PIXABAY_DOWNLOAD_HOSTS]);

export function isAllowedVideoUrl(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return ALLOWED_HOSTS.has(url.hostname);
}

export { isThemeId };
