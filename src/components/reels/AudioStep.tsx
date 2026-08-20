import { useTranslation } from "react-i18next";
import { AlertTriangle, Check, Loader2, Mic, MicOff, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { Chip, FieldLabel, Slider, Toggle } from "./ui";
import type { MusicState, MusicTrack, Mood } from "./useMusic";
import { MOODS } from "./useMusic";
import type { NarrationState, ReelVoice, VoicesState } from "./useNarration";

// ─── Passo 5: áudio ───────────────────────────────────────────────────────────
// Narração do versículo. A lista de vozes vem do servidor, não é fixa aqui:
// as vozes locais do Windows existem na máquina do usuário e não existem no
// site publicado.

export interface NarrationSettings {
  enabled: boolean;
  voiceId: string;
  rate: number;
  includeReference: boolean;
}

export interface MusicSettings {
  enabled: boolean;
  mood: Mood;
  trackId: string | null;
  gain: number;
}

export function AudioStep({
  settings,
  onChange,
  voices,
  narration,
  language,
  music,
  musicSettings,
  onMusicChange,
}: {
  settings: NarrationSettings;
  onChange: (patch: Partial<NarrationSettings>) => void;
  voices: VoicesState;
  narration: NarrationState;
  language: string;
  music: MusicState;
  musicSettings: MusicSettings;
  onMusicChange: (patch: Partial<MusicSettings>) => void;
}) {
  const { t } = useTranslation();

  // Mostra primeiro as vozes do idioma da interface; as outras continuam
  // acessíveis, só que depois.
  const prefix = language.startsWith("pt") ? "pt" : "en";
  const sorted = [...voices.voices].sort((a, b) => {
    const aMatch = a.language.startsWith(prefix) ? 0 : 1;
    const bMatch = b.language.startsWith(prefix) ? 0 : 1;
    return aMatch - bMatch;
  });

  const selected = sorted.find((v) => v.id === settings.voiceId);

  return (
    <div className="space-y-5">
      <Toggle
        checked={settings.enabled}
        onChange={(v) => onChange({ enabled: v })}
        label={t("reels.audio_enable")}
      />

      {!settings.enabled && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground font-body">
          <MicOff size={12} className="shrink-0" />
          {t("reels.audio_disabled_hint")}
        </p>
      )}

      {settings.enabled && (
        <>
          {voices.loading && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground font-body">
              <Loader2 size={13} className="animate-spin text-primary" />
              {t("reels.audio_loading_voices")}
            </p>
          )}

          {voices.error && (
            <p className="text-xs text-destructive font-body">
              {t("reels.audio_voices_error", { message: voices.error })}
            </p>
          )}

          {sorted.length > 0 && (
            <div className="space-y-2">
              <FieldLabel>{t("reels.audio_voice")}</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {sorted.map((voice) => (
                  <Chip
                    key={voice.id}
                    active={voice.id === settings.voiceId}
                    onClick={() => onChange({ voiceId: voice.id })}
                    title={voice.note ?? `${voice.language} · ${voice.providerId}`}
                  >
                    {voice.label}
                  </Chip>
                ))}
              </div>
              {selected?.note && (
                <p className="text-[11px] text-muted-foreground font-body">{selected.note}</p>
              )}
            </div>
          )}

          <Slider
            label={t("reels.audio_rate")}
            value={settings.rate}
            min={0.7}
            max={1.3}
            step={0.05}
            onChange={(v) => onChange({ rate: v })}
            display={`${Math.round(settings.rate * 100)}%`}
          />

          <Toggle
            checked={settings.includeReference}
            onChange={(v) => onChange({ includeReference: v })}
            label={t("reels.audio_read_reference")}
          />

          <NarrationStatus narration={narration} voices={sorted} />
        </>
      )}

      <div className="h-px bg-border" />

      <MusicSection
        settings={musicSettings}
        onChange={onMusicChange}
        music={music}
        hasNarration={settings.enabled}
      />
    </div>
  );
}

// ─── Trilha ───────────────────────────────────────────────────────────────────

