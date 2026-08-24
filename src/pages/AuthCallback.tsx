import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useUserData } from "@/auth/UserDataContext";
import { oauthCallbackErrorKey } from "@/auth/authErrors";
import { readAuthErrorFromUrl } from "@/auth/urlAuthError";
import { takeReturnTo } from "@/auth/returnTo";

/**
 * Volta do consentimento do Google. O supabase-js troca o código da URL por uma
 * sessão sozinho (`detectSessionInUrl`); aqui só esperamos isso acontecer e
 * devolvemos a pessoa para o capítulo onde ela estava.
 */
export default function AuthCallback() {
  const { t } = useTranslation();
  const { loading, user } = useAuth();
  const { ready, lastRead } = useUserData();
  const navigate = useNavigate();

  const errorKey = useMemo(() => oauthCallbackErrorKey(readAuthErrorFromUrl()), []);
  // Lido uma única vez: a leitura consome o valor guardado.
  const [returnTo] = useState(() => takeReturnTo());

  const target =
    returnTo ?? (lastRead ? `/${encodeURIComponent(lastRead.bookId)}/${lastRead.chapter}` : "/");

  useEffect(() => {
    if (errorKey || loading || !user || !ready) return;
    navigate(target, { replace: true });
  }, [errorKey, loading, user, ready, navigate, target]);

  // Sem erro na URL e sem sessão depois do carregamento: o código não valeu.
  const failed = Boolean(errorKey) || (!loading && !user);

  if (!failed) {
    return (
      <div className="min-h-screen bg-background text-foreground font-body flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{t("auth.finishing_sign_in")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <XCircle size={22} />
        </div>
        <h1 className="font-heading font-semibold text-lg tracking-tight">{t("auth.sign_in_failed_title")}</h1>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {t(errorKey ?? "auth.errors.oauth_failed")}
        </p>
        <Link
          to="/"
          className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-heading font-bold hover:opacity-90 transition-opacity"
        >
          {t("auth.go_read")}
        </Link>
      </div>
    </div>
  );
}
