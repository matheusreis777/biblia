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
| `npm run fonts` | Regera as fontes de `public/fonts/` (precisa de Python + fontTools) |

## Estrutura

```
src/            aplicação no browser
  pages/        Index (leitor bíblico) e Reels (gerador)
  components/   componentes da página de Reels
  reels/        NÚCLEO COMPARTILHADO — TS puro, roda no browser e no servidor
  data/         os 66 livros
  i18n/         pt-BR e en-US
api/            SÓ as rotas serverless (cada arquivo vira uma função na Vercel)
server/         biblioteca usada pelas rotas
  reels/tts/    motores de voz (Edge, Windows) e a cadeia de fallback
  reels/music/  trilha de fundo (hoje só a pasta local)
vite/           plugin que serve /api/* em desenvolvimento
scripts/        preparação de fontes e verificação de layout
public/fonts/   fontes do gerador de Reels
public/music/   suas trilhas de fundo (não versionadas, pasta nasce vazia)
```

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
- **`BundledFfmpegRenderService`** — `ffmpeg-static`, para o site publicado. Usa
  `-preset veryfast -crf 24` para caber no tempo da função.

## Configuração

### Variáveis de ambiente

Só no servidor, nunca com prefixo `VITE_` (o Vite embutiria a chave no bundle do
browser). Em desenvolvimento saem do `.env.local`; na Vercel, de Project Settings →
Environment Variables.

| Variável | Para quê |
|---|---|
| `PEXELS_API_KEY` | Provedor principal de vídeos. Gratuita, 200 req/h. |
| `PIXABAY_API_KEY` | Fallback de vídeo do Pexels. Gratuita. Opcional. |
| `FFMPEG_PATH` | Caminho do FFmpeg quando não está no PATH. Só afeta o render local. |

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
