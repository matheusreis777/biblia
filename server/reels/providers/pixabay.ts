import type { ReelVideo } from "../../../src/reels/types.js";
import {
  pickPreviewFile,
  pickRenderFile,
  type ProviderFile,
  type SearchOptions,
  type VideoProvider,
} from "./types.js";

// ─── Pixabay ──────────────────────────────────────────────────────────────────
// https://pixabay.com/api/docs/#api_search_videos
//
// Usado como fallback do Pexels. Atenção: a API de VÍDEOS do Pixabay não aceita
// o parâmetro `orientation` (só a de imagens aceita), então o acervo vem
// majoritariamente em paisagem e a filtragem por proporção acontece aqui,
// depois da resposta. Por isso pedimos bem mais itens do que precisamos.

const ENDPOINT = "https://pixabay.com/api/videos/";

interface PixabayVideoFile {
  url: string;
  width: number;
  height: number;
  size: number;
  thumbnail?: string;
}

interface PixabayHit {
  id: number;
  pageURL: string;
  duration: number;
  tags: string;
  user: string;
  videos: Record<string, PixabayVideoFile | undefined>;
}

interface PixabayResponse {
  hits?: PixabayHit[];
}

function toReelVideo(hit: PixabayHit): ReelVideo | null {
  const usable = Object.values(hit.videos).filter(
    (f): f is PixabayVideoFile => Boolean(f?.url && f.width && f.height),
  );

  const files: ProviderFile[] = usable.map((f) => ({
    url: f.url,
    width: f.width,
    height: f.height,
  }));

  const render = pickRenderFile(files);
  const preview = pickPreviewFile(files);
  if (!render || !preview) return null;

  // O thumbnail vem junto do arquivo, não no nível do hit — pega o primeiro
  // que tiver um.
  const thumbnail = usable.find((f) => f.thumbnail)?.thumbnail ?? "";

  return {
    id: `pixabay-${hit.id}`,
    providerId: "pixabay",
    width: render.width,
    height: render.height,
    durationSec: hit.duration,
    thumbUrl: thumbnail,
    previewUrl: preview.url,
    downloadUrl: render.url,
    author: { name: hit.user, url: hit.pageURL },
    sourceUrl: hit.pageURL,
  };
}

export class PixabayVideoProvider implements VideoProvider {
  readonly id = "pixabay";
  readonly label = "Pixabay";

  private readonly apiKey: string | undefined;

  constructor(apiKey = process.env.PIXABAY_API_KEY) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  async search(query: string, options: SearchOptions): Promise<ReelVideo[]> {
    if (!this.apiKey) return [];

    const url = new URL(ENDPOINT);
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("video_type", "film");
    url.searchParams.set("safesearch", "true");
    // Sem filtro de orientação na API, a maioria vem em paisagem e é
    // descartada depois — por isso pedimos o teto de 200 por página.
    url.searchParams.set("per_page", "200");
    url.searchParams.set("page", String(options.page));

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Pixabay respondeu ${res.status}`);
    }

    const data = (await res.json()) as PixabayResponse;
    return (data.hits ?? [])
      .map(toReelVideo)
      .filter((v): v is ReelVideo => v !== null);
  }
}

/** Domínios de onde o render aceita baixar um clipe deste provedor. */
export const PIXABAY_DOWNLOAD_HOSTS = ["cdn.pixabay.com", "vod-progressive.akamaized.net"];
