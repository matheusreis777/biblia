import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { useUserData } from "@/auth/UserDataContext";
import { currentLanguage, type AppLanguage } from "@/lib/language";
import { IconButton } from "./IconButton";
import { Popover } from "./Popover";
import { Segmented } from "./Segmented";
import { Tooltip } from "./Tooltip";

// ─── Idioma ───────────────────────────────────────────────────────────────────
// Um só componente para as duas páginas. Antes havia dois botões diferentes: o
// da Bíblia passava por `setLanguage` (que grava em profiles.language) e o do
// Reels chamava `i18n.changeLanguage` direto — trocar o idioma lá não
// sobrevivia ao próximo login.
//
// O idioma também escolhe a tradução bíblica (pt → almeida, en → web) e as
// vozes da narração, então não é só rótulo de interface.

export function LanguageToggle({ block = false }: { block?: boolean }) {
  const { t, i18n } = useTranslation();
  const { setLanguage } = useUserData();

  return (
    <Segmented<AppLanguage>
      label={t("language.label")}
      value={currentLanguage(i18n.language)}
      onChange={setLanguage}
      block={block}
      options={[
        { value: "pt-BR", label: t("language.portuguese") },
        { value: "en-US", label: t("language.english") },
      ]}
    />
  );
}

export function LanguageMenuButton() {
  const { t, i18n } = useTranslation();
  const code = currentLanguage(i18n.language) === "pt-BR" ? "PT" : "EN";

  return (
    <Popover
      label={t("language.label")}
      className="w-max p-3"
      trigger={(props) => (
        <Tooltip content={t("language.label")}>
          {/* Ícone com o código embaixo: o globo sozinho não diz qual idioma
              está ativo, e "PT"/"EN" sozinho não diz que é seletor de idioma. */}
          <IconButton {...props} label={t("language.label")} className="flex-col gap-0">
            <Languages size={16} />
            <span className="mt-0.5 font-heading text-[9px] font-bold leading-none tracking-wider">
              {code}
            </span>
          </IconButton>
        </Tooltip>
      )}
    >
      <p className="mb-2 px-0.5 font-heading text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t("language.label")}
      </p>
      <LanguageToggle />
    </Popover>
  );
}
