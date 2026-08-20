import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { NarrationResult, TtsProvider, TtsVoice } from "./types.js";

// ─── Voz local do Windows ─────────────────────────────────────────────────────
// Queda para quando o serviço do Edge falha. Usa o System.Speech do .NET
// Framework (SAPI) via PowerShell, que grava direto num arquivo WAV.
//
// É offline, estável e sem nenhuma área cinzenta de termos de uso — mas a voz é
// de uma geração bem anterior às neurais e soa sintética. Serve como rede de
// segurança, não como primeira escolha.
//
// Só existe no Windows: no Linux da Vercel, isAvailable() devolve false e a
// cadeia simplesmente pula este provedor.

const VOICES: TtsVoice[] = [
  {
    id: "Microsoft Maria Desktop",
    providerId: "windows",
    label: "Maria (local)",
    gender: "female",
    language: "pt-BR",
    note: "Voz do Windows, sem internet. Soa mais sintética.",
  },
  {
    id: "Microsoft Zira Desktop",
    providerId: "windows",
    label: "Zira (local)",
    gender: "female",
    language: "en-US",
    note: "Windows voice, works offline. Sounds more synthetic.",
  },
];

const TIMEOUT_MS = 60_000;

/**
 * Aspas simples são o escape do PowerShell dentro de string literal: '' vira '.
 * Sem isso, um versículo com apóstrofo encerraria a string e o resto do texto
 * seria interpretado como comando.
 */
function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function runPowerShell(script: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { windowsHide: true },
    );

    let stderr = "";
    child.stderr.on("data", (d: Buffer) => {
      stderr = (stderr + d.toString()).slice(-2000);
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`A voz do Windows não respondeu em ${TIMEOUT_MS / 1000}s.`));
    }, TIMEOUT_MS);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Não foi possível executar o PowerShell: ${err.message}`));
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`A síntese local falhou (código ${code}).\n${stderr.trim()}`));
    });
  });
}

export class WindowsTtsProvider implements TtsProvider {
  readonly id = "windows";

  voices(): TtsVoice[] {
    return VOICES;
  }

  async isAvailable(): Promise<boolean> {
    return process.platform === "win32";
  }

  async synthesize(text: string, voiceId: string, rate: number): Promise<NarrationResult> {
    const voice = VOICES.find((v) => v.id === voiceId) ?? VOICES[0];

    const dir = await mkdtemp(join(tmpdir(), "reel-tts-"));
    const outputPath = join(dir, "narration.wav");

    try {
      // O SAPI usa uma escala inteira de -10 a 10, onde 0 é a velocidade normal.
      const sapiRate = Math.max(-10, Math.min(10, Math.round((rate - 1) * 10)));

      // SelectVoice lança se a voz não estiver instalada; o catch cai na voz
      // padrão do sistema, que é melhor do que não narrar nada.
      const script = [
        "$ErrorActionPreference='Stop'",
        "Add-Type -AssemblyName System.Speech",
        "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer",
        `try { $s.SelectVoice(${psQuote(voice.id)}) } catch { }`,
        `$s.Rate = ${sapiRate}`,
        `$s.SetOutputToWaveFile(${psQuote(outputPath)})`,
        `$s.Speak(${psQuote(text)})`,
        "$s.SetOutputToNull()",
        "$s.Dispose()",
      ].join("; ");

      await runPowerShell(script);
      const audio = await readFile(outputPath);

      if (audio.length === 0) {
        throw new Error("A voz do Windows gerou um arquivo vazio.");
      }

      return {
        audio,
        mime: "audio/wav",
        extension: "wav",
        voiceId: voice.id,
        providerId: this.id,
      };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
