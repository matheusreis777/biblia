import type { ReelVideo } from "../../../src/reels/types";
import {
  pickPreviewFile,
  pickRenderFile,
  type ProviderFile,
  type SearchOptions,
  type VideoProvider,
} from "./types";

// ─── Pexels ───────────────────────────────────────────────────────────────────
// https://www.pexels.com/api/documentation/#videos-search
// Limite gratuito: 200 requisições/hora. A chave NUNCA sai do servidor.

const ENDPOINT = "https://api.pexels.com/videos/search";

interface PexelsVideoFile {
  id: number;
  /** Vem `null` numa parte considerável do acervo — não dá para confiar nele. */
  quality: string | null;
  file_type: string;
  width: number | null;
  height: number | null;
  fps: number | null;
  link: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  image: string;
  user: { name: string; url: string };
  video_files: PexelsVideoFile[];
}

interface PexelsResponse {
  videos?: PexelsVideo[];
  error?: string;
}

function toReelVideo(video: PexelsVideo): ReelVideo | null {
  // A seleção é sempre por width/height. O campo `quality` vem `null` numa
  // parte considerável do acervo (confirmado na API), então ordenar por essa
  // string entregaria um arquivo 360p como se fosse o melhor.
  const files: ProviderFile[] = video.video_files
    .filter((f) => f.file_type === "video/mp4" && f.width && f.height)
    .map((f) => ({ url: f.link, width: f.width as number, height: f.height as number }));

  const render = pickRenderFile(files);
  const preview = pickPreviewFile(files);
  if (!render || !preview) return null;

  return {
    id: `pexels-${video.id}`,
    providerId: "pexels",
    width: render.width,
    height: render.height,
    durationSec: video.duration,
    thumbUrl: video.image,
    previewUrl: preview.url,
    downloadUrl: render.url,
    author: { name: video.user.name, url: video.user.url },
    sourceUrl: video.url,
  };
}

export class PexelsVideoProvider implements VideoProvider {
  readonly id = "pexels";
  readonly label = "Pexels";

  private readonly apiKey: string | undefined;

  constructor(apiKey = process.env.PEXELS_API_KEY) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async search(query: string, options: SearchOptions): Promise<ReelVideo[]> {
    if (!this.apiKey) return [];

    const url = new URL(ENDPOINT);
    url.searchParams.set("query", query);
    url.searchParams.set("orientation", "portrait");
    url.searchParams.set("size", "medium");
    url.searchParams.set("per_page", String(Math.min(options.limit * 2, 80)));
    url.searchParams.set("page", String(options.page));

    const res = await fetch(url, { headers: { Authorization: this.apiKey } });
    if (!res.ok) {
      throw new Error(`Pexels respondeu ${res.status}`);
    }

    const data = (await res.json()) as PexelsResponse;
    if (data.error) throw new Error(`Pexels: ${data.error}`);

    return (data.videos ?? [])
      .map(toReelVideo)
      .filter((v): v is ReelVideo => v !== null);
  }
}

/** Domínios de onde o render aceita baixar um clipe deste provedor. */
export const PEXELS_DOWNLOAD_HOSTS = ["videos.pexels.com", "player.vimeo.com"];
