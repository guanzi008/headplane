import type React from "react";
import { Form } from "react-router";

import LanguageSwitcher from "~/components/language-switcher";
import Link from "~/components/link";
import LogoMark from "~/components/logo-mark";
import cn from "~/utils/cn";
import { useI18n } from "~/utils/i18n";

import Grid from "./grid";

interface Props {
  title: string;
  description?: React.ReactNode;
  isWide?: boolean;
  children?: React.ReactNode;
}

export default function Shell({ title, description, isWide, children }: Props) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-dvh">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between p-6 sm:p-8">
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <LogoMark className="size-5" />
            headplane
          </span>
          <LanguageSwitcher />
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-6 sm:px-8">
          <div className={cn("w-full", isWide ? "max-w-md" : "max-w-sm")}>
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
            {description && <p className="text-muted mt-1.5">{description}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </main>
        <footer className="text-muted flex flex-wrap items-center justify-between gap-2 p-6 text-xs sm:p-8">
          <p>{t("auth.shell.description")}</p>
          <span className="flex gap-3">
            <Link className="hover:text-fg" external to="https://headplane.net">
              {t("nav.docs")}
            </Link>
            <Link className="hover:text-fg" external to="https://github.com/tale/headplane">
              GitHub
            </Link>
            <span>{__VERSION__}</span>
          </span>
        </footer>
      </div>
      <div aria-hidden className="sticky top-0 hidden h-dvh flex-1 p-3 lg:block">
        <div className="bg-subtle border-line relative size-full overflow-hidden rounded-xl border">
          <Grid />
        </div>
      </div>
    </div>
  );
}

export function SignedIn({ name }: { name: string }) {
  const { t } = useI18n();
  return (
    <Form
      action="/logout"
      className="border-line text-muted mt-6 border-t pt-6 text-sm"
      method="POST"
    >
      {t("auth.signedInAs.before")}
      <span className="text-fg">{name}</span>
      {t("auth.signedInAs.after")}{" "}
      <button className="text-accent focus-ring rounded-sm" type="submit">
        {t("auth.signOut")}
      </button>
    </Form>
  );
}
