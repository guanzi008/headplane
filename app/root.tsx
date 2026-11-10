import type { MetaFunction } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  unstable_useRoute as useRoute,
  useHref,
} from "react-router";

import { appConfigContext } from "~/server/context";
import { getLocale, I18nProvider, translate, type Locale } from "~/utils/i18n";
import { LiveDataProvider } from "~/utils/live-data";
import ToastProvider from "~/utils/toast-provider";

import type { Route } from "./+types/root";
import ErrorPage from "./layout/error-page";

import "@fontsource-variable/inter/opsz.css";
import "./tailwind.css";
import { getColorScheme } from "./utils/color-scheme";

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => [
  { title: translate(loaderData?.locale ?? "en", "meta.title") },
  {
    name: "description",
    content: translate(loaderData?.locale ?? "en", "meta.description"),
  },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const [colorScheme, config] = await Promise.all([
    getColorScheme(request),
    Promise.resolve(context.get(appConfigContext)),
  ]);
  return {
    colorScheme,
    locale: getLocale(request) satisfies Locale,
    basePath: config.server.base_path,
    accountCenter: process.env.HSC_CONSOLE_TAILNETS_DIR ? "/idp/account" : undefined,
    platformAccounts:
      process.env.HSC_CONSOLE_TAILNETS_DIR && request.headers.get("X-HSC-Platform-Admin") === "1"
        ? "/idp/users"
        : undefined,
  };
}

export function Layout({ children }: { readonly children: React.ReactNode }) {
  const { loaderData } = useRoute("root");
  const faviconIco = useHref("/favicon.ico");
  const faviconSvg = useHref("/favicon.svg");
  const locale = loaderData?.locale ?? "en";

  // LiveDataProvider is wrapped at the top level since dialogs and things
  // that control its state are usually open in portal containers which
  // are not a part of the normal React tree.
  return (
    <LiveDataProvider>
      <I18nProvider locale={locale}>
        <html
          lang={locale}
          className={
            loaderData?.colorScheme === "dark"
              ? "dark"
              : loaderData?.colorScheme === "light"
                ? "light"
                : ""
          }
        >
          <head>
            <meta charSet="utf-8" />
            <meta content="width=device-width, initial-scale=1" name="viewport" />
            <Meta />
            <Links />
            <link href={faviconIco} rel="icon" sizes="32x32" />
            <link href={faviconSvg} rel="icon" type="image/svg+xml" />
          </head>
          <body className="w-full overflow-x-hidden overscroll-none">
            {children}
            <ToastProvider />
            <ScrollRestoration />
            <Scripts />
          </body>
        </html>
      </I18nProvider>
    </LiveDataProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <ErrorPage error={error} />;
}

export default function App() {
  return <Outlet />;
}
