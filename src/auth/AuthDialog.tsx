import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookMarked, Cloud, Loader2, Star, X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Sheet";
import { useAuth } from "./AuthContext";

/** Logotipo oficial do Google, exigido pelas diretrizes do botão de login. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

const BENEFITS = [
  { icon: BookMarked, key: "auth.benefit_last_read" },
  { icon: Star, key: "auth.benefit_favorites" },
  { icon: Cloud, key: "auth.benefit_devices" },
] as const;

// O portal, a trava de rolagem, o Esc e o foco preso ficam no <Modal> — que
// nasceu justamente da lição deste arquivo sobre `backdrop-filter` criar
// containing block para descendentes `fixed`. Ver src/components/ui/Overlay.tsx.
export function AuthDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { signInWithGoogle } = useAuth();

  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    setErrorKey(null);
    // Em caso de sucesso o navegador sai daqui rumo ao Google e este componente
    // é desmontado; só voltamos a rodar se algo falhou antes disso.
    const error = await signInWithGoogle();
    if (error) {
      setErrorKey(error);
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} label={t("auth.sign_in")} className="max-w-[22rem]">
      <div className="relative px-7 pb-7 pt-9">
        <IconButton
          label={t("auth.close")}
          size="sm"
          onClick={onClose}
          className="absolute right-2.5 top-2.5"
        >
          <X size={16} />
        </IconButton>

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookMarked size={20} />
          </div>
          <h2 className="font-heading text-[19px] font-semibold tracking-tight text-foreground">
            {t("auth.sign_in")}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {t("auth.subtitle_signin")}
          </p>
        </div>

        <ul className="mx-auto mb-7 mt-7 w-fit space-y-3">
          {BENEFITS.map(({ icon: Icon, key }) => (
            <li key={key} className="flex items-center gap-3 text-[13px] text-foreground/75">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <Icon size={12} className="text-primary" />
              </span>
              {t(key)}
            </li>
          ))}
        </ul>

        {errorKey && (
          <p
            role="alert"
            className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {t(errorKey)}
          </p>
        )}

        {/* Branco sólido nos dois temas: é o padrão do Google, e no tema escuro
            é o único jeito de o botão não sumir dentro do card. */}
        <button
          type="button"
          onClick={handleSignIn}
          disabled={busy}
          className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-[#1f1f1f] shadow-soft transition-all hover:bg-white/90 active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : <GoogleMark />}
          <span className="font-heading text-sm font-semibold">
            {t("auth.continue_with_google")}
          </span>
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
          {t("auth.privacy_note")}
        </p>
      </div>
    </Modal>
  );
}