function MusicSection({
  settings,
  onChange,
  music,
  hasNarration,
}: {
  settings: MusicSettings;
  onChange: (patch: Partial<MusicSettings>) => void;
  music: MusicState;
  hasNarration: boolean;
}) {
  const { t } = useTranslation();
  const selected = music.tracks.find((track) => track.id === settings.trackId);

  // O clima só faz sentido com um provedor que busque por texto. Hoje só existe
  // a pasta local, que devolve os arquivos que houver e ignora a busca —
  // mostrar o seletor seria oferecer um controle que não faz nada.
  const hasSearchableProvider = music.providers.some((p) => p !== "local");

  return (
    <div className="space-y-4">
      <Toggle
        checked={settings.enabled}
        onChange={(v) => onChange({ enabled: v })}
        label={t("reels.music_enable")}
      />

      {settings.enabled && (
        <>
          {hasSearchableProvider && (
            <div className="space-y-2">
              <FieldLabel>{t("reels.music_mood")}</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                  <Chip
                    key={mood}
                    active={mood === settings.mood}
                    onClick={() => onChange({ mood, trackId: null })}
                  >
                    {t(`reels.mood_${mood}`)}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {music.loading && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground font-body">
              <Loader2 size={13} className="animate-spin text-primary" />
              {t("reels.music_loading")}
            </p>
          )}

          {music.error && (
            <p className="text-xs text-destructive font-body">
              {t("reels.music_error", { message: music.error })}
            </p>
          )}

          {/* Nenhum provedor configurado é o estado esperado no começo: o
              Pixabay e o Jamendo exigem chave, e a pasta local nasce vazia. */}
          {!music.loading && !music.error && music.tracks.length === 0 && (
            <p className="text-[11px] text-muted-foreground font-body leading-snug">
              {t("reels.music_empty")}
            </p>
          )}

          {music.tracks.length > 0 && (
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {music.tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  selected={track.id === settings.trackId}
                  onSelect={() => onChange({ trackId: track.id })}
                />
              ))}
            </div>
          )}

          {selected && (
            <>
              <Slider
                label={
                  hasNarration ? t("reels.music_gain_with_voice") : t("reels.music_gain")
                }
                value={settings.gain}
                min={0.05}
                max={0.6}
                step={0.01}
                onChange={(v) => onChange({ gain: v })}
                display={`${Math.round(settings.gain * 100)}%`}
              />

              {hasNarration && (
                <p className="text-[11px] text-muted-foreground font-body leading-snug">
                  {t("reels.music_ducking_hint")}
                </p>
              )}

              {/* Licença Creative Commons exige crédito; a do Pixabay não. */}
              {selected.attribution && (
                <p className="text-[11px] text-foreground/70 font-body leading-snug">
                  {t("reels.music_attribution", {
                    license: selected.license,
                    credit: selected.attribution,
                  })}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function TrackRow({
  track,
  selected,
  onSelect,
}: {
  track: MusicTrack;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
        selected ? "bg-primary/10" : "hover:bg-muted/40",
      )}
    >
      <span className="w-4 shrink-0">
        {selected ? (
          <Check size={13} className="text-primary" />
        ) : (
          <Music size={13} className="text-muted-foreground/50" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-xs font-body truncate",
            selected ? "text-primary" : "text-foreground/85",
          )}
        >
          {track.title}
        </span>
        <span className="block text-[10px] text-muted-foreground truncate">{track.artist}</span>
      </span>
      {track.durationSec > 0 && (
        <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
          {Math.floor(track.durationSec / 60)}:
          {String(Math.round(track.durationSec % 60)).padStart(2, "0")}
        </span>
      )}
    </button>
  );
}

function NarrationStatus({
  narration,
  voices,
}: {
  narration: NarrationState;
  voices: ReelVoice[];
}) {
  const { t } = useTranslation();

  if (narration.status === "loading") {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground font-body">
        <Loader2 size={13} className="animate-spin text-primary" />
        {t("reels.audio_synthesizing")}
      </p>
    );
  }

  if (narration.status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5">
        <AlertTriangle size={13} className="text-destructive shrink-0 mt-0.5" />
        <p className="text-[11px] text-destructive font-body leading-snug">
          {t("reels.audio_error", { message: narration.error })}
        </p>
      </div>
    );
  }

  if (narration.status !== "ready" || narration.durationSec === null) return null;

  const used = voices.find((v) => v.id === narration.voiceUsed);

  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-2 text-[11px] text-muted-foreground font-body">
        <Mic size={12} className="text-primary shrink-0" />
        {t("reels.audio_ready", { seconds: narration.durationSec.toFixed(1) })}
      </p>

      {/* A cadeia caiu para outro motor: o usuário precisa saber que a voz que
          vai ouvir não é a que escolheu. */}
      {narration.fellBack && (
        <p
          className={cn(
            "flex items-start gap-2 text-[11px] font-body leading-snug",
            "text-foreground/70",
          )}
        >
          <AlertTriangle size={12} className="text-primary shrink-0 mt-0.5" />
          {t("reels.audio_fellback", { voice: used?.label ?? narration.voiceUsed })}
        </p>
      )}
    </div>
  );
}
