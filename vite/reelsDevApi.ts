import type { IncomingMessage, ServerResponse } from "node:http";
import { loadEnv, type Plugin, type ViteDevServer } from "vite";

// ─── API do gerador de Reels em desenvolvimento ───────────────────────────────
// Em produção, /api/* são funções serverless da Vercel. Sob `vite dev` não
// existe servidor nenhum ali — o padrão usado na página da Bíblia é desviar
// direto para a API externa (ver fetchChapter em src/pages/Index.tsx).
//
// Esse desvio não serve para os Reels: a busca de vídeo precisa esconder a
// chave de API e o render precisa do FFmpeg, ou seja, precisam de Node.
//
// Este plugin monta OS MESMOS arquivos de api/reels/ como middleware do dev
// server. Não há um segundo caminho de código para manter: o que roda em casa
// é exatamente o que vai para a Vercel.

/**
 * Rotas atendidas, mapeadas para o módulo que as implementa.
 *
 * As duas rotas antigas entram aqui também: com elas servidas em dev, a página
 * de Reels não precisa de nenhum desvio condicional para buscar versículos.
 * (A página da Bíblia continua com o desvio dela — não é o escopo desta
 * mudança, mas agora poderia ser simplificada da mesma forma.)
 */
const ROUTES: Record<string, string> = {
  "/api/reels/videos": "/api/reels/videos.ts",
  "/api/reels/render": "/api/reels/render.ts",
  "/api/reels/voices": "/api/reels/voices.ts",
  "/api/reels/narration": "/api/reels/narration.ts",
  "/api/reels/music": "/api/reels/music.ts",
  "/api/reels/quotes": "/api/reels/quotes.ts",
  "/api/bible-passage": "/api/bible-passage.ts",
  "/api/daily-verse": "/api/daily-verse.ts",
};

type VercelStyleResponse = ServerResponse & {
  status(code: number): VercelStyleResponse;
  json(body: unknown): VercelStyleResponse;
  send(body: Buffer | string): VercelStyleResponse;
};

/**
 * Dá ao ServerResponse do Node os poucos atalhos que os handlers da Vercel
 * usam. `setHeader`, `write` e `end` já são nativos e passam direto.
 */
function adaptResponse(res: ServerResponse): VercelStyleResponse {
  const adapted = res as VercelStyleResponse;

  adapted.status = (code: number) => {
    adapted.statusCode = code;
    return adapted;
  };

  adapted.json = (body: unknown) => {
    if (!adapted.headersSent) {
      adapted.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    adapted.end(JSON.stringify(body));
    return adapted;
  };

  // Usado pela rota de narração, que devolve o áudio como binário.
  adapted.send = (body: Buffer | string) => {
    adapted.end(body);
    return adapted;
  };

  return adapted;
}

/** Corpo JSON da requisição. Na Vercel isso já vem pronto em `req.body`. */
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return undefined;

  const raw = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Corpo da requisição não é JSON válido.");
  }
}

async function handleRequest(
  server: ViteDevServer,
  modulePath: string,
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
): Promise<void> {
  // ssrLoadModule transpila o TS e respeita o HMR: editar um provider e
  // recarregar já reflete, sem reiniciar o dev server.
  const module = await server.ssrLoadModule(modulePath);
  const handler = module.default as (req: unknown, res: unknown) => Promise<void>;

  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const body = req.method === "POST" ? await readJsonBody(req) : undefined;

  Object.assign(req, { query, body });
  await handler(req, adaptResponse(res));
}

export function reelsDevApi(): Plugin {
  return {
    name: "biblia:reels-dev-api",
    apply: "serve",

    config(_config, { mode }) {
      // O Vite só expõe variáveis com prefixo VITE_ ao cliente, e é assim que
      // tem que ser: as chaves de API não podem chegar no browser. Aqui elas
      // vão para o process.env do processo do dev server, que é onde os
      // handlers as leem — exatamente como na Vercel.
      const env = loadEnv(mode, process.cwd(), "");
      for (const key of [
        "PEXELS_API_KEY",
        "PIXABAY_API_KEY",
        "FFMPEG_PATH",
      ]) {
        if (env[key] && !process.env[key]) process.env[key] = env[key];
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        const url = new URL(req.url, "http://localhost");
        const modulePath = ROUTES[url.pathname];
        if (!modulePath) return next();

        try {
          await handleRequest(server, modulePath, req, res, url);
        } catch (error) {
          server.config.logger.error(
            `[reels] erro em ${url.pathname}: ${error instanceof Error ? error.stack : error}`,
          );
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
          }
          if (res.writableEnded) return;
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Erro interno.",
            }),
          );
        }
      });
    },
  };
}
