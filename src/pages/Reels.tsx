import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle, BookOpen, Download, Film, Globe, Loader2, Ruler, RotateCcw, Sparkles,
} from "lucide-react";

import {
  AudioStep,
  type MusicSettings,
  type NarrationSettings,
} from "@/components/reels/AudioStep";
import { ContentStep, type ContentType } from "@/components/reels/ContentStep";
import { PhonePreview } from "@/components/reels/PhonePreview";
import { RenderProgress } from "@/components/reels/RenderProgress";
import { StyleStep } from "@/components/reels/StyleStep";
import { ThemeStep } from "@/components/reels/ThemeStep";
import { useMusic } from "@/components/reels/useMusic";
import { useNarration, useVoices } from "@/components/reels/useNarration";
import { useQuotes } from "@/components/reels/useQuotes";
import { useReelMeasurer } from "@/components/reels/useReelMeasurer";
import { useReelRender } from "@/components/reels/useReelRender";
import type { Verse } from "@/components/reels/VerseStep";
import { VideoGallery } from "@/components/reels/VideoGallery";
import { Step, Toggle } from "@/components/reels/ui";
import { layoutReel } from "@/reels/layout";
import { applyOverrides, STYLES, type StyleOverrides } from "@/reels/styles";
import { detectTheme } from "@/reels/themes";
import { TIMING } from "@/reels/timing";
import type { LayoutResult, ReelVideo, StyleId, ThemeId } from "@/reels/types";

// ─── Gerador de Reels ─────────────────────────────────────────────────────────
// Fluxo: versículo → tema → vídeo → estilo → gerar.
//
// O preview à direita não é ilustrativo: renderiza o mesmo LayoutResult que o
// servidor rasteriza para dentro do vídeo, com as mesmas fontes e coordenadas.
// Ver src/components/reels/PhonePreview.tsx.

/** Assinatura do rodapé, por tipo de conteúdo. */
const DEFAULT_BRANDING: Record<ContentType, string> = {
  verse: "Bíblia Online",
  quote: "Under Control",
};

const DEFAULT_SITE = "matheusreis.dev";
const DEFAULT_DURATION_SEC = 15;

