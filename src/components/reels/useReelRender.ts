import { useCallback, useRef, useState } from "react";
import type { RenderStage } from "@/reels/types";

// ─── Consumo do stream de render ──────────────────────────────────────────────
// /api/reels/render responde em NDJSON: uma linha JSON por evento, e o MP4 no
// final em pedaços base64. Ver o cabeçalho de api/reels/render.ts.
//
// O progresso é real — vem do `-progress` do FFmpeg, não é uma barra fingida.

export interface RenderRequestBody {
  verseText: string;
  reference: string;
  styleId: string;
  overrides?: Record<string, unknown>;
  video: { downloadUrl: string; previewUrl?: string };
  durationSec: number;
  brandingText: string;
  siteText: string;
  motion: boolean;
  /** Tag BCP-47; decide como a referência é lida em voz alta. */
  language?: string;
  /** "verse" aplica a leitura de capítulo/versículo à referência; "quote" não. */
  contentType?: "verse" | "quote";
  narration?: {
    enabled: boolean;
    voiceId: string;
    rate: number;
    includeReference: boolean;
  };
  music?: { trackUrl: string; gain: number };
}

export type RenderPhase = "idle" | "running" | "done" | "error";

export interface ReelRenderState {
  phase: RenderPhase;
  stage: RenderStage | null;
  /** 0–100 dentro da etapa atual, quando ela reporta. */
  pct: number | null;
  /** Percentual do download do MP4, depois que a renderização termina. */
  downloadPct: number | null;
  url: string | null;
  bytes: number | null;
  error: string | null;
}

const IDLE: ReelRenderState = {
  phase: "idle",
  stage: null,
  pct: null,
  downloadPct: null,
  url: null,
  bytes: null,
  error: null,
};

/** Decodifica base64 em bytes sem passar por string intermediária gigante. */
function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function useReelRender() {
  const [state, setState] = useState<ReelRenderState>(IDLE);
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    // Um object URL não é liberado sozinho: sem o revoke, cada geração deixa o
    // MP4 inteiro preso na memória da aba.
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setState(IDLE);
  }, []);

  const start = useCallback(
    async (body: RenderRequestBody) => {
      abortRef.current?.abort();
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setState({ ...IDLE, phase: "running", stage: "preparing" });

      try {
        const res = await fetch("/api/reels/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          // Erros de validação e de ambiente vêm como JSON normal, antes de o
          // stream começar.
          const detail = await res.json().catch(() => null);
          throw new Error(detail?.error ?? `O servidor respondeu ${res.status}.`);
        }
        if (!res.body) throw new Error("A resposta não trouxe conteúdo.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const chunks: Uint8Array[] = [];
        let buffer = "";
        let expectedBytes = 0;
        let receivedBytes = 0;
        let streamError: string | null = null;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Uma leitura pode terminar no meio de uma linha; o pedaço final fica
          // no buffer até a próxima, senão o JSON.parse quebraria.
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);

            if (event.error) {
              streamError = event.error;
            } else if (event.data) {
              const bytes = decodeBase64(event.data);
              chunks.push(bytes);
              receivedBytes += bytes.length;
              setState((prev) => ({
                ...prev,
                downloadPct: expectedBytes
                  ? Math.min(100, (receivedBytes / expectedBytes) * 100)
                  : null,
              }));
            } else if (event.stage === "done") {
              expectedBytes = event.bytes;
              setState((prev) => ({
                ...prev,
                stage: "done",
                pct: 100,
                bytes: event.bytes,
                downloadPct: 0,
              }));
            } else if (event.stage) {
              setState((prev) => ({
                ...prev,
                stage: event.stage,
                pct: typeof event.pct === "number" ? event.pct : null,
              }));
            }
          }
        }

        if (streamError) throw new Error(streamError);
        if (chunks.length === 0) throw new Error("O servidor não devolveu o vídeo.");

        const blob = new Blob(chunks as BlobPart[], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;

        setState((prev) => ({
          ...prev,
          phase: "done",
          stage: "done",
          pct: 100,
          downloadPct: 100,
          url,
          bytes: blob.size,
        }));
      } catch (err) {
        if (controller.signal.aborted) return;
        setState({
          ...IDLE,
          phase: "error",
          error: err instanceof Error ? err.message : "Falha ao gerar o vídeo.",
        });
      }
    },
    [],
  );

  return { state, start, reset };
}
