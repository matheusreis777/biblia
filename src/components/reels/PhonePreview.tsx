import { useEffect, useMemo, useRef } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { fontFamilyName } from "@/reels/fonts";
import { SAFE_AREA } from "@/reels/safeArea";
import { renderLayers } from "@/reels/svg";
import { TIMING } from "@/reels/timing";
import type { LayoutResult, TextBlock } from "@/reels/types";

// ─── Preview ──────────────────────────────────────────────────────────────────
// Não é uma maquete: desenha o MESMO LayoutResult que o servidor rasteriza para
// o vídeo, com as mesmas fontes e nas mesmas coordenadas.
//
// A composição é montada em tamanho real (1080x1920) e reduzida por transform
// scale. Assim as posições vindas do layout entram em px, sem conversão — que
// é onde apareceria divergência entre o preview e o MP4.
//
// Divisão proposital entre as camadas:
//   • o escurecimento vem do MESMO SVG que vai para o render, embutido como
//     data URI — gradiente idêntico, sem duplicar as paradas de cor em CSS;
//   • o texto é DOM de verdade, porque um SVG usado como imagem não enxerga as
//     @font-face da página e sairia com fonte de fallback.

interface PhonePreviewProps {
  layout: LayoutResult;
  videoUrl: string | null;
  posterUrl: string | null;
  /** Largura do preview em px. A composição é escalada a partir de 1080. */
  width: number;
  /** Reinicia as animações quando muda — troque a cada ajuste do usuário. */
  animationKey: string | number;
  showSafeArea: boolean;
  /** Narração já sintetizada, ou `null` quando desligada. */
  narrationUrl: string | null;
  /** Som ligado no preview. Começa desligado: autoplay com áudio é bloqueado. */
  soundOn: boolean;
  onToggleSound: (on: boolean) => void;
}

function svgDataUri(svg: string): string {
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

function TextLayer({
  block,
  delay,
  duration,
  rise,
}: {
  block: TextBlock;
  delay: number;
  duration: number;
  /** Só o versículo sobe ao aparecer — no render, a camada da referência e do
   *  branding entra com `overlay=0:0`, sem deslocamento. */
  rise: boolean;
}) {
  return (
    <div
      className={rise ? "absolute reel-fade-up" : "absolute reel-fade"}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        fontFamily: `"${fontFamilyName(block.fontId, block.fontWeight)}"`,
        fontSize: block.fontSizePx,
        lineHeight: `${block.lineHeightPx}px`,
        letterSpacing: `${block.letterSpacingPx}px`,
        color: block.color,
        opacity: block.opacity,
        textAlign: block.align,
        // O texto é desenhado sobre vídeo: a sombra é o que garante contraste
        // quando uma nuvem clara passa atrás de uma linha. Mesmos valores do
        // feDropShadow em src/reels/svg.ts.
        textShadow: `0 ${block.fontSizePx * 0.03}px ${block.fontSizePx * 0.28}px rgba(0,0,0,0.55)`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        ["--reel-rise" as string]: `${TIMING.verseRisePx}px`,
      }}
    >
      {block.lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

export function PhonePreview({
  layout,
  videoUrl,
  posterUrl,
  width,
  animationKey,
  showSafeArea,
  narrationUrl,
  soundOn,
  onToggleSound,
}: PhonePreviewProps) {
  const scale = width / layout.width;
  const height = layout.height * scale;
  const audioRef = useRef<HTMLAudioElement>(null);

  // A narração entra em TIMING.narrationStart, o mesmo instante que o FFmpeg
  // usa no `adelay` — é o que faz o preview mostrar a sincronia real entre o
  // texto aparecendo e a voz começando.
  //
  // Depende de `animationKey` porque é ela que reinicia as animações de texto:
  // sem isso, o áudio e o texto sairiam de fase a cada ajuste.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    if (!soundOn || !narrationUrl) return;

    const timer = setTimeout(() => {
      // O browser pode recusar a reprodução; ignorar é o certo, o preview
      // visual continua funcionando.
      void audio.play().catch(() => {});
    }, TIMING.narrationStart * 1000);

    return () => {
      clearTimeout(timer);
      audio.pause();
    };
  }, [animationKey, soundOn, narrationUrl]);

  // Só o escurecimento precisa virar SVG; regerá-lo a cada quadro do slider de
  // intensidade seria desperdício.
  const scrimUri = useMemo(
    () => svgDataUri(renderLayers(layout).scrim),
    [layout],
  );

  return (
    <div
      className="relative rounded-[2rem] overflow-hidden border border-border bg-black shadow-2xl shadow-black/60"
      style={{ width, height }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}
      >
        {videoUrl ? (
          <video
            key={videoUrl}
            src={videoUrl}
            poster={posterUrl ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-muted/30 flex items-center justify-center">
            <span className="text-muted-foreground text-[32px] font-body">
              Escolha um vídeo de fundo
            </span>
          </div>
        )}

        <div
          key={`scrim-${animationKey}`}
          className="absolute inset-0 reel-fade"
          style={{
            backgroundImage: scrimUri,
            backgroundSize: "100% 100%",
            animationDuration: `${TIMING.scrimFadeIn}s`,
          }}
        />

        <div key={`verse-${animationKey}`}>
          <TextLayer
            block={layout.verse}
            delay={TIMING.verseStart}
            duration={TIMING.verseFade}
            rise
          />
        </div>

        <div key={`meta-${animationKey}`}>
          {layout.reference && (
            <TextLayer
              block={layout.reference}
              delay={TIMING.metaStart}
              duration={TIMING.metaFade}
              rise={false}
            />
          )}
          {layout.branding && (
            <TextLayer
              block={layout.branding}
              delay={TIMING.metaStart}
              duration={TIMING.metaFade}
              rise={false}
            />
          )}
        </div>

        {showSafeArea && (
          <div
            className="absolute border-2 border-dashed border-primary/70 pointer-events-none"
            style={{
              left: SAFE_AREA.left,
              top: SAFE_AREA.top,
              right: SAFE_AREA.right,
              bottom: SAFE_AREA.bottom,
            }}
          />
        )}
      </div>

      {/* Fica fora do contêiner escalado: um botão dentro do transform sairia
          minúsculo junto com o resto da composição. */}
      {narrationUrl && (
        <button
          type="button"
          onClick={() => onToggleSound(!soundOn)}
          title={soundOn ? "Silenciar prévia" : "Ouvir a narração"}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-white/85 hover:text-white hover:bg-black/75 transition-colors active:scale-95"
        >
          {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>
      )}

      <audio ref={audioRef} src={narrationUrl ?? undefined} preload="auto" />
    </div>
  );
}
