import { Check, Languages } from "lucide-react";
import { unstable_useRoute as useRoute, useLocation } from "react-router";

import { Menu, MenuContent, MenuItem, MenuTrigger } from "~/components/menu";
import cn from "~/utils/cn";
import { adminPath, localeSwitchHref, useI18n } from "~/utils/i18n";

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const rootRoute = useRoute("root");
  const location = useLocation();
  const basePath = rootRoute?.loaderData?.basePath ?? "/admin";
  const returnTo = adminPath(basePath, `${location.pathname}${location.search}`);

  return (
    <Menu>
      <MenuTrigger
        aria-label={t("language.label")}
        className={cn("text-muted hover:bg-hover hover:text-fg size-8 rounded-md", className)}
      >
        <Languages className="size-4" />
      </MenuTrigger>
      <MenuContent align="end">
        {(["zh-CN", "en"] as const).map((targetLocale) => (
          <MenuItem key={targetLocale}>
            <a
              className="flex items-center gap-x-2"
              href={localeSwitchHref(targetLocale, returnTo)}
              hrefLang={targetLocale}
            >
              <span className="flex-1">
                {targetLocale === "zh-CN" ? t("language.chinese") : t("language.english")}
              </span>
              {targetLocale === locale && <Check className="size-4" />}
            </a>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
