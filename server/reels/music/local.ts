import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  type MusicProvider,
  type MusicSearchOptions,
  type MusicTrack,
} from "./types";

// ─── Pasta local ──────────────────────────────────────────────────────────────
// Último elo da cadeia: os arquivos que estiverem em public/music/.
//
// A pasta nasce vazia de propósito. Não há uma fonte de música livre de
// direitos com API pública e estável para curar uma biblioteca fixa como foi
// feito com os vídeos — o Free Music Archive saiu do ar e o Pixabay não
// documenta o endpoint de áudio. Em vez de fixar links que podem morrer, esta
// pasta deixa você colocar as faixas que quiser.
//
// Os arquivos são servidos estaticamente em /music/<arquivo>, então o preview
// no browser toca direto. No render, resolveLocalTrackPath() converte a URL de
// volta para o caminho em disco, sem passar por HTTP.

const EXTENSIONS = [".mp3", ".m4a", ".ogg", ".wav"];

/** Caminho público (URL) e caminho em disco vivem juntos aqui. */
export const MUSIC_URL_PREFIX = "/music/";

function musicDir(): string {
  return join(process.cwd(), "public", "music");
}

/**
 * Duração não é lida do arquivo: exigiria ffprobe, que o ffmpeg-static não
 * traz. Zero significa "desconhecida", e o filtro de duração mínima é pulado
 * para as faixas locais — quem colocou o arquivo sabe o que colocou.
 */
function toTrack(fileName: string): MusicTrack {
  return {
    id: `local-${fileName}`,
    providerId: "local",
    title: fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    artist: "Arquivo local",
    durationSec: 0,
    audioUrl: MUSIC_URL_PREFIX + encodeURIComponent(fileName),
    sourceUrl: MUSIC_URL_PREFIX + encodeURIComponent(fileName),
    attribution: null,
    license: "Arquivo local",
  };
}

export class LocalMusicProvider implements MusicProvider {
  readonly id = "local";
  readonly label = "Pasta local";

  isAvailable(): boolean {
    return existsSync(musicDir());
  }

  async search(_query: string, options: MusicSearchOptions): Promise<MusicTrack[]> {
    const dir = musicDir();
    if (!existsSync(dir)) return [];

    return readdirSync(dir)
      .filter((f) => EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)))
      .filter((f) => statSync(join(dir, f)).isFile())
      .sort()
      .slice(0, options.limit)
      .map(toTrack);
  }
}

/**
 * Caminho em disco de uma faixa local, ou `null` se a URL não for local.
 *
 * Rejeita qualquer coisa com separador de caminho depois do prefixo: sem essa
 * checagem, uma URL como /music/../../.env leria arquivos fora da pasta.
 */
export function resolveLocalTrackPath(audioUrl: string): string | null {
  if (!audioUrl.startsWith(MUSIC_URL_PREFIX)) return null;

  const fileName = decodeURIComponent(audioUrl.slice(MUSIC_URL_PREFIX.length));
  if (!fileName || /[/\\]/.test(fileName) || fileName.includes("..")) return null;
  if (!EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext))) return null;

  const path = join(musicDir(), fileName);
  return existsSync(path) ? path : null;
}
