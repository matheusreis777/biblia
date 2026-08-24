/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** URL do projeto Supabase. Pública: vai no bundle. */
  readonly VITE_SUPABASE_URL?: string;
  /** Publishable key (sb_publishable_...). Pública: o que protege é o RLS. */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
