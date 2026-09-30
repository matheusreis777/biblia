# Bíblia Online

Leitor bíblico e gerador de Reels com versículos. SPA em Vite + React 19 + TypeScript,
com funções serverless na Vercel.

```bash
npm install
npm run dev     # http://localhost:5173
```

Roda sem nenhuma configuração: a Bíblia usa a `bible-api.com` e o gerador de Reels cai
na biblioteca interna de vídeos. Chaves e login são opcionais — ver
[Variáveis de ambiente](#variáveis-de-ambiente).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o site e a API (o plugin em `vite/reelsDevApi.ts` serve `/api/*` em desenvolvimento) |
| `npm run build` | `tsc -b` em todos os projetos, depois o build do Vite |
| `npm run lint` | ESLint |
| `npm run verify:layout` | Verifica o motor de layout dos Reels e gera PNGs para inspeção |
| `npm run verify:api` | Confere que as funções de `api/` carregam no runtime da Vercel |
| `npm run fonts` | Regera as fontes de `public/fonts/` (precisa de Python + fontTools) |
| `npm run icons` | Regera os ícones do PWA a partir de `public/favicon.svg` |
| `npm run icon-biblia` | Regera o ícone da aba (`favicon.ico`) e a prévia de links (`og-image.jpg`) a partir de `public/icon-biblia.png` |

## Documentação

| Documento | Assunto |
|---|---|
| [docs/REELS.md](docs/REELS.md) | Gerador de Reels: layout, provedores, narração, trilha e render |
| [docs/CONTA.md](docs/CONTA.md) | Login com Google, tabelas, RLS e o painel do Supabase |
| [docs/LAYOUT.md](docs/LAYOUT.md) | Sistema visual: temas, breakpoints, header, leitor e overlays |

## Estrutura

```
src/            aplicação no browser
  pages/        Index (leitor), Favoritos, Reels e AuthCallback
  components/   bible/ · reels/ · layout/ (casca) · ui/ (primitivos)
  reels/        NÚCLEO COMPARTILHADO — TS puro, roda no browser e no servidor
  auth/         sessão do Supabase e dados do leitor (última leitura, favoritos)
  hooks/        preferências de leitura, favoritos, atalhos, gestos
  theme/        tema claro/escuro
  lib/          cliente do Supabase, tipos do banco e persistência local
  data/         os 66 livros
  i18n/         pt-BR e en-US
api/            SÓ as rotas serverless (cada arquivo vira uma função na Vercel)
server/         biblioteca usada pelas rotas
  reels/providers/  vídeo de fundo (Pexels, Pixabay, interna)
  reels/quotes/     frases motivacionais
  reels/tts/        motores de voz (Edge, Windows) e a cadeia de fallback
  reels/render/     FFmpeg local e o empacotado
  reels/music/      trilha de fundo (hoje só a pasta local)
supabase/       migrações SQL já aplicadas no projeto
vite/           plugin que serve /api/* em desenvolvimento
scripts/        fontes, ícones e verificação de layout
docs/           documentação de referência
public/fonts/   fontes do gerador de Reels
public/music/   suas trilhas de fundo (não versionadas, pasta nasce vazia)
```

### Imports relativos precisam de extensão `.js`

Em `api/`, `server/` e `src/reels/`, **todo import relativo tem que terminar em `.js`** e
apontar para um arquivo — nunca para uma pasta (`./providers` não resolve; use
`./providers/index.js`).

Não é estilo, é o que faz o deploy funcionar. O `package.json` tem `"type": "module"`,
então o builder da Vercel trata nossos `.ts` como ESM: compila cada arquivo para `.js`
mas **não reescreve os especificadores**. Sob ESM o Node exige extensão explícita e não
faz resolução de diretório. Sem isso, o build passa, o deploy é publicado e **todas** as
rotas devolvem `FUNCTION_INVOCATION_FAILED`.

`npm run verify:api` reproduz essas condições e é a única verificação que pega esse erro
— nem `tsc`, nem `vite build`, nem o dev server pegam, porque em desenvolvimento o Vite
resolve os imports com o próprio resolvedor.

Pelo mesmo motivo, `api/` contém **apenas rotas**: a Vercel transforma cada arquivo dali
numa função, então um módulo compartilhado no meio viraria uma rota quebrada. O que as
rotas usam em comum vive em `server/`.

## Variáveis de ambiente

Nenhuma é obrigatória. Em desenvolvimento saem de um `.env.local` na raiz (nada de
`.env*` é versionado); na Vercel, de Project Settings → Environment Variables.

| Variável | Para quê |
|---|---|
| `PEXELS_API_KEY` | Provedor principal de vídeos. Gratuita, 200 req/h. |
| `PIXABAY_API_KEY` | Fallback de vídeo do Pexels. Gratuita. |
| `FFMPEG_PATH` | Caminho do FFmpeg quando não está no PATH. Só afeta o render local. |
| `VITE_SUPABASE_URL` | URL do projeto Supabase. Pública. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`). Pública: quem protege os dados é o RLS. |

As chaves dos Reels são lidas **só no servidor** e nunca levam o prefixo `VITE_` — com
ele, o Vite embutiria a chave no bundle do browser. As duas do Supabase são a exceção:
são públicas por natureza e o navegador precisa delas. Sem elas o site continua
funcionando, só que sem conta — o botão de entrar não aparece e a última leitura fica só
no navegador.

**Nunca use aqui a `service_role` key do Supabase:** ela ignora o RLS e não pode chegar
ao cliente.

## Deploy

`vercel.json` não aceita comentários, então o que está lá está explicado aqui:

- **`api/reels/render.ts` → `maxDuration: 60`** — valor conservador, válido em Hobby e em
  Pro. Um Reel de 15s em 1080x1920 leva ~40s localmente e é mais lento na função, então
  60s é apertado. Se a rota estourar o tempo no site publicado, **suba para 300 (exige
  plano Pro)** — não deixe 300 numa conta Hobby, porque o build inteiro falha e nem a
  Bíblia sobe. O render local não é afetado.
- **`api/reels/render.ts` → `includeFiles: "public/fonts/**"`** — `public/` é saída
  estática e não entra no bundle da função. Sem isso, o servidor não acha as fontes para
  medir e rasterizar o texto. Se mover as fontes, atualize também `CANDIDATE_DIRS` em
  `server/reels/serverFonts.ts`.
- **`api/reels/narration.ts` → `maxDuration: 60`** — a síntese de voz leva alguns
  segundos e o padrão da plataforma é apertado demais.
- **`rewrites`** — SPA fallback, excluindo `/api/` de propósito.
- **`crons`** — `/api/daily-verse` às 6h UTC, para aquecer o cache do versículo do dia.
