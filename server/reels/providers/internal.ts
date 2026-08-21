import type { ReelVideo, ThemeId } from "../../../src/reels/types.js";
import { isThemeId } from "../../../src/reels/themes.js";
import type { SearchOptions, VideoProvider } from "./types.js";

// ─── Biblioteca interna ───────────────────────────────────────────────────────
// Último elo da cadeia de fallback: entra quando nenhuma chave de API está
// configurada ou quando os provedores externos não devolvem nada utilizável.
// Sempre responde alguma coisa, então a página nunca fica sem vídeo.
//
// A lista é curada à mão: todos são 1080x1920 nativos, sem pessoas em primeiro
// plano e sem ninguém falando. São arquivos públicos do CDN do Pexels e não
// exigem chave para serem baixados — o crédito ao autor vai junto, como a
// licença do Pexels pede.
//
// Para ampliar: escolha um clipe portrait no Pexels, pegue o arquivo 1080x1920
// da resposta de /videos/search e acrescente uma entrada aqui. Evite arquivos
// muito acima de ~30MB — o render precisa baixá-los inteiros.

interface InternalClip extends ReelVideo {
  /** Tema para o qual este clipe foi escolhido. */
  theme: string;
}

const CLIPS: InternalClip[] = [
  {
    theme: "peace",
    id: "internal-27675468",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 11,
    thumbUrl: "https://images.pexels.com/videos/27675468/pexels-photo-27675468.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/27675468/12201054_720_1280_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/27675468/12201055_1080_1920_25fps.mp4",
    author: { name: "quang vinh", url: "https://www.pexels.com/@4lufun" },
    sourceUrl: "https://www.pexels.com/video/the-sun-is-setting-over-the-water-27675468/",
  },
  {
    theme: "hope",
    id: "internal-37352133",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 10,
    thumbUrl: "https://images.pexels.com/videos/37352133/pexels-photo-37352133.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/37352133/15821805_720_1280_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/37352133/15821806_1080_1920_30fps.mp4",
    author: { name: "Ritik Patel", url: "https://www.pexels.com/@ritik-patel-2161282827" },
    sourceUrl: "https://www.pexels.com/video/peaceful-ocean-sunrise-with-gentle-waves-37352133/",
  },
  {
    theme: "strength",
    id: "internal-19906163",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 16,
    thumbUrl: "https://images.pexels.com/videos/19906163/fog-mountains-snow-19906163.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/19906163/19906163-hd_720_1280_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/19906163/19906163-hd_1080_1920_25fps.mp4",
    author: { name: "Lucas Leonel Suárez", url: "https://www.pexels.com/@lucasleonelsuarez" },
    sourceUrl: "https://www.pexels.com/video/fitz-roy-el-chalten-santa-cruz-argentina-19906163/",
  },
  {
    theme: "faith",
    id: "internal-34142319",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 15,
    thumbUrl: "https://images.pexels.com/videos/34142319/4k-sunrise-timelapse-atmospheric-sunrise-video-breathtaking-sunrise-timelapse-cinematic-foggy-34142319.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/34142319/14476177_720_1280_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/34142319/14476178_1080_1920_60fps.mp4",
    author: { name: "Rec Everywhere", url: "https://www.pexels.com/@receverywhere" },
    sourceUrl: "https://www.pexels.com/video/cinematic-timelapse-of-misty-morning-sunrise-34142319/",
  },
  {
    theme: "gratitude",
    id: "internal-28925348",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 22,
    thumbUrl: "https://images.pexels.com/videos/28925348/bandung-indonesia-28925348.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/28925348/12518796_720_1280_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/28925348/12518797_1080_1920_60fps.mp4",
    author: { name: "Haydan As-soendawy", url: "https://www.pexels.com/@haydan-as-soendawy-730525" },
    sourceUrl: "https://www.pexels.com/video/serene-sunset-over-verdant-landscape-28925348/",
  },
  {
    theme: "god",
    id: "internal-38735389",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 19,
    thumbUrl: "https://images.pexels.com/videos/38735389/aesthetic-sky-airy-sky-38735389.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/38735389/16456564_720_1280_25fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/38735389/16456565_1080_1920_25fps.mp4",
    author: { name: "Saurabh Srivastava", url: "https://www.pexels.com/@saurabh-srivastava-2141236" },
    sourceUrl: "https://www.pexels.com/video/dramatic-cloudy-sky-at-twilight-38735389/",
  },
  {
    theme: "wisdom",
    id: "internal-17820965",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 13,
    thumbUrl: "https://images.pexels.com/videos/17820965/pexels-photo-17820965.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/17820965/17820965-hd_720_1280_24fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/17820965/17820965-hd_1080_1920_24fps.mp4",
    author: { name: "Dmitry Marchenkov", url: "https://www.pexels.com/@electrotrack" },
    sourceUrl: "https://www.pexels.com/video/a-forest-with-trees-and-sun-shining-through-17820965/",
  },
  {
    theme: "protection",
    id: "internal-31750686",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 20,
    thumbUrl: "https://images.pexels.com/videos/31750686/pexels-photo-31750686.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/31750686/13527350_720_1280_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/31750686/13527351_1080_1920_30fps.mp4",
    author: { name: "Teju", url: "https://www.pexels.com/@teju-215592370" },
    sourceUrl: "https://www.pexels.com/video/peaceful-view-of-blue-sky-and-forest-canopy-31750686/",
  },
  {
    theme: "love",
    id: "internal-12555093",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 16,
    thumbUrl: "https://images.pexels.com/videos/12555093/cornflower-cornflowers-field-rye-field-12555093.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/12555093/12555093-hd_720_1280_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/12555093/12555093-hd_1080_1920_60fps.mp4",
    author: { name: "Марія Горлова", url: "https://www.pexels.com/@205952205" },
    sourceUrl: "https://www.pexels.com/video/landscape-nature-field-summer-12555093/",
  },
  {
    theme: "prayer",
    id: "internal-35626509",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 17,
    thumbUrl: "https://images.pexels.com/videos/35626509/pexels-photo-35626509.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/35626509/15097838_720_1280_60fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/35626509/15097840_1080_1920_60fps.mp4",
    author: { name: "Asad  Ansari", url: "https://www.pexels.com/@saydoublea" },
    sourceUrl: "https://www.pexels.com/video/dramatic-sunset-with-rays-breaking-through-clouds-35626509/",
  },
  {
    theme: "purpose",
    id: "internal-17997222",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 13,
    thumbUrl: "https://images.pexels.com/videos/17997222/pexels-photo-17997222.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/17997222/17997222-hd_720_1280_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/17997222/17997222-hd_1080_1920_30fps.mp4",
    author: { name: "Adil Khan Marwat", url: "https://www.pexels.com/@adil-khan-marwat-407278438" },
    sourceUrl: "https://www.pexels.com/video/a-road-is-winding-through-a-valley-17997222/",
  },
  {
    theme: "overcoming",
    id: "internal-20642628",
    providerId: "internal",
    width: 1080,
    height: 1920,
    durationSec: 18,
    thumbUrl: "https://images.pexels.com/videos/20642628/alanya-beach-cleopatra-clouds-20642628.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=630",
    previewUrl: "https://videos.pexels.com/video-files/20642628/20642628-hd_720_1280_30fps.mp4",
    downloadUrl: "https://videos.pexels.com/video-files/20642628/20642628-hd_1080_1920_30fps.mp4",
    author: { name: "Arthur Shuraev", url: "https://www.pexels.com/@arthur-shuraev-67501761" },
    sourceUrl: "https://www.pexels.com/video/alanya-20642628/",
  },
];

