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

// Sem as variáveis, toda a interface de conta simplesmente não é renderizada —
// o que é o comportamento certo para o visitante, mas é indistinguível de um
// bug para quem está publicando. Estas duas linhas transformam "o botão de
// entrar sumiu" em uma resposta imediata no console.
//
// Vale lembrar que são variáveis VITE_: elas são embutidas no BUILD. Cadastrar
// na Vercel depois do deploy não muda nada até um novo build rodar.
if (!isSupabaseConfigured) {
  const faltando = [
    !url && "VITE_SUPABASE_URL",
    !publishableKey && "VITE_SUPABASE_PUBLISHABLE_KEY",
  ].filter(Boolean);
  console.warn(
    `[biblia] Login desativado: falta ${faltando.join(" e ")} no build. ` +
      "A leitura e os favoritos seguem funcionando, guardados só neste navegador. " +
      "Para ativar, cadastre as variáveis no ambiente e refaça o build.",
  );
}

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
