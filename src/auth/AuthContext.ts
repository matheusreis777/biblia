import { createContext, useContext } from "react";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthContextValue {
  /** false quando o projeto não tem as variáveis do Supabase configuradas. */
  enabled: boolean;
  /** true enquanto a sessão salva no navegador ainda está sendo restaurada. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  /**
   * Manda a pessoa para o consentimento do Google. Sai da página; a volta cai
   * em /auth/callback. Só devolve algo quando falha antes de sair daqui —
   * nesse caso, a chave de tradução do erro.
   */
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
