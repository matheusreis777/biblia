import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// A URL e a publishable key são públicas por natureza: elas vão para o bundle e
// só dão acesso ao que as políticas de RLS permitirem. Por isso levam o prefixo
// VITE_, ao contrário das chaves de API dos Reels, que ficam só no servidor.
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

/**
 * O login é opcional: sem as variáveis de ambiente o site continua funcionando
 * como Bíblia pública, guardando a última leitura só no navegador. Por isso
 * `supabase` pode ser null e todo consumidor precisa checar antes de usar.
 */
export const isSupabaseConfigured = Boolean(url && publishableKey);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(url!, publishableKey!, {
      auth: {
        // Mantém a sessão no localStorage e renova o token sozinho — é isso que
        // faz a pessoa continuar logada na próxima visita.
        persistSession: true,
        autoRefreshToken: true,
        // Necessário para os links de confirmação de e-mail e de recuperação de
        // senha, que voltam para o site com o código na URL.
        detectSessionInUrl: true,
        flowType: "pkce",
        storageKey: "biblia.auth",
      },
    })
  : null;
