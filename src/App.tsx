import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "@/i18n/config";
import Index from "./pages/Index.tsx";
import "./index.css";

// O gerador de Reels carrega sob demanda: ele traz o opentype.js junto
// (~300KB), que não faz sentido baixar para quem só quer ler a Bíblia.
const Reels = lazy(() => import("./pages/Reels.tsx"));

const PageFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      {/* Antes de /:bookId — senão a rota dinâmica capturaria "reels". */}
      <Route
        path="/reels"
        element={
          <Suspense fallback={<PageFallback />}>
            <Reels />
          </Suspense>
        }
      />
      <Route path="/:bookId" element={<Index />} />
      <Route path="/:bookId/:chapter" element={<Index />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
