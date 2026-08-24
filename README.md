# Bíblia Online

Leitor bíblico e gerador de Reels com versículos. SPA em Vite + React 19 + TypeScript,
com funções serverless na Vercel.

```bash
npm install
cp .env.example .env.local   # preencha as chaves (veja abaixo)
npm run dev
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o site e a API (o plugin em `vite/reelsDevApi.ts` serve `/api/*` em desenvolvimento) |
| `npm run build` | `tsc -b` em todos os projetos, depois o build do Vite |
| `npm run lint` | ESLint |
| `npm run verify:layout` | Verifica o motor de layout dos Reels e gera PNGs para inspeção |
| `npm run verify:api` | Confere que as funções de `api/` carregam no runtime da Vercel |
| `npm run fonts` | Regera as fontes de `public/fonts/` (precisa de Python + fontTools) |

## Estrutura

```
src/            aplicação no browser
  pages/        Index (leitor bíblico), Reels (gerador) e AuthCallback (volta do Google)
  components/   componentes da página de Reels
  reels/        NÚCLEO COMPARTILHADO — TS puro, roda no browser e no servidor
  auth/         sessão do Supabase e dados do leitor (última leitura, favoritos)
  lib/          cliente do Supabase, tipos do banco e persistência local
  data/         os 66 livros
  i18n/         pt-BR e en-US
api/            SÓ as rotas serverless (cada arquivo vira uma função na Vercel)
server/         biblioteca usada pelas rotas
supabase/       migrações SQL já aplicadas no projeto
  reels/tts/    motores de voz (Edge, Windows) e a cadeia de fallback
  reels/music/  trilha de fundo (hoje só a pasta local)
vite/           plugin que serve /api/* em desenvolvimento
scripts/        preparação de fontes e verificação de layout
public/fonts/   fontes do gerador de Reels
public/music/   suas trilhas de fundo (não versionadas, pasta nasce vazia)
```

### Imports relativos precisam de extensão `.js`

Em `api/`, `server/` e `src/reels/`, **todo import relativo tem que terminar em `.js`** e
apontar para um arquivo — nunca para uma pasta (`./providers` não resolve; use
`./providers/index.js`).

Não é estilo, é o que faz o deploy funcionar. O `package.json` tem `"type": "module"`, e o
builder da Vercel usa isso para tratar nossos `.ts` como ESM:

```js
const isEsm = ext === ".mjs" || ext === ".mts" ||
              pkg.type === "module" && [".js",".ts",".tsx"].includes(ext);
```

Ele compila cada arquivo para `.js` mas **não reescreve os especificadores**. Sob ESM o
Node exige extensão explícita e não faz resolução de diretório. Sem isso, o build passa,
o deploy é publicado e **todas** as rotas devolvem `FUNCTION_INVOCATION_FAILED` — foi
exatamente o que aconteceu. `npm run verify:api` reproduz essas condições e é a única
verificação que pega esse erro; nem `tsc`, nem `vite build`, nem o dev server pegam,
porque em desenvolvimento o Vite resolve os imports com o próprio resolvedor.

`api/` contém apenas rotas. Tudo o que elas usam em comum vive em `server/`, porque a
Vercel transforma **cada** arquivo de `api/` numa função — um módulo compartilhado ali
dentro viraria uma rota quebrada.

## Gerador de Reels

Transforma um **versículo bíblico** ou uma **frase motivacional** num MP4 vertical
1080x1920 pronto para Instagram Reels, TikTok e YouTube Shorts.
Fluxo: conteúdo → tema → vídeo de fundo → estilo → áudio → gerar.

As duas áreas são abas do passo 1 e compartilham todo o resto. Elas produzem o mesmo
`{ text, reference }` — no versículo a referência é "João 3:16", na frase é o autor —,
então layout, SVG, FFmpeg e narração não precisam saber da diferença.

O papel do tema **inverte** entre os modos: no versículo ele é detectado do texto; na
frase ele é o filtro que escolhe as frases. Nos dois casos é o mesmo tema que alimenta a
busca de vídeo.

### O preview é WYSIWYG de verdade

O que aparece no mockup de celular é a **mesma composição** que vai para o vídeo, não
uma aproximação. Isso vem de três decisões que precisam ser mantidas juntas:

1. **Um motor de layout compartilhado** (`src/reels/layout.ts`) calcula a quebra de
   linha, o corpo da fonte e as posições. Ele é TS puro, sem DOM e sem Node, e roda
   igual nos dois lados.
2. **A mesma medição de texto** nos dois ambientes: `opentype.js` lendo os mesmos
   arquivos `.ttf` de `public/fonts/`. Medir com a API do canvas de um lado e com o
   resvg do outro divergiria.
3. **A composição não usa o `drawtext` do FFmpeg.** O texto vira SVG, o resvg rasteriza
   em PNG e o FFmpeg sobrepõe. `drawtext` não quebra linha, não controla tracking e não
   desenha sombra decente — o resultado teria cara de template automático.

### Assinatura e marca d'água

A composição tem dois elementos de marca, ambos **fora da área segura** de propósito:

| Elemento | Onde | Texto padrão |
|---|---|---|
| Assinatura | rodapé do vídeo, 96px da borda | `Bíblia Online` no modo Versículo, `Under Control` no modo Frase |
| Marca d'água | topo do vídeo, 96px da borda | `matheusreis.dev`, no verde da marca e mais apagada |

Os dois ficam nas faixas onde Instagram, TikTok e Shorts desenham a própria interface,
então podem aparecer parcialmente encobertos **dentro do app** — no arquivo e em qualquer
player normal aparecem inteiros. A troca é consciente: são elementos secundários, e
mantê-los nas bordas devolve a área segura inteira para o versículo.

O verde é o token `--primary` do site (`hsl(142 70% 45%)` = `#22C35D`) e é fixo: não segue
o seletor de cor do texto, porque é a marca. Os dois textos são editáveis no passo 4.

As fontes de `public/fonts/` são instâncias estáticas geradas por
`scripts/prepare-fonts.py`, com **um nome de família único por peso**
(`ReelInter500`, `ReelPlayfair600`, …). Sem isso, as três instâncias do Inter sairiam
todas como família `Inter`/`Regular` e o resvg não conseguiria escolher o peso certo.
O mesmo nome literal é usado no `font-family` do SVG e no `@font-face` do CSS.

### Provedores de vídeo

Cadeia de fallback: **Pexels → Pixabay → biblioteca interna**. Cada elo implementa
`VideoProvider` (`server/reels/providers/types.ts`); para acrescentar um provedor,
crie o arquivo e inclua-o no array `PROVIDERS` de `server/reels/providers/index.ts` —
nada mais precisa mudar. A biblioteca interna é curada à mão e sempre responde, então
a página funciona mesmo sem nenhuma chave configurada.

Todo clipe passa por filtros de qualidade: portrait, altura ≥ 1280, duração ≥ 6s, e a
ordenação prefere quem já tem a duração do Reel (clipe curto precisa de loop, e a
emenda aparece).

O arquivo baixado para o render é o **menor** com altura suficiente, não o maior:
baixar 4K para reduzir a 1080x1920 custa quatro vezes mais tempo (medido: 54s contra
7s) por um ganho que a recompressão do Instagram apaga.

### Frases motivacionais

Cadeia: **espelho do Quotable (só inglês) → biblioteca curada** (`server/reels/quotes/`).

Nenhuma API pública tem acervo em português — verificado em Quotable, ZenQuotes,
API Ninjas e Forismatic. Por isso a **biblioteca curada é a única fonte em pt-BR**, e em
inglês ela serve de queda para quando o espelho não responde.

O `api.quotable.io` oficial está fora do ar; o espelho da comunidade que o substitui é um
Swagger sem operador identificado e sem termos de uso — pode sumir a qualquer momento.
É por isso que a biblioteca interna é a queda, e não o contrário.

As 63 tags do Quotable são traduzidas para os 13 temas do projeto por um mapa em
`server/reels/quotes/types.ts`. **Todas as tags do mapa foram conferidas contra
`/api/tags`**: uma tag inexistente não dá erro, o filtro só devolve vazio em silêncio.
`prayer`, `god` e `protection` ficam sem mapa — não têm equivalente num acervo secular.

**Sobre a curadoria:** frases célebres são massivamente mal atribuídas na internet, e
publicar um Reel com o autor errado é um erro que volta. Só entra o que tem origem
identificável, e o cabeçalho de `internal.ts` lista as atribuições falsas mais copiadas
que foram deliberadamente excluídas. Para ampliar o acervo, confira a autoria antes.

### Narração

Opcional, ligada por padrão. Cadeia de fallback igual à dos vídeos:
**Edge → voz local do Windows → nenhuma** (`server/reels/tts/`).

- **`EdgeTtsProvider`** usa as vozes neurais pt-BR do "Ler em voz alta" do Edge
  (Francisca, Antônio, Thalita) via `msedge-tts`. Grátis e sem chave.
  **Ressalva:** o endpoint não é documentado nem oferecido como API pública; pode mudar
  ou bloquear sem aviso, e usá-lo programaticamente é área cinzenta dos termos da
  Microsoft. É por isso que existe a queda para a voz local.
- **`WindowsTtsProvider`** usa o `System.Speech` (SAPI) via PowerShell. Offline e
  estável, mas soa datada — e **não funciona no site publicado**, que roda Linux.

A voz nunca derruba o render: se todos os motores falharem, o vídeo sai mudo e o aviso
vai para o log.

A referência é lida por extenso — "João, capítulo 3, versículo 16" — porque os
sintetizadores leem "3:16" como hora. Ver `server/reels/narrationText.ts`.

**A duração da narração é medida no browser**, pelo `<audio>` que o preview já carrega.
Parsear cabeçalho de MP3 no servidor exigiria contar quadros, ou o `ffprobe`, que o
`ffmpeg-static` não traz. Se a fala não couber na duração escolhida, a interface avisa e
oferece o ajuste — a narração **não** estica o vídeo.

### Trilha de fundo

Opcional, desligada por padrão. A fonte é a pasta **`public/music/`**: os arquivos que
você puser lá (MP3, M4A, OGG, WAV) aparecem no passo Áudio. Nasce vazia e o conteúdo
não é versionado.

**Não há provedor de API de música.** As três fontes candidatas foram testadas e
nenhuma serve:

| Fonte | Resultado |
|---|---|
| Pixabay `/api/audio/` | Existe, mas responde **403 Access denied** mesmo com chave válida — a mesma chave retorna 200 em `/api/videos/`. Fechado para chaves comuns. |
| Jamendo | Funciona, mas exige `client_id` próprio e o acervo Creative Commons exige crédito. Removido a pedido. |
| Free Music Archive | API fora do ar (404). |

A estrutura de cadeia continua de pé em `server/reels/music/`: para plugar uma API no
futuro, implemente `MusicProvider` e insira-o antes do `LocalMusicProvider` no array
`MUSIC_PROVIDERS`. O seletor de clima na interface aparece sozinho quando existir um
provedor que busque por texto.

Quando há voz e música juntas, o `sidechaincompress` abaixa a trilha enquanto a voz
fala e a devolve nos intervalos — medido em **-10,8 dB** de atenuação. Sem isso, ou a
música cobre a narração, ou fica baixa demais o tempo todo.

### Render

`POST /api/reels/render` responde em NDJSON streamado — uma linha por evento, o MP4 em
pedaços base64 no final. O percentual da etapa de renderização vem do `-progress` do
FFmpeg; não é uma barra fingida.

Duas implementações de `VideoRenderService`, escolhidas automaticamente:

- **`LocalFfmpegRenderService`** — o FFmpeg instalado na máquina. Sem timeout, então usa
  `-preset slow -crf 20`. É o caminho de qualidade máxima.
- **`BundledFfmpegRenderService`** — `ffmpeg-static`, para o site publicado.

**O perfil serverless é bem mais enxuto, e isso foi medido, não estimado:** com
1080x1920 a 30fps, preset `veryfast` e zoom ligado, a função **estourou os 60s** em
produção. O perfil atual — 720x1280, 24fps, `ultrafast`, sem zoom — é 4,4x mais rápido
(7,7s contra 33,7s na mesma máquina) e cabe no limite. A composição é idêntica; muda a
resolução e o movimento de fundo.

Se a conta for **Pro**, subir `maxDuration` para 300 em `vercel.json` permite devolver o
perfil serverless para perto do local — é só ajustar `SERVERLESS_PROFILE` em
`server/reels/render/types.ts`.

## Conta e sincronização

Login **opcional**, só com Google, via Supabase Auth. Quem não entra lê a Bíblia
normalmente e tem a última leitura guardada no `localStorage`; quem entra ganha a mesma
informação na nuvem, sincronizada entre dispositivos.

O que a conta guarda — uma tabela para cada coisa, todas com RLS ligado e políticas que
só deixam a pessoa ver e escrever as próprias linhas:

| Tabela | Conteúdo |
|---|---|
| `profiles` | Nome, e-mail, foto e idioma preferido. Criada por trigger no primeiro login. |
| `reading_progress` | Uma linha por usuário com o último livro e capítulo abertos. |
| `favorite_verses` | Versículos marcados com a estrela. |

**O RLS sozinho não basta neste projeto.** Ele foi criado com a política "RLS-first" do
Supabase, que não concede privilégios de tabela automaticamente: sem o `GRANT ... TO
authenticated` da migração `20260821191609`, o PostgREST devolve `42501 permission
denied` antes mesmo de avaliar as políticas. Toda tabela nova precisa dos dois.

### Como o estado é resolvido

`src/auth/` tem dois provedores, nesta ordem:

- **`AuthProvider`** — restaura a sessão do `localStorage` no carregamento
  (`persistSession` + `autoRefreshToken`), o que mantém a pessoa logada entre visitas, e
  expõe `signInWithGoogle` / `signOut`.
- **`UserDataProvider`** — dona da última leitura, dos favoritos e do idioma. Sem sessão
  trabalha só com o `localStorage`. Ao entrar, mescla os dois lados: na última leitura
  vence o `updated_at` mais recente; nos favoritos vale a união dos dois conjuntos, e o
  que só existia no navegador sobe para a nuvem.

O flag `ready` do `UserDataProvider` é o que evita a pegadinha mais fácil deste fluxo:
gravar Gênesis 1 (o capítulo padrão) por cima do progresso real antes de a nuvem
responder. A página só restaura e só grava depois que ele vira `true`.

### O que precisa estar configurado no painel do Supabase

- **Authentication → Providers → Google**: habilitado, com o Client ID e o Client Secret
  do Google Cloud. No Google Cloud, a *Authorized redirect URI* é a do Supabase:
  `https://<projeto>.supabase.co/auth/v1/callback`.
- **Authentication → URL Configuration → Redirect URLs**: precisa listar o callback da
  app em cada ambiente, senão a volta do Google cai no *Site URL* em vez da rota certa:
  `http://localhost:5173/auth/callback` e `https://<seu-domínio>/auth/callback`.
- **Authentication → Providers → Email**: pode ser desligado. A interface não oferece
  mais senha, mas enquanto o provedor estiver ligado ainda dá para criar conta chamando a
  API direto.
- Opcional: *Leaked Password Protection* — irrelevante enquanto só houver Google.

## Configuração

### Variáveis de ambiente

As chaves de API dos Reels ficam **só no servidor**, nunca com prefixo `VITE_` (o Vite
embutiria a chave no bundle do browser). As duas do Supabase são a exceção: elas são
públicas por natureza e o navegador precisa delas. Em desenvolvimento saem do
`.env.local`; na Vercel, de Project Settings → Environment Variables.

| Variável | Para quê |
|---|---|
| `PEXELS_API_KEY` | Provedor principal de vídeos. Gratuita, 200 req/h. |
| `PIXABAY_API_KEY` | Fallback de vídeo do Pexels. Gratuita. Opcional. |
| `FFMPEG_PATH` | Caminho do FFmpeg quando não está no PATH. Só afeta o render local. |
| `VITE_SUPABASE_URL` | URL do projeto Supabase. Pública. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`). Pública: quem protege os dados é o RLS. |

Sem as duas do Supabase o site continua funcionando — o botão de entrar simplesmente não
aparece e a última leitura fica só no navegador. Nunca coloque aqui a `service_role`
key: ela ignora o RLS e não pode chegar ao cliente.

### `vercel.json`

JSON não aceita comentários, então o que está lá está explicado aqui:

- **`api/reels/render.ts` → `maxDuration: 60`** — valor conservador, válido em Hobby e
  em Pro. Um Reel de 15s em 1080x1920 leva ~40s localmente e é mais lento na função, então
  60s é apertado: se a rota estourar o tempo no site publicado, **suba para 300 (exige
  plano Pro)**. Não deixe 300 numa conta Hobby — o build inteiro falha, e nem a Bíblia sobe.
  Antes, no Hobby a rota vai estourar
  o tempo; o render local continua funcionando normalmente.
- **`api/reels/render.ts` → `includeFiles: "public/fonts/**"`** — `public/` é saída
  estática e não entra no bundle da função. Sem isso, o servidor não acha as fontes
  para medir e rasterizar o texto. Se mover as fontes, atualize também
  `CANDIDATE_DIRS` em `server/reels/serverFonts.ts`.
- **`api/reels/narration.ts` → `maxDuration: 60`** — a síntese de voz leva alguns
  segundos e o padrão da plataforma é apertado demais.
- **`rewrites`** — SPA fallback, excluindo `/api/` de propósito.

## Verificação

`npm run verify:layout` roda o layout de versículos curto, médio e longo nos quatro
estilos e confere que nenhuma linha estoura a coluna e que nada invade a área segura
das plataformas. Também escreve os PNGs de cada camada em
`node_modules/.tmp/reels-verify/` para inspeção visual.
