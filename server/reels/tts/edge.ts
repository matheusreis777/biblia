import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

import {
  escapeSsml,
  type NarrationResult,
  type TtsProvider,
  type TtsVoice,
} from "./types.js";

// ─── Vozes neurais do Edge ────────────────────────────────────────────────────
// Usa o mesmo serviço por trás do "Ler em voz alta" do Microsoft Edge, através
// do pacote msedge-tts. Grátis e sem chave, com qualidade neural.
//
// RESSALVA IMPORTANTE: o endpoint não é documentado nem oferecido como API
// pública. Pode mudar, limitar ou bloquear sem aviso, e usá-lo
// programaticamente é área cinzenta dos termos da Microsoft. É exatamente por
// isso que existe o WindowsTtsProvider como queda — ver ./index.ts.
//
// O pacote só oferece MP3 e WebM/Opus (confirmado no enum OUTPUT_FORMAT: não há
// RIFF/WAV). Ficamos com MP3 a 96kbps, que o FFmpeg lê sem problema.

const VOICES: TtsVoice[] = [
  {
    id: "pt-BR-FranciscaNeural",
    providerId: "edge",
    label: "Francisca",
    gender: "female",
    language: "pt-BR",
  },
  {
    id: "pt-BR-AntonioNeural",
    providerId: "edge",
    label: "Antônio",
    gender: "male",
    language: "pt-BR",
  },
  {
    id: "pt-BR-ThalitaMultilingualNeural",
    providerId: "edge",
    label: "Thalita",
    gender: "female",
    language: "pt-BR",
  },
  {
    id: "en-US-AriaNeural",
    providerId: "edge",
    label: "Aria",
    gender: "female",
    language: "en-US",
  },
  {
    id: "en-US-GuyNeural",
    providerId: "edge",
    label: "Guy",
    gender: "male",
    language: "en-US",
  },
];

/** Sem resposta nesse prazo, desistimos e deixamos a cadeia tentar o próximo. */
const TIMEOUT_MS = 45_000;

export class EdgeTtsProvider implements TtsProvider {
  readonly id = "edge";

  voices(): TtsVoice[] {
    return VOICES;
  }

  /**
   * Sempre `true`: depende de um serviço externo, e só dá para saber tentando.
   * A queda para o próximo provedor acontece pela exceção em `synthesize`.
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  async synthesize(text: string, voiceId: string, rate: number): Promise<NarrationResult> {
    const voice = VOICES.find((v) => v.id === voiceId) ?? VOICES[0];

    const tts = new MsEdgeTTS();
    try {
      await tts.setMetadata(voice.id, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      // O SSML aceita a taxa como percentual relativo: 0.9 vira "-10%".
      const percent = Math.round((rate - 1) * 100);
      const { audioStream } = tts.toStream(escapeSsml(text), {
        rate: `${percent >= 0 ? "+" : ""}${percent}%`,
      });

      const audio = await collect(audioStream);
      if (audio.length === 0) {
        throw new Error("O serviço do Edge devolveu áudio vazio.");
      }

      return {
        audio,
        mime: "audio/mpeg",
        extension: "mp3",
        voiceId: voice.id,
        providerId: this.id,
      };
    } finally {
      // Sem isso o WebSocket fica aberto e o processo não encerra.
      tts.close();
    }
  }
}

function collect(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const timer = setTimeout(() => {
      reject(new Error(`O serviço do Edge não respondeu em ${TIMEOUT_MS / 1000}s.`));
    }, TIMEOUT_MS);

    const finish = (fn: () => void) => {
      clearTimeout(timer);
      fn();
    };

    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", (err: Error) => finish(() => reject(err)));
    // O pacote emite "close" ao terminar; "end" cobre o caso de o stream
    // terminar sem fechar.
    stream.on("end", () => finish(() => resolve(Buffer.concat(chunks))));
    stream.on("close", () => finish(() => resolve(Buffer.concat(chunks))));
  });
}
