import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'
import { reelsDevApi } from './vite/reelsDevApi'
import { openGraph } from './vite/openGraph'

// Origem absoluta da canônica e das tags Open Graph. Na Vercel é o domínio de
// produção — inclusive nos previews, para que a canônica nunca aponte para um
// deploy temporário.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
if (process.env.VERCEL && !productionHost) {
  // Sem ela as prévias de link sairiam apontando para localhost.
  throw new Error('VERCEL_PROJECT_PRODUCTION_URL ausente: ative "Automatically expose System Environment Variables" no projeto')
}
const siteUrl = productionHost ? `https://${productionHost}` : 'http://localhost:5173'

// https://vite.dev/config/
export default defineConfig({
  // reelsDevApi monta as funções de api/reels/ como middleware do dev server,
  // para que o gerador de Reels funcione em `npm run dev` — busca de vídeo e
  // render precisam de Node, então não dá para desviar para uma API externa
  // como a página da Bíblia faz.
  plugins: [
    react(),
    reelsDevApi(),
    openGraph(siteUrl),
    // ─── PWA ─────────────────────────────────────────────────────────────────
    // Instalável e legível offline: o app shell fica pré-cacheado no build e os
    // capítulos já visitados ficam no cache de runtime. Os ícones do manifesto
    // saem de public/favicon.svg via `npm run icons`.
    VitePWA({
      // `prompt` em vez de `autoUpdate`: trocar o app por baixo de quem está
      // lendo perde a posição na página. src/pwa/UpdatePrompt.tsx pergunta.
      registerType: 'prompt',
      // Sem isto o SW só existiria no build, e qualquer erro de estratégia só
      // apareceria em produção.
      devOptions: { enabled: true, type: 'module' },
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Bíblia Online',
        short_name: 'Bíblia',
        description:
          'Leia a Bíblia em português e inglês, salve versículos favoritos e gere Reels a partir deles.',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // Casadas com o tema escuro: é a cor que o script do index.html aplica
        // antes da primeira pintura, então a splash não pisca.
        theme_color: '#0d0d0d',
        background_color: '#0d0d0d',
        categories: ['books', 'education', 'lifestyle'],
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Favoritos',
            url: '/favoritos',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Reels',
            url: '/reels',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // Os .ttf de public/fonts/ ficam de fora de propósito: são ~4MB que só
        // a página /reels usa, e ela tem regra de runtime abaixo.
        // Só o index.html da raiz: os ~1.250 HTMLs por rota de vite/openGraph.ts
        // existem para crawlers, e o SW serve o index.html em toda navegação.
        globPatterns: ['**/*.{js,css,ico,png,svg,webmanifest}', 'index.html'],
        // Matéria-prima da og-image.jpg (~500KB): não é usada pelo app.
        globIgnores: ['icon-biblia.png'],
        // Toda navegação cai no index.html (mesmo papel do rewrite do
        // vercel.json), menos /api — que é função serverless, não rota do app.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Capítulo é texto imutável: uma vez baixado, serve do cache e
            // continua legível sem rede. A revalidação em segundo plano cobre
            // uma eventual correção na tradução.
            urlPattern: ({ url }) => url.pathname === '/api/bible-passage',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'biblia-passagens',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // O versículo do dia muda a cada 24h: rede primeiro, cache como
            // rede de segurança para abrir offline.
            urlPattern: ({ url }) => url.pathname === '/api/daily-verse',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'biblia-versiculo-do-dia',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 2 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Fontes do gerador de Reels: pesadas e imutáveis, entram no cache
            // na primeira visita a /reels em vez de no precache de todo mundo.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/fonts/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'biblia-fontes-reels',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-arquivos',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
