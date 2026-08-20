import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { reelsDevApi } from './vite/reelsDevApi'

// https://vite.dev/config/
export default defineConfig({
  // reelsDevApi monta as funções de api/reels/ como middleware do dev server,
  // para que o gerador de Reels funcione em `npm run dev` — busca de vídeo e
  // render precisam de Node, então não dá para desviar para uma API externa
  // como a página da Bíblia faz.
  plugins: [react(), reelsDevApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
