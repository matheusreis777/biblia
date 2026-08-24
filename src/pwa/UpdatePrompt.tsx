import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/Button";

// ─── Aviso de nova versão ─────────────────────────────────────────────────────
// O service worker é registrado com `registerType: "prompt"` (ver
// vite.config.ts): quando um build novo termina de baixar, ele fica esperando
// em vez de assumir sozinho. Isto aqui é o único lugar que o deixa assumir, e
// só depois de alguém clicar — recarregar por conta própria no meio de um
// capítulo faria a pessoa perder onde estava lendo.
//
// O mesmo card serve para o aviso de "pronto para usar offline", que aparece
// uma vez, quando o precache termina.

export function UpdatePrompt() {
  const { t } = useTranslation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      // Acima da barra inferior do iOS em modo standalone; `z-50` fica no mesmo
      // patamar dos overlays, mas o card não bloqueia a leitura atrás dele.
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-card p-4 shadow-soft [padding-bottom:calc(1rem+env(safe-area-inset-bottom))]"
    >
      <p className="font-heading text-sm font-semibold text-foreground">
        {needRefresh ? t("pwa.update_title") : t("pwa.offline_ready_title")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {needRefresh ? t("pwa.update_desc") : t("pwa.offline_ready_desc")}
      </p>

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={close}>
          {needRefresh ? t("pwa.later") : t("common.close")}
        </Button>
        {needRefresh && (
          <Button variant="primary" size="sm" onClick={() => void updateServiceWorker(true)}>
            {t("pwa.update_action")}
          </Button>
        )}
      </div>
    </div>
  );
}
