import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "@/i18n/config";
import Index from "./pages/Index.tsx";
import "./index.css";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/:bookId" element={<Index />} />
      <Route path="/:bookId/:chapter" element={<Index />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
