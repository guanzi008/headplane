import { NavLink, Outlet } from "react-router";

import PageHeader from "~/components/page-header";
import { authContext, headscaleConfigContext } from "~/server/context";
import { Capabilities } from "~/server/web/roles";
import cn from "~/utils/cn";
import { useI18n, type MessageKey } from "~/utils/i18n";

import type { Route } from "./+types/layout";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = context.get(authContext);
  const principal = await auth.require(request);
  const headscaleConfig = context.get(headscaleConfigContext);

  return {
    canConfigureServer: auth.can(principal, Capabilities.configure_server),
    hasRestrictions: headscaleConfig.writable() && headscaleConfig.hasOIDCConfig(),
  };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const { t } = useI18n();
  const items: { to: string; label: MessageKey }[] = [
    ...(loaderData.canConfigureServer
      ? [{ to: "/settings/general", label: "settings.general" as const }]
      : []),
    { to: "/settings/auth-keys", label: "settings.authKeys" },
    ...(loaderData.hasRestrictions
      ? [{ to: "/settings/restrictions", label: "settings.restrictions" as const }]
      : []),
    { to: "/settings/agent", label: "settings.agent" },
  ];

  return (
    <>
      <PageHeader description={t("settings.description")} title={t("settings.title")} />
      <div className="grid gap-x-12 gap-y-6 md:grid-cols-[11rem_minmax(0,1fr)]">
        <nav aria-label={t("settings.title")} className="min-w-0">
          <ul className="-mx-2 flex gap-1 overflow-x-auto md:mx-0 md:flex-col">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      "focus-ring flex h-8 items-center rounded-md px-2 text-sm whitespace-nowrap",
                      isActive
                        ? "bg-subtle text-fg font-medium"
                        : "text-muted hover:bg-hover hover:text-fg",
                    )
                  }
                  prefetch="intent"
                  to={item.to}
                >
                  {t(item.label)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  );
}
