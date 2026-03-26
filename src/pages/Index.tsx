import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen, ChevronLeft, ChevronRight, Search, X,
  ArrowLeft, AlignJustify, Book, Hash, Globe
} from "lucide-react";
import { BIBLE_BOOKS, AT_BOOKS, NT_BOOKS, BibleBook } from "@/data/bibleBooks";
import { useTranslation } from "react-i18next";

interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

interface PassageResponse {
  reference: string;
  verses: BibleVerse[];
  text: string;
}

// ─── Busca o capítulo via API (com fallback direto à bible-api.com em dev) ────
async function fetchChapter(bookId: string, chapter: number, language: string): Promise<PassageResponse> {
  const ref = `${bookId} ${chapter}`.toLowerCase().replace(/\s+/g, "+");
  const translation = language.startsWith("pt") ? "almeida" : "web";
  const devMode = import.meta.env.DEV;
  const url = devMode
    ? `https://bible-api.com/${ref}?translation=${translation}`
    : `/api/bible-passage?ref=${encodeURIComponent(`${bookId} ${chapter}`)}&translation=${translation}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar capítulo");
  return res.json();
}

// ─── Componente de busca inline ────────────────────────────────────────────────
function BibleSearch({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BibleBook[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const q = query.toLowerCase().trim();
    setResults(
      BIBLE_BOOKS.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.abbrev.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-start justify-center pt-20 px-4 font-body">
      <div className="w-full max-w-lg">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("bible.search_placeholder")}
            className="w-full bg-card border border-border rounded-xl pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-base font-body"
          />
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        {results.length > 0 && (
          <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {results.map((book) => (
              <button
                key={book.id}
                onClick={() => { navigate(`/${encodeURIComponent(book.id)}/1`); onClose(); }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-primary/5 transition-colors text-left font-body"
              >
                <span className="text-xs font-heading font-semibold text-primary w-8">{book.abbrev}</span>
                <span className="text-sm text-foreground font-body">{book.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{book.testament === "AT" ? t("bible.old_testament") : t("bible.new_testament")} · {book.chapters} {t("bible.chapters").toLowerCase()}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar com todos os livros ───────────────────────────────────────────────
function BookSidebar({
  selectedBook,
  onSelect,
  onClose,
}: {
  selectedBook?: BibleBook;
  onSelect: (book: BibleBook) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-40 flex font-body">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-72 sm:w-80 h-full bg-card border-r border-border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <span className="font-heading font-semibold text-sm text-foreground uppercase tracking-widest">{t("bible.books")}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/40 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Antigo Testamento */}
          <div className="px-4 pt-4 pb-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-heading font-semibold">
              {t("bible.old_testament")}
            </p>
          </div>
          {AT_BOOKS.map((book) => (
            <button
              key={book.id}
              onClick={() => { onSelect(book); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors group ${
                selectedBook?.id === book.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/40 text-foreground/70 hover:text-foreground"
              }`}
            >
              <span className={`text-[10px] font-heading font-bold w-6 ${selectedBook?.id === book.id ? "text-primary" : "text-muted-foreground"}`}>
                {book.abbrev}
              </span>
              <span className="text-xs font-body font-medium">{book.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {book.chapters} {t("bible.chapters").toLowerCase()}
              </span>
            </button>
          ))}

          {/* Novo Testamento */}
          <div className="px-4 pt-5 pb-1">
            <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-heading font-semibold">
              {t("bible.new_testament")}
            </p>
          </div>
          {NT_BOOKS.map((book) => (
            <button
              key={book.id}
              onClick={() => { onSelect(book); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors group ${
                selectedBook?.id === book.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted/40 text-foreground/70 hover:text-foreground"
              }`}
            >
              <span className={`text-[10px] font-heading font-bold w-6 ${selectedBook?.id === book.id ? "text-primary" : "text-muted-foreground"}`}>
                {book.abbrev}
              </span>
              <span className="text-xs font-body font-medium">{book.name}</span>
              <span className="ml-auto text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {book.chapters} {t("bible.chapters").toLowerCase()}
              </span>
            </button>
          ))}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function BibliaPage() {
  const { bookId, chapter } = useParams<{ bookId?: string; chapter?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentBook = BIBLE_BOOKS.find((b) => b.id === decodeURIComponent(bookId ?? "")) ?? BIBLE_BOOKS[0];
  const currentChapter = Math.min(Math.max(Number(chapter) || 1, 1), currentBook.chapters);

  const [passage, setPassage] = useState<PassageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [showChapterGrid, setShowChapterGrid] = useState(false);

  const toggleLanguage = () => {
    const nextLng = i18n.language.startsWith("pt") ? "en-US" : "pt-BR";
    i18n.changeLanguage(nextLng);
  };

  const loadChapter = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPassage(null);
    try {
      const data = await fetchChapter(currentBook.id, currentChapter, i18n.language);
      setPassage(data);
    } catch {
      setError(t("bible.load_error"));
    } finally {
      setLoading(false);
    }
  }, [currentBook.id, currentChapter, i18n.language, t]);

  useEffect(() => {
    loadChapter();
    window.scrollTo({ top: 0 });
    setHighlightedVerse(null);
  }, [loadChapter]);

  const goToChapter = (ch: number) => {
    navigate(`/${encodeURIComponent(currentBook.id)}/${ch}`);
  };

  const goToBook = (book: BibleBook) => {
    navigate(`/${encodeURIComponent(book.id)}/1`);
  };

  const prevChapter = () => {
    if (currentChapter > 1) goToChapter(currentChapter - 1);
    else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
      if (idx > 0) navigate(`/${encodeURIComponent(BIBLE_BOOKS[idx - 1].id)}/${BIBLE_BOOKS[idx - 1].chapters}`);
    }
  };

  const nextChapter = () => {
    if (currentChapter < currentBook.chapters) goToChapter(currentChapter + 1);
    else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
      if (idx < BIBLE_BOOKS.length - 1) navigate(`/${encodeURIComponent(BIBLE_BOOKS[idx + 1].id)}/1`);
    }
  };

  const hasPrev = currentChapter > 1 || BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id) > 0;
  const hasNext =
    currentChapter < currentBook.chapters ||
    BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id) < BIBLE_BOOKS.length - 1;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* ── Topbar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <a
            href="https://matheus-reis-fullstack-vision.vercel.app/"
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/40"
            title={t("bible.back_to_site")}
          >
            <ArrowLeft size={18} />
          </a>

          <button
            onClick={() => setShowSidebar(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
          >
            <AlignJustify size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-heading font-medium text-foreground/80 hidden sm:block font-body uppercase tracking-wider">{currentBook.name}</span>
          </button>

          {/* Livro + capítulo atual */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="text-xs text-primary font-heading font-semibold hidden sm:block">{currentBook.abbrev}</span>
            <button
              onClick={() => setShowChapterGrid(!showChapterGrid)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Hash size={12} />
              <span className="text-xs font-heading font-semibold">{currentChapter}</span>
            </button>
            <span className="text-xs text-muted-foreground truncate hidden md:block">
              {currentBook.name} {currentChapter}
            </span>
          </div>

          <button
            onClick={() => setShowSearch(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/40"
          >
            <Search size={18} />
          </button>

          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
            title={i18n.language.startsWith("pt") ? "Change to English" : "Mudar para Português"}
          >
            <Globe size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/70 group-hover:text-primary min-w-[18px]">
              {i18n.language.startsWith("pt") ? "EN" : "PT"}
            </span>
          </button>
        </div>

        {/* Grade de capítulos */}
        {showChapterGrid && (
          <div className="border-t border-border bg-card px-4 py-3 animate-in fade-in slide-in-from-top-2">
            <div className="max-w-3xl mx-auto">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-heading mb-3 flex items-center gap-2">
                <Hash size={10} className="text-primary" />
                {t("bible.chapters")} — <span className="text-foreground">{currentBook.name}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 pb-1">
                {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => { goToChapter(ch); setShowChapterGrid(false); }}
                    className={`w-9 h-9 rounded-lg text-xs font-heading font-bold transition-all ${
                      ch === currentChapter
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-muted/40 text-foreground/60 hover:bg-primary/20 hover:text-primary"
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── Conteúdo principal ────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 font-body">
        {/* Cabeçalho do capítulo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <BookOpen size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-semibold text-foreground tracking-tight">
              {currentBook.name}
            </h1>
            <p className="text-xs text-muted-foreground font-body font-medium uppercase tracking-wider mt-0.5">
              {t("bible.chapters")} {currentChapter} · {currentBook.testament === "AT" ? t("bible.old_testament") : t("bible.new_testament")}
            </p>
          </div>
        </div>

        {/* Estados */}
        {loading && (
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-6 h-4 bg-muted/60 rounded shrink-0 mt-1" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-muted/60 rounded w-full" />
                  <div className="h-4 bg-muted/60 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-20 flex flex-col items-center">
            <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
              <X size={32} />
            </div>
            <p className="text-muted-foreground mb-6 font-medium">{error}</p>
            <button
              onClick={loadChapter}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-heading font-bold hover:opacity-90 transition-opacity active:scale-95"
            >
              {t("bible.retry")}
            </button>
          </div>
        )}

        {passage && !loading && (
          <div className="space-y-1">
            {passage.verses.map((v) => (
              <div
                key={v.verse}
                onClick={() => setHighlightedVerse(highlightedVerse === v.verse ? null : v.verse)}
                className={`flex gap-4 px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                  highlightedVerse === v.verse
                    ? "bg-primary/10 border border-primary/20 shadow-sm"
                    : "hover:bg-muted/30 border border-transparent"
                }`}
              >
                <span className={`text-xs font-heading font-bold mt-1.5 w-6 shrink-0 text-right transition-colors ${
                  highlightedVerse === v.verse ? "text-primary scale-110" : "text-muted-foreground/40 group-hover:text-muted-foreground"
                }`}>
                  {v.verse}
                </span>
                <p className={`text-base sm:text-[17px] leading-relaxed transition-colors font-body ${
                  highlightedVerse === v.verse ? "text-foreground font-medium" : "text-foreground/80"
                }`}>
                  {v.text.trim()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Navegação fixa no rodapé ────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <button
            onClick={prevChapter}
            disabled={!hasPrev}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-heading font-bold text-foreground/80 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed group active:scale-95"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:block">{t("bible.prev")}</span>
          </button>

          {/* Indicador de progresso */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[10px] text-muted-foreground font-heading font-bold tracking-widest uppercase">
              {currentChapter} / {currentBook.chapters}
            </span>
            <div className="w-full max-w-[180px] h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(currentChapter / currentBook.chapters) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={nextChapter}
            disabled={!hasNext}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-heading font-bold text-foreground/80 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed group active:scale-95"
          >
            <span className="hidden sm:block">{t("bible.next")}</span>
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </nav>

      {/* ── Overlays ────────────────────────────────────────────────── */}
      {showSidebar && (
        <BookSidebar
          selectedBook={currentBook}
          onSelect={goToBook}
          onClose={() => setShowSidebar(false)}
        />
      )}
      {showSearch && <BibleSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
}
