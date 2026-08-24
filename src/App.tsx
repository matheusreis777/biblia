import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "@/i18n/config";
import { AuthProvider } from "@/auth/AuthProvider";
import { UserDataProvider } from "@/auth/UserDataProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { UpdatePrompt } from "@/pwa/UpdatePrompt";
import Index from "./pages/Index.tsx";
import Favorites from "./pages/Favorites.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import "./index.css";

// O gerador de Reels carrega sob demanda: ele traz o opentype.js junto
// (~300KB), que não faz sentido baixar para quem só quer ler a Bíblia.
const Reels = lazy(() => import("./pages/Reels.tsx"));

const PageFallback = () => (
  <div className="min-h-svh bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <UserDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* Rotas fixas antes de /:bookId — senão a dinâmica as capturaria. */}
            <Route
              path="/reels"
              element={
                <Suspense fallback={<PageFallback />}>
                  <Reels />
                </Suspense>
              }
            />
            <Route path="/favoritos" element={<Favorites />} />
            {/* Mesma página pela grafia em inglês, para links não quebrarem. */}
            <Route path="/favorites" element={<Navigate to="/favoritos" replace />} />
            {/* Volta do consentimento do Google, via Supabase. */}
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/:bookId" element={<Index />} />
            <Route path="/:bookId/:chapter" element={<Index />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {/* Fora do <Routes>: o aviso de atualização vale em qualquer página. */}
          <UpdatePrompt />
        </BrowserRouter>
      </UserDataProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