export default function ReelsPage() {
  const { t, i18n } = useTranslation();

  const [contentType, setContentType] = useState<ContentType>("verse");
  // A assinatura acompanha o tipo de conteúdo, mas uma edição manual vence e
  // sobrevive à troca de aba. Derivado em vez de sincronizado por efeito, pelo
  // mesmo motivo do tema: setState dentro de efeito dispara renderização em
  // cascata.
  const [brandingEdit, setBrandingEdit] = useState<string | null>(null);
  const [siteText, setSiteText] = useState(DEFAULT_SITE);
  const [verse, setVerse] = useState<Verse | null>(null);
  const [video, setVideo] = useState<ReelVideo | null>(null);
  const [styleId, setStyleId] = useState<StyleId>("classic");
  const [overrides, setOverrides] = useState<StyleOverrides>({});
  const [durationSec, setDurationSec] = useState(DEFAULT_DURATION_SEC);
  const [showSafeArea, setShowSafeArea] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  const [narrationSettings, setNarrationSettings] = useState<NarrationSettings>({
    // Ligada por padrão: é o ponto da funcionalidade. Desligar continua a um
    // clique, e o vídeo volta a sair exatamente como saía antes.
    enabled: true,
    voiceId: "",
    rate: 0.95,
    includeReference: true,
  });

  const [musicSettings, setMusicSettings] = useState<MusicSettings>({
    enabled: false,
    mood: "calm",
    trackId: null,
    gain: 0.22,
  });

  const { measurer, error: fontError } = useReelMeasurer();
  const { state: render, start, reset } = useReelRender();
  const voices = useVoices();
  const music = useMusic(musicSettings.mood, musicSettings.enabled);
  const selectedTrack = music.tracks.find((t) => t.id === musicSettings.trackId) ?? null;

  // ── Tema ────────────────────────────────────────────────────────────────
  // O papel do tema INVERTE entre os dois modos:
  //
  //   Versículo — é DETECTADO do texto, e o usuário pode sobrescrever. A
  //     escolha manual fica guardada junto do versículo a que se refere, então
  //     trocar de versículo volta à detecção automática sem precisar de um
  //     efeito sincronizando estado.
  //   Frase — é o FILTRO que escolhe as frases, então é estado explícito.
  //     Detectar do texto aqui seria circular.
  //
  // Nos dois casos é o mesmo tema que alimenta a busca de vídeo.
  const [themeChoice, setThemeChoice] = useState<{ forVerse: string; theme: ThemeId } | null>(null);
  const [quoteTheme, setQuoteTheme] = useState<ThemeId>("purpose");

  const verseText = verse?.text ?? "";

  const detectedTheme = useMemo(
    () => (verseText ? detectTheme(verseText, i18n.language).id : null),
    [verseText, i18n.language],
  );

  const theme: ThemeId =
    contentType === "quote"
      ? quoteTheme
      : themeChoice && themeChoice.forVerse === verseText
        ? themeChoice.theme
        : (detectedTheme ?? "peace");

  const selectTheme = useCallback(
    (next: ThemeId) => {
      if (contentType === "quote") setQuoteTheme(next);
      else setThemeChoice({ forVerse: verseText, theme: next });
    },
    [contentType, verseText],
  );

  const quotes = useQuotes(quoteTheme, i18n.language, contentType === "quote");

  const brandingText = brandingEdit ?? DEFAULT_BRANDING[contentType];

  const patchOverrides = useCallback((patch: StyleOverrides) => {
    setOverrides((prev) => ({ ...prev, ...patch }));
  }, []);

  // Trocar de preset descarta os ajustes: eles foram feitos em cima de outra
  // composição e quase nunca fazem sentido na nova.
  const changeStyle = useCallback((id: StyleId) => {
    setStyleId(id);
    setOverrides({});
  }, []);

  const selectVideo = useCallback((next: ReelVideo) => setVideo(next), []);

  const patchNarration = useCallback((patch: Partial<NarrationSettings>) => {
    setNarrationSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchMusic = useCallback((patch: Partial<MusicSettings>) => {
    setMusicSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Voz efetiva ─────────────────────────────────────────────────────────
  // Derivada, não sincronizada por efeito: a lista chega do servidor depois da
  // primeira renderização, e escolher a inicial dentro de um useEffect
  // dispararia renderização em cascata.
  const voicePrefix = i18n.language.startsWith("pt") ? "pt" : "en";
  const effectiveVoiceId =
    narrationSettings.voiceId ||
    voices.voices.find((v) => v.language.startsWith(voicePrefix))?.id ||
    voices.voices[0]?.id ||
    "";

  const narration = useNarration({
    enabled: narrationSettings.enabled,
    verseText: verse?.text ?? "",
    reference: verse?.reference ?? "",
    includeReference: narrationSettings.includeReference,
    voiceId: effectiveVoiceId,
    rate: narrationSettings.rate,
    language: i18n.language,
    contentType,
  });

  // A narração começa em TIMING.narrationStart, então o que precisa caber é o
  // início mais a duração da fala. Foi decidido avisar, não esticar o vídeo.
  const narrationEndsAt =
    narration.durationSec !== null ? TIMING.narrationStart + narration.durationSec : null;
  const narrationOverflowSec =
    narrationEndsAt !== null ? Math.max(0, narrationEndsAt - durationSec) : 0;

  const layout: LayoutResult | null = useMemo(() => {
    if (!measurer || !verse?.text) return null;
    return layoutReel(
      {
        verseText: verse.text,
        reference: verse.reference,
        style: applyOverrides(STYLES[styleId], overrides),
        brandingText,
        siteText,
        durationSec,
      },
      measurer,
    );
  }, [measurer, verse, styleId, overrides, durationSec, brandingText, siteText]);

  const tooLong = layout?.notes.some((n) => n.kind === "textTooLong") ?? false;
  const canGenerate = Boolean(layout && video) && render.phase !== "running";

  const generate = () => {
    if (!verse || !video) return;
    void start({
      verseText: verse.text,
      reference: verse.reference,
      styleId,
      overrides: overrides as Record<string, unknown>,
      video: { downloadUrl: video.downloadUrl, previewUrl: video.previewUrl },
      durationSec,
      brandingText,
      siteText,
      motion: true,
      language: i18n.language,
      contentType,
      narration: {
        enabled: narrationSettings.enabled,
        voiceId: effectiveVoiceId,
        rate: narrationSettings.rate,
        includeReference: narrationSettings.includeReference,
      },
      music:
        musicSettings.enabled && selectedTrack
          ? { trackUrl: selectedTrack.audioUrl, gain: musicSettings.gain }
          : undefined,
    });
  };

  const downloadName = `reel-${(verse?.reference || "versiculo")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}.mp4`;

  // Reinicia as animações do preview a cada ajuste, para o usuário ver a
  // entrada do texto como ela vai aparecer no vídeo.
  const animationKey = `${styleId}-${JSON.stringify(overrides)}-${verse?.text ?? ""}-${video?.id ?? ""}`;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* ── Topbar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group shrink-0"
            title={t("reels.back_to_bible")}
          >
            <BookOpen size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-heading font-bold text-foreground/80 tracking-widest hidden xs:block uppercase">
              {t("reels.back_to_bible")}
            </span>
          </Link>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Film size={16} className="text-primary shrink-0" />
            <span className="text-xs font-heading font-bold uppercase tracking-wider truncate">
              {t("reels.title")}
            </span>
          </div>

          <button
            onClick={() => i18n.changeLanguage(i18n.language.startsWith("pt") ? "en-US" : "pt-BR")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group shrink-0"
          >
            <Globe size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/70 group-hover:text-primary">
              {i18n.language.startsWith("pt") ? "EN" : "PT"}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* ── Cabeçalho ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-semibold tracking-tight">
              {t("reels.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground font-body max-w-2xl leading-relaxed">
              {t("reels.subtitle")}
            </p>
          </div>
        </div>

        {fontError && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive font-body">
              {t("reels.font_error", { message: fontError })}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          {/* ── Passos ──────────────────────────────────────────────── */}
          <div className="space-y-4 min-w-0">
            <Step index={1} title={t("reels.step_content")} hint={t("reels.step_content_hint")}>
              <ContentStep
                contentType={contentType}
                onContentTypeChange={setContentType}
                content={verse}
                onContentChange={setVerse}
                quotes={quotes}
                theme={theme}
                onThemeChange={selectTheme}
              />
            </Step>

            <Step index={2} title={t("reels.step_theme")} hint={t("reels.step_theme_hint")} disabled={!verse}>
              <ThemeStep
                selected={theme}
                detected={contentType === "verse" ? detectedTheme : null}
                onSelect={selectTheme}
              />
            </Step>

            <Step index={3} title={t("reels.step_video")} hint={t("reels.step_video_hint")} disabled={!verse}>
              <VideoGallery theme={theme} selected={video} onSelect={selectVideo} />
            </Step>

            <Step index={4} title={t("reels.step_style")} hint={t("reels.step_style_hint")} disabled={!verse}>
              <StyleStep
                styleId={styleId}
                overrides={overrides}
                durationSec={durationSec}
                onStyle={changeStyle}
                onOverrides={patchOverrides}
                onDuration={setDurationSec}
                brandingText={brandingText}
                onBranding={setBrandingEdit}
                siteText={siteText}
                onSite={setSiteText}
              />
            </Step>

            <Step index={5} title={t("reels.step_audio")} hint={t("reels.step_audio_hint")} disabled={!verse}>
              <AudioStep
                settings={{ ...narrationSettings, voiceId: effectiveVoiceId }}
                onChange={patchNarration}
                voices={voices}
                narration={narration}
                language={i18n.language}
                music={music}
                musicSettings={musicSettings}
                onMusicChange={patchMusic}
              />
            </Step>
          </div>

          {/* ── Preview e geração ───────────────────────────────────── */}
          <aside className="lg:sticky lg:top-20 space-y-4">
            <div className="flex justify-center">
              {layout ? (
                <PhonePreview
                  layout={layout}
                  videoUrl={video?.previewUrl ?? null}
                  posterUrl={video?.thumbUrl ?? null}
                  width={288}
                  animationKey={animationKey}
                  showSafeArea={showSafeArea}
                  narrationUrl={narration.url}
                  soundOn={soundOn}
                  onToggleSound={setSoundOn}
                />
              ) : (
                <div className="w-72 aspect-[9/16] rounded-[2rem] border border-border bg-card flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Ruler size={12} className="text-muted-foreground" />
              <Toggle
                checked={showSafeArea}
                onChange={setShowSafeArea}
                label={t("reels.show_safe_area")}
              />
            </div>

            {tooLong && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <AlertTriangle size={13} className="text-destructive shrink-0 mt-0.5" />
                <p className="text-[11px] text-destructive font-body leading-snug">
                  {t("reels.warning_too_long")}
                </p>
              </div>
            )}

            {/* A narração seria cortada pelo `-t` do FFmpeg. Avisa e sugere a
                duração necessária, mas não bloqueia a geração. */}
            {narrationOverflowSec > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <AlertTriangle size={13} className="text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-[11px] text-destructive font-body leading-snug">
                    {t("reels.warning_narration_overflow", {
                      seconds: narrationOverflowSec.toFixed(1),
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDurationSec(Math.min(30, Math.ceil(narrationEndsAt ?? durationSec)))
                    }
                    className="text-[11px] font-heading font-bold uppercase tracking-wider text-primary hover:opacity-80 transition-opacity"
                  >
                    {t("reels.warning_narration_fix", {
                      seconds: Math.min(30, Math.ceil(narrationEndsAt ?? durationSec)),
                    })}
                  </button>
                </div>
              </div>
            )}

            <RenderProgress
              state={render}
              withNarration={narrationSettings.enabled}
              withMusic={musicSettings.enabled && selectedTrack !== null}
            />

            {render.phase === "done" && render.url ? (
              <div className="space-y-2">
                <a
                  href={render.url}
                  download={downloadName}
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-heading font-bold hover:opacity-90 transition-opacity active:scale-95"
                >
                  <Download size={16} />
                  {t("reels.download", {
                    size: ((render.bytes ?? 0) / 1024 / 1024).toFixed(1),
                  })}
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl border border-border text-xs font-heading font-bold text-foreground/80 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all active:scale-95"
                >
                  <RotateCcw size={13} />
                  {t("reels.generate_again")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={generate}
                disabled={!canGenerate}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-heading font-bold hover:opacity-90 transition-opacity active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
              >
                {render.phase === "running" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Film size={16} />
                )}
                {render.phase === "running" ? t("reels.generating") : t("reels.generate")}
              </button>
            )}

            {video && (
              <p className="text-[10px] text-center text-muted-foreground font-body">
                {t("reels.video_credit")}{" "}
                <a
                  href={video.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground/70 hover:text-primary transition-colors underline underline-offset-2"
                >
                  {video.author.name}
                </a>
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
