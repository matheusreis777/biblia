import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthContext";
import { AccountPanel } from "./AccountPanel";
import { initialOf, nameOf, photoOf, type GoogleMetadata } from "./googleProfile";
import { AuthDialog } from "./AuthDialog";

// ─── Gatilho da conta ─────────────────────────────────────────────────────────
// `variant="inline"` renderiza o painel aberto, sem popover: é como ele entra
// no menu mobile, onde um dropdown `absolute` seria cortado pelo scroll do
// sheet.

export function AccountButton({
  variant = "popover",
  onNavigate,
}: {
  variant?: "popover" | "inline";
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const { enabled, loading, user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);

  // Sem Supabase configurado não existe conta para oferecer.
  if (!enabled) return null;

  if (loading) {
    return (
      <div className="flex h-11 w-11 items-center justify-center" aria-hidden>
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant={variant === "inline" ? "subtle" : "outline"}
          size={variant === "inline" ? "md" : "sm"}
          onClick={() => setShowDialog(true)}
          className={cn("gap-2", variant === "inline" && "w-full justify-start")}
        >
          <LogIn size={15} />
          {t("auth.sign_in")}
        </Button>
        {showDialog && <AuthDialog onClose={() => setShowDialog(false)} />}
      </>
    );
  }

  const metadata = (user.user_metadata ?? {}) as GoogleMetadata;
  const photo = photoOf(metadata);
  const displayName = nameOf(metadata, user.email);

  const avatar = (
    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-primary/15 font-heading text-xs font-bold text-primary">
      {photo ? (
        <img
          src={photo}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        initialOf(metadata, user.email)
      )}
    </span>
  );

  if (variant === "inline") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-secondary/50">
        <AccountPanel user={user} onNavigate={onNavigate} />
      </div>
    );
  }

  return (
    <Popover
      label={displayName || t("auth.account")}
      className="w-64 overflow-hidden"
      trigger={({ ref, ...props }) => (
        <button
          ref={ref}
          type="button"
          {...props}
          aria-label={displayName || t("auth.account")}
          className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-accent"
        >
          {avatar}
        </button>
      )}
    >
      {(close) => <AccountPanel user={user} onNavigate={close} />}
    </Popover>
  );
}
