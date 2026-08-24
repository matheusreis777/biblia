import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, AudioLines, BookOpen, CheckCircle2, Film, Palette, Ruler, Star, Type,
} from "lucide-react";

import {
  AudioStep,
  type MusicSettings,
  type NarrationSettings,
} from "@/components/reels/AudioStep";
import { ContentStep, type ContentType } from "@/components/reels/ContentStep";
import { ReelsGenerateButton, type ReelsWarning } from "@/components/reels/ReelsGenerateButton";
import { ReelsPreview } from "@/components/reels/ReelsPreview";
import { ReelsStudio, type StudioSection } from "@/components/reels/ReelsStudio";
import { ReelsSummary } from "@/components/reels/ReelsSummary";
import { StyleStep } from "@/components/reels/StyleStep";
import { ThemeStep } from "@/components/reels/ThemeStep";
import { useMusic } from "@/components/reels/useMusic";
import { useNarration, useVoices } from "@/components/reels/useNarration";
import { useQuotes } from "@/components/reels/useQuotes";
import { useReelMeasurer } from "@/components/reels/useReelMeasurer";
import { useReelRender } from "@/components/reels/useReelRender";
import type { Verse } from "@/components/reels/VerseStep";
import { VideoGallery } from "@/components/reels/VideoGallery";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Toggle } from "@/components/ui/Field";
import { layoutReel } from "@/reels/layout";
import { applyOverrides, STYLES, type StyleOverrides } from "@/reels/styles";
import { detectTheme } from "@/reels/themes";
import { TIMING } from "@/reels/timing";
import type { LayoutResult, ReelVideo, StyleId, ThemeId } from "@/reels/types";

// ─── Estúdio de Reels ─────────────────────────────────────────────────────────
// Fluxo: conteúdo → tema → vídeo → texto → áudio → finalização.
//
// O preview não é ilustrativo: renderiza o mesmo LayoutResult que o servidor
// rasteriza para dentro do vídeo, com as mesmas fontes e coordenadas. Ver
// src/components/reels/PhonePreview.tsx.
//
// Esta página é só estado e composição. O arranjo visual — duas colunas no
// desktop, preview fixo no topo com abas no mobile — mora em ReelsStudio.

/** Assinatura do rodapé, por tipo de conteúdo. */
const DEFAULT_BRANDING: Record<ContentType, string> = {
  verse: "Bíblia Online",
  quote: "Under Control",
};

const DEFAULT_SITE = "matheusreis.dev";
const DEFAULT_DURATION_SEC = 15;