/** Todos os clipes da biblioteca, sem filtro de tema. */
export const INTERNAL_CLIPS: ReadonlyArray<ReelVideo> = CLIPS;

export class InternalVideoProvider implements VideoProvider {
  readonly id = "internal";
  readonly label = "Biblioteca Bíblia Online";

  /** Nunca indisponível — é justamente o que garante que a página funcione. */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Recebe o ID do tema, não a query em inglês: a biblioteca é pequena demais
   * para uma busca textual fazer sentido. O clipe do tema pedido vem primeiro,
   * o resto entra em seguida para a galeria não ficar com um item só.
   */
  async search(themeOrQuery: string, options: SearchOptions): Promise<ReelVideo[]> {
    const theme: ThemeId | null = isThemeId(themeOrQuery) ? themeOrQuery : null;

    const matching = theme ? CLIPS.filter((c) => c.theme === theme) : [];
    const rest = CLIPS.filter((c) => !matching.includes(c));

    const pool = [...matching, ...rest].filter(
      (c) => c.durationSec >= options.minDurationSec,
    );
    if (pool.length === 0) return [];

    // O acervo tem uma dúzia de clipes, bem menos que uma página cheia. Paginar
    // cortando o fim deixaria o "Ver outros" sem efeito — foi o que acontecia.
    // Rotacionar faz o botão circular pela biblioteca em vez de repetir sempre
    // os mesmos primeiros itens.
    const offset = (Math.max(0, options.page - 1) * options.limit) % pool.length;
    return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, options.limit);
  }
}
