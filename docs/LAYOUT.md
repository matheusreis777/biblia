# Layout do sistema — web e mobile

Estrutura visual da Bíblia Online depois do redesenho de agosto de 2026.

O projeto **passou a ter uma camada de componentes** (`src/components/ui/` e
`src/components/layout/`). Antes o layout era Tailwind aplicado direto no JSX,
com o leitor inteiro num arquivo de 521 linhas; hoje as páginas são composição.

---

## 1. Fundamentos

### Breakpoints

Padrões do Tailwind, mais um `xs` que agora **existe de verdade** (ele estava
declarado em `theme.container.screens`, que configura só o utilitário
`.container` e não cria variante — ver [Histórico](#8-histórico)).

| Prefixo | A partir de | Onde muda o layout |
|---|---|---|
| _(base)_ | 0 | Header de toque, seções em abas no estúdio |
| `xs` | 400px | Rótulos nas ações do versículo |
| `sm` | 640px | Header cresce para 64px; rótulos no rodapé de capítulos |
| `md` | 768px | Header troca para o desenho de desktop |
| `lg` | 1024px | Estúdio em duas colunas; seletor de livros vira painel duplo |
| `xl` / `2xl` | 1280 / 1536px | Contêineres já no máximo; só aumenta a margem |

### Temas

**Claro e escuro, com opção "sistema"** — `src/theme/ThemeProvider.tsx`.

- `:root` carrega a paleta clara, `.dark` a escura. Não é inversão automática:
  cada tema tem valores próprios.
- A classe entra no `<html>` por um script inline no `index.html`, **antes da
  primeira pintura** — sem ele a página piscaria clara antes de escurecer.
- A escolha vai para `localStorage["biblia.theme"]`. Não sincroniza com a
  conta: `profiles` só tem coluna de idioma, e tema é preferência de
  dispositivo.
- A transição de cor só existe durante a troca (classe `.theme-transition`, ~180ms).

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--background` | `40 30% 98%` | `0 0% 5.1%` | Fundo da página |
| `--card` | `0 0% 100%` | `0 0% 9%` | Cartões e painéis |
| `--secondary` | `40 18% 95%` | `0 0% 13%` | Superfície de apoio |
| `--accent` | `40 20% 91%` | `0 0% 16%` | Hover de linha e de item |
| `--muted-foreground` | `28 6% 42%` | `0 0% 58%` | Texto secundário |
| `--border` | `36 14% 88%` | `0 0% 17%` | Bordas |
| `--primary` | `142 64% 30%` | `142 70% 45%` | Verde de destaque |
| `--primary-foreground` | branco | quase preto | Texto sobre o verde |
| `--highlight` | `142 38% 93%` | `142 34% 13%` | Versículo selecionado |

Duas escolhas que não são simetria:

- o claro é **quente** (`40 30% 98%`, não branco puro) porque branco puro cansa
  em leitura longa;
- o verde do claro é mais fechado, e o texto sobre ele inverte por tema: branco
  sobre o verde claro do modo escuro daria 2,3:1.

### Tipografia

Três famílias:

- **`font-heading`** — Space Grotesk. Títulos, rótulos, números, botões.
- **`font-body`** — Inter. Interface e texto corrido.
- **`--reading-family`** — Source Serif 4 por padrão, alternável para Inter nas
  preferências de leitura. **Só o texto bíblico usa.**

O texto do versículo lê três variáveis CSS (`--reading-size`,
`--reading-leading`, `--reading-family`) que `useReaderSettings` escreve no
`<html>` — nenhum componente precisa saber que a preferência existe.

As famílias `Reel*` do `@font-face` são independentes e existem só para o
gerador de vídeo — são os mesmos arquivos `.ttf` que o servidor usa para medir
e rasterizar, e por isso não devem ser trocadas por webfonts.

---

## 2. Containers

| Página | Header | Conteúdo |
|---|---|---|
| Leitor | `max-w-5xl` | `max-w-[42rem]` (~62 caracteres por linha) |
| Favoritos | `max-w-3xl` | `max-w-3xl` |
| Estúdio de Reels | `max-w-6xl` | `max-w-6xl` |

O header é mais largo que a coluna de leitura de propósito: a navegação
emoldura o texto em vez de espremer com ele.

---

## 3. Header

Um só componente (`src/components/layout/AppHeader.tsx`) com **dois desenhos**,
não um comprimido no outro. Altura: 56px no mobile, 64px a partir de `sm`.

**Desktop (≥768px)**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Bíblia Online │ [João  3 ▾]      ⌕ Pesquisar  ⌘K      [Aa][★][▦] │ [☾][PT][●] │
└────────────────────────────────────────────────────────────────────────────┘
```

Dois grupos separados por um divisor de 1px: **navegação bíblica** (o seletor
contextual de livro e capítulo, num gatilho só) e **ações**.

**Mobile (<768px)**

```
┌───────────────────────────────────────┐
│ [☰]         João 3           [⌕] [•••] │
└───────────────────────────────────────┘
```

Os três pontos abrem um bottom sheet (`MobileMenu`) com Favoritos, Reels,
preferências de leitura, tema, idioma e conta. Cada linha tem 48px.

O botão de voltar ao site **saiu do header**: virou crédito no rodapé.

---

## 4. Leitor

```
┌──────────────────────────────────────────────────┐
│ HEADER sticky                                    │
├──────────────────────────────────────────────────┤
│   NOVO TESTAMENTO                                │
│   João                                           │
│   Capítulo 3 · 21 capítulos                      │
│   ──────────────────────────────────────────     │
│                                                  │
│    1  No princípio era o Verbo…              ☆   │
│    2  Ele estava no princípio com Deus…      ☆   │
│       ┌─────────────────────────────────┐        │
│       │ ☆ Favoritar ⧉ Copiar ↗ ▣ Reel   │        │
│       └─────────────────────────────────┘        │
│                                                  │
│   RODAPÉ (crédito)                               │
├──────────────────────────────────────────────────┤
│ ▬▬▬▬▬▭▭▭▭▭▭▭▭  filete de progresso, 2px          │
│ [← Capítulo anterior]  João 3 de 21  [Próximo →] │
└──────────────────────────────────────────────────┘
```

- **Versículo** (`components/bible/Verse.tsx`) é um grid de três colunas —
  número · texto · estrela — e **não um cartão**. A seleção é uma banda que
  sangra para fora da coluna (`-mx-3` compensado por `px-3`).
- **Estrela**: `pointer-coarse:opacity-100` garante visibilidade em toque; em
  ponteiro fino aparece no hover/foco da linha e fica fixa quando favoritada.
  Alvo real de 44×44.
- **Barra de ações** aparece sob o versículo selecionado, dentro do fluxo:
  favoritar, copiar, compartilhar (Web Share com fallback) e criar Reel.
- **Progresso** virou um filete de 2px na borda superior da barra de capítulos,
  em largura total. A trilha arredondada no meio lia como player.
- **Gestos e teclado**: swipe horizontal com trava de eixo (complemento, nunca
  requisito); `←`/`→` capítulo, `⌘K` ou `/` busca, `b` livros, `Esc` fecha.

---

## 5. Seletor de livros e busca

| Superfície | Desktop | Mobile |
|---|---|---|
| Livros e capítulos | Painel esquerdo de 640px, lista e grade **lado a lado** | Bottom sheet a `85svh` |
| Busca global | Command palette centrada, `max-w-xl` | Mesmo painel, colado no topo |

O sheet mobile não ocupa a tela inteira de propósito: ver uma faixa do capítulo
por trás é o que mantém a noção de onde se estava.

A busca entende **referências** (`Jo 3:16`, `Gn 1`, `1co 13`) via
`src/lib/reference.ts` e mostra o trecho do versículo antes de navegar. Busca
por palavra em toda a Bíblia ficou de fora: a bible-api.com não tem esse
endpoint, e cobri-la exigiria indexar o texto num backend próprio.

---

## 6. Estúdio de Reels

**Desktop (≥1024px)** — `minmax(0,1fr) 20rem`, seções empilhadas com divisores
(não cartões) e coluna do preview `sticky top-24`.

**Mobile (<1024px)** — preview **no topo**, sticky sob o header, com altura
limitada a `34svh`; seções viram abas roláveis; gerar mora numa barra fixa
embaixo, com `env(safe-area-inset-bottom)`.

O preview é responsivo: `ReelsPreview` mede a caixa com `ResizeObserver` e
passa a largura ao `PhonePreview`, que já derivava a escala de
`width / layout.width`. A caixa é `aspect-[9/16]` e a proporção resolve nas duas
direções — no desktop manda a largura, no mobile manda a altura.

**O motor não foi tocado**: `src/reels/**`, `server/**` e `api/**` seguem como
estavam, e `npm run verify:layout` continua passando.

---

## 7. Overlays

Todos nascem de `src/components/ui/Overlay.tsx`.

| Overlay | Ancoragem | Dimensões |
|---|---|---|
| Livros (desktop) | `Sheet side="left"` | `min(40rem, 92vw)` |
| Livros (mobile) | `Sheet side="bottom"` | `max-h-[85svh]` |
| Menu mobile | `Sheet side="bottom"` | `max-h-[85svh]` |
| Busca | `Overlay` centrado no topo | `max-w-xl` |
| Login | `Modal` | `max-w-[22rem]` |
| Conta, tema, idioma, leitura | `Popover` (`absolute`) | 16–17rem |

**Portal obrigatório para overlays `fixed`.** Os gatilhos ficam no `<header>`,
que tem `backdrop-blur`; pela spec, `backdrop-filter` cria um *containing block*
para descendentes `position: fixed`, e sem o portal o `inset-0` se ancorava na
faixa do header. O `Popover` é exceção porque é `absolute` — ali o containing
block é justamente o que se quer.

`Overlay` mantém uma **pilha**: só o do topo responde ao `Esc` e prende o foco,
porque eles aninham de verdade (o login abre de dentro do menu mobile).

---

## 8. Histórico

Três defeitos medidos em 21/08/2026 e corrigidos no redesenho:

| Defeito | Correção |
|---|---|
| `xs: "400px"` em `theme.container.screens` não criava variante — `hidden xs:block` era `display:none` em toda largura | Movido para `theme.extend.screens` |
| Os 11 alvos de toque medidos em 375px ficavam abaixo de 44×44 (estrela: 22×22) | `IconButton`/`Button` garantem `min-h-11`; alvos que não podem crescer usam pseudo-elemento (`after:-inset-1`) |
| Estrela de favoritar em `opacity-0 group-hover:opacity-100` — invisível em toque, sem affordance no celular | `pointer-coarse:opacity-100`, e favoritos ganharam rota própria |

Também resolvidos: header mobile com 7 ícones (virou `☰ · título · ⌕ · •••`),
preview do Reels no fim da página no mobile (foi para o topo), ausência de tema
claro, e o toggle de idioma do Reels que não gravava em `profiles.language`.

---

## Referências no código

| O que | Onde |
|---|---|
| Casca, header, menu mobile, rodapé | `src/components/layout/` |
| Leitor, versículo, seletor, busca, preferências | `src/components/bible/` |
| Primitivos (botões, sheet, popover, campos) | `src/components/ui/` |
| Tema claro/escuro | `src/theme/`, `index.html` |
| Favoritos | `src/hooks/useFavorites.ts`, `src/pages/Favorites.tsx` |
| Estúdio de Reels | `src/components/reels/ReelsStudio.tsx` e vizinhos |
| Referências bíblicas (`Jo 3:16`) | `src/lib/reference.ts` |
| Tokens de cor e fontes | `src/index.css` |
| Breakpoints, fontes, sombras | `tailwind.config.ts` |
