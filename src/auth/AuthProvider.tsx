import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import { authErrorKey } from "./authErrors";
import { rememberReturnTo } from "./returnTo";

/** Rota que recebe a volta do Google (via Supabase). */
export const CALLBACK_PATH = "/auth/callback";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // Sem Supabase configurado não há sessão para restaurar: já começa pronto.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    // getSession lê a sessão do localStorage e renova o token se estiver
    // vencido — é o passo que mantém a pessoa logada entre visitas.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<string | null> => {
    if (!supabase) return "auth.errors.not_configured";

    rememberReturnTo(window.location.pathname + window.location.search);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: new URL(CALLBACK_PATH, window.location.origin).toString(),
        // Deixa a pessoa escolher a conta em vez de reusar a última do Google.
        queryParams: { prompt: "select_account" },
      },
    });

    // Sem erro o navegador já está saindo da página rumo ao Google.
    return authErrorKey(error);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      signInWithGoogle,
      signOut,
    }),
    [loading, session, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
