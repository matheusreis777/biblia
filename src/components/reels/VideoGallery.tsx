import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelVideo, ThemeId } from "@/reels/types";

// ─── Passo 3: o vídeo de fundo ────────────────────────────────────────────────
// Busca no /api/reels/videos, que esconde as chaves das APIs e já aplica os
// filtros de qualidade (portrait, altura mínima, duração mínima).
//
// Os cartões tocam o clipe ao passar o mouse: uma miniatura estática não diz
// se o movimento do vídeo combina com o versículo, que é a decisão real aqui.

interface VideosResponse {
  videos: ReelVideo[];
  providers: string[];
  error?: string;
}

function VideoCard({
  video,
  selected,
  onSelect,
}: {
  video: ReelVideo;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => void ref.current?.play().catch(() => {})}
      onMouseLeave={() => {
        ref.current?.pause();
        if (ref.current) ref.current.currentTime = 0;
      }}
      className={cn(
        "relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all group active:scale-95",
        selected
          ? "border-primary shadow-lg shadow-primary/20"
          : "border-border hover:border-primary/40",
      )}
    >
      <video
        ref={ref}
        src={video.previewUrl}
        poster={video.thumbUrl}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5 text-left">
        <span className="block text-[9px] text-white/70 font-body truncate">
          {video.author.name}
        </span>
      </span>

      {selected && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check size={12} className="text-primary-foreground" />
        </span>
      )}
    </button>
  );
}

export function VideoGallery({
  theme,
  selected,
  onSelect,
}: {
  theme: ThemeId;
  selected: ReelVideo | null;
  onSelect: (video: ReelVideo) => void;
}) {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<ReelVideo[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Sempre que o tema muda, a galeria recomeça da primeira página.
  useEffect(() => {
    setPage(1);
  }, [theme]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(`/api/reels/videos?theme=${theme}&page=${page}&limit=12`)
      .then(async (res) => {
        const data = (await res.json()) as VideosResponse;
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        return data;
      })
      .then((data) => {
        if (!active) return;
        setVideos(data.videos);
        setProviders(data.providers);
        // Seleciona o primeiro automaticamente: o usuário quase sempre quer
        // um vídeo qualquer do tema, e assim o preview já nasce completo.
        if (data.videos.length > 0) onSelect(data.videos[0]);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // onSelect é estável no chamador; incluí-lo recarregaria a galeria a cada
    // render do pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, page]);

  return (
    <div className="space-y-3">
      {loading && videos.length === 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive font-body">{error}</p>
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              selected={selected?.id === video.id}
              onSelect={() => onSelect(video)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-muted-foreground font-body">
          {providers.length > 0 && t("reels.gallery_credit", { providers: providers.join(", ") })}
        </p>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group disabled:opacity-40 shrink-0"
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin text-primary" />
          ) : (
            <RefreshCw size={13} className="text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-foreground/80">
            {t("reels.gallery_more")}
          </span>
        </button>
      </div>
    </div>
  );
}
