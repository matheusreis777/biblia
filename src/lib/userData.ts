// Tipos e persistência local dos dados do leitor.
//
// Tudo aqui funciona sem conta: o localStorage é a fonte imediata, e quem faz
// login ganha a mesma informação replicada no Supabase para sincronizar entre
// dispositivos. Os dois formatos são iguais de propósito, para a mesclagem no
// login ser trivial.

export interface LastRead {
  bookId: string;
  chapter: number;
  /** ISO. Usado para decidir quem vence quando local e nuvem divergem. */
  updatedAt: string;
}

export interface FavoriteVerse {
  bookId: string;
  chapter: number;
  verse: number;
  text: string | null;
  /** ISO. */
  createdAt: string;
}

export const favoriteKey = (f: Pick<FavoriteVerse, "bookId" | "chapter" | "verse">) =>
  `${f.bookId}:${f.chapter}:${f.verse}`;

const LAST_READ_KEY = "biblia.last-read";
const FAVORITES_KEY = "biblia.favorites";

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Modo privativo, cota estourada ou JSON corrompido: seguir sem dados
    // locais é melhor do que derrubar a página.
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignorado: ver readJson */
  }
}

function isValidLastRead(value: unknown): value is LastRead {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<LastRead>;
  return (
    typeof v.bookId === "string" &&
    v.bookId.length > 0 &&
    typeof v.chapter === "number" &&
    Number.isFinite(v.chapter) &&
    v.chapter > 0 &&
    typeof v.updatedAt === "string"
  );
}

export function loadLocalLastRead(): LastRead | null {
  const value = readJson<unknown>(LAST_READ_KEY);
  return isValidLastRead(value) ? value : null;
}

export function saveLocalLastRead(lastRead: LastRead) {
  writeJson(LAST_READ_KEY, lastRead);
}

export function loadLocalFavorites(): FavoriteVerse[] {
  const value = readJson<unknown>(FAVORITES_KEY);
  if (!Array.isArray(value)) return [];
  return value.filter((f): f is FavoriteVerse => {
    if (!f || typeof f !== "object") return false;
    const v = f as Partial<FavoriteVerse>;
    return (
      typeof v.bookId === "string" &&
      typeof v.chapter === "number" &&
      typeof v.verse === "number" &&
      typeof v.createdAt === "string"
    );
  });
}

export function saveLocalFavorites(favorites: FavoriteVerse[]) {
  writeJson(FAVORITES_KEY, favorites);
}

/** Une duas listas de favoritos sem duplicar (o mais antigo vence). */
export function mergeFavorites(a: FavoriteVerse[], b: FavoriteVerse[]): FavoriteVerse[] {
  const byKey = new Map<string, FavoriteVerse>();
  for (const fav of [...a, ...b]) {
    const key = favoriteKey(fav);
    const existing = byKey.get(key);
    if (!existing || fav.createdAt < existing.createdAt) byKey.set(key, fav);
  }
  return [...byKey.values()].sort((x, y) => x.createdAt.localeCompare(y.createdAt));
}