export default function ReelsPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const [contentType, setContentType] = useState<ContentType>("verse");
  // A assinatura acompanha o tipo de conteúdo, mas uma edição manual vence e
  // sobrevive à troca de aba. Derivado em vez de sincronizado por efeito, pelo
  // mesmo motivo do tema: setState dentro de efeito dispara renderização em
  // cascata.
  const [brandingEdit, setBrandingEdit] = useState<string | null>(null);
  const [siteText, setSiteText] = useState(DEFAULT_SITE);

  // Versículo vindo do leitor ("Criar Reel" na barra de ações do versículo).
  // Semeia o estado INICIAL em vez de entrar por efeito: assim o
  // `startedWithContent` do VerseStep enxerga que já há conteúdo e não busca o
  // versículo do dia por cima do que a pessoa acabou de escolher.
  const [verse, setVerse] = useState<Verse | null>(() => {
    const text = searchParams.get("text");
    return text ? { text, reference: searchParams.get("ref") ?? "" } : null;
  });

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
  const selectedTrack = music.tracks.find((tr) => tr.id === musicSettings.trackId) ?? null;

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

  // ── Avisos ──────────────────────────────────────────────────────────────
  // Reunidos aqui e entregues ao botão de gerar: é junto do botão que eles
  // importam. Avisar que a narração vai ser cortada no alto da página, longe da
  // ação, não muda a decisão de ninguém.
  const warnings: ReelsWarning[] = [];
  if (fontError) warnings.push({ message: t("reels.font_error", { message: fontError }) });
  if (tooLong) warnings.push({ message: t("reels.warning_too_long") });
  if (narrationOverflowSec > 0) {
    // A narração seria cortada pelo `-t` do FFmpeg. Avisa e sugere a duração
    // necessária, mas não bloqueia a geração.
    const target = Math.min(30, Math.ceil(narrationEndsAt ?? durationSec));
    warnings.push({
      message: t("reels.warning_narration_overflow", {
        seconds: narrationOverflowSec.toFixed(1),
      }),
      fix: {
        label: t("reels.warning_narration_fix", { seconds: target }),
        onClick: () => setDurationSec(target),
      },
    });
  }

  // ── Seções ──────────────────────────────────────────────────────────────
  const locked = !verse;

  const sections: StudioSection[] = [
    {
      id: "content",
      label: t("reels.step_content"),
      hint: t("reels.step_content_hint"),
      icon: BookOpen,
      node: (
        <ContentStep
          contentType={contentType}
          onContentTypeChange={setContentType}
          content={verse}
          onContentChange={setVerse}
          quotes={quotes}
          theme={theme}
          onThemeChange={selectTheme}
        />
      ),
    },
    {
      id: "theme",
      label: t("reels.step_theme"),
      hint: t("reels.step_theme_hint"),
      icon: Palette,
      disabled: locked,
      node: (
        <ThemeStep
          selected={theme}
          detected={contentType === "verse" ? detectedTheme : null}
          onSelect={selectTheme}
        />
      ),
    },
    {
      id: "video",
      label: t("reels.step_video"),
      hint: t("reels.step_video_hint"),
      icon: Film,
      disabled: locked,
      node: <VideoGallery theme={theme} selected={video} onSelect={selectVideo} />,
    },
    {
      id: "style",
      label: t("reels.step_style"),
      hint: t("reels.step_style_hint"),
      icon: Type,
      disabled: locked,
      node: (
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
      ),
    },
    {
      id: "audio",
      label: t("reels.step_audio"),
      hint: t("reels.step_audio_hint"),
      icon: AudioLines,
      disabled: locked,
      node: (
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
      ),
    },
    {
      id: "review",
      label: t("reels.step_review"),
      hint: t("reels.step_review_hint"),
      icon: CheckCircle2,
      disabled: locked,
      node: (
        <ReelsSummary
          reference={verse?.reference ?? ""}
          verseText={verse?.text ?? ""}
          theme={theme}
          styleId={styleId}
          videoAuthor={video?.author.name ?? null}
          narrationEnabled={narrationSettings.enabled}
          voiceLabel={voices.voices.find((v) => v.id === effectiveVoiceId)?.label ?? null}
          musicLabel={musicSettings.enabled ? (selectedTrack?.title ?? null) : null}
          durationSec={durationSec}
        />
      ),
    },
  ];

  return (
    <AppShell
      // O rodapé sai daqui: no mobile a barra fixa de gerar ocupa o fim da tela,
      // e no desktop o crédito competiria com a coluna do preview.
      footer={false}
      header={
        <AppHeader
          containerClassName="max-w-6xl"
          mobileTitle={t("reels.title")}
          mobileLead={
            <Link
              to="/"
              aria-label={t("reels.back_to_bible")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </Link>
          }
          nav={
            <span className="font-heading text-sm font-semibold text-muted-foreground">
              {t("reels.title")}
            </span>
          }
          links={[
            { to: "/", label: t("reels.back_to_bible"), icon: BookOpen },
            { to: "/favoritos", label: t("favorites.title"), icon: Star },
          ]}
        />
      }
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <header className="mb-8 hidden lg:block">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{t("reels.title")}</h1>
          <p className="mt-2 max-w-2xl font-body text-sm leading-relaxed text-muted-foreground">
            {t("reels.subtitle")}
          </p>
        </header>

        <ReelsStudio
          sections={sections}
          preview={(boxClassName) => (
            <ReelsPreview
              className={boxClassName}
              layout={layout}
              videoUrl={video?.previewUrl ?? null}
              posterUrl={video?.thumbUrl ?? null}
              animationKey={animationKey}
              showSafeArea={showSafeArea}
              narrationUrl={narration.url}
              soundOn={soundOn}
              onToggleSound={setSoundOn}
            />
          )}
          aside={
            <>
              <div className="flex items-center justify-center gap-2">
                <Ruler size={12} className="text-muted-foreground" />
                <Toggle
                  checked={showSafeArea}
                  onChange={setShowSafeArea}
                  label={t("reels.show_safe_area")}
                />
              </div>

              {video && (
                <p className="text-center font-body text-[10px] text-muted-foreground">
                  {t("reels.video_credit")}{" "}
                  <a
                    href={video.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/70 underline underline-offset-2 transition-colors hover:text-primary"
                  >
                    {video.author.name}
                  </a>
                </p>
              )}
            </>
          }
          generate={(compact) => (
            <ReelsGenerateButton
              render={render}
              canGenerate={canGenerate}
              onGenerate={generate}
              onReset={reset}
              downloadName={downloadName}
              withNarration={narrationSettings.enabled}
              withMusic={musicSettings.enabled && selectedTrack !== null}
              warnings={warnings}
              compact={compact}
            />
          )}
        />
      </div>
    </AppShell>
  );
}
