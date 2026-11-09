import { CircleAlert, Lock, SearchX, ServerOff } from "lucide-react";
import type React from "react";
import { useRevalidator } from "react-router";

import cn from "~/utils/cn";
import { describeError, type ErrorInfo } from "~/utils/describe-error";
import { useI18n, type MessageKey } from "~/utils/i18n";

import Button from "./button";
import Link from "./link";

const icons: Record<ErrorInfo["kind"], typeof CircleAlert> = {
  connection: ServerOff,
  forbidden: Lock,
  not_found: SearchX,
  headscale: CircleAlert,
  unknown: CircleAlert,
};

interface Props {
  error: unknown;
  page?: string;
}

export default function PageError({ error, page = "this page" }: Props) {
  const { t } = useI18n();
  const { revalidate, state } = useRevalidator();
  const info = describeError(error);
  const Icon = icons[info.kind];
  const pageKeys: Record<string, MessageKey> = {
    "this page": "error.page.thisPage",
    machines: "error.page.machines",
    users: "error.page.users",
    "DNS settings": "error.page.dns",
    "the access control policy": "error.page.acls",
    "auth keys": "error.page.authKeys",
    "the agent": "error.page.settings",
    "sign-in restrictions": "error.page.settings",
  };
  const pageLabel = pageKeys[page] ? t(pageKeys[page]) : page;

  const title =
    info.kind === "connection"
      ? t("error.cantLoad", { page: pageLabel })
      : info.kind === "forbidden"
        ? t("error.forbidden", { page: pageLabel })
        : info.kind === "not_found"
          ? t("error.notFound.title")
          : info.kind === "headscale"
            ? t("error.headscale.title")
            : t("error.unknown.title");

  const description =
    info.kind === "connection"
      ? t("error.connection.body")
      : info.kind === "not_found"
        ? t("error.notFound.body")
        : info.kind === "unknown"
          ? t("error.unknown.body")
          : info.description;

  const canRetry = info.kind !== "forbidden" && info.kind !== "not_found";

  return (
    <ErrorState description={description} icon={<Icon />} title={title}>
      {(canRetry || info.kind === "unknown") && (
        <div className="mt-6 flex items-center gap-4">
          {canRetry && (
            <Button onClick={() => revalidate()} pending={state === "loading"}>
              {t("error.tryAgain")}
            </Button>
          )}
          {info.kind === "unknown" && <ReportLink />}
        </div>
      )}
      {info.details && <ErrorDetails className="[&>summary]:mx-auto" details={info.details} />}
    </ErrorState>
  );
}

interface ErrorStateProps {
  icon: React.ReactElement;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}

export function ErrorState({ icon, title, description, children }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <span className="text-muted [&>svg]:size-8">{icon}</span>
      <h2 className="mt-4 text-lg font-semibold text-balance">{title}</h2>
      {description && <p className="text-muted mt-1 max-w-md text-balance">{description}</p>}
      {children}
    </div>
  );
}

export function ErrorDetails({ details, className }: { details: string; className?: string }) {
  const { t } = useI18n();
  return (
    <details className={cn("mt-6 w-full max-w-lg text-left", className)}>
      <summary className="text-muted hover:text-fg w-fit cursor-pointer text-sm">
        {t("error.details")}
      </summary>
      <pre className="bg-subtle mt-2 overflow-x-auto rounded-md p-3 font-mono text-xs break-all whitespace-pre-wrap">
        {details}
      </pre>
    </details>
  );
}

export function ReportLink() {
  const { t } = useI18n();
  return (
    <Link external styled to="https://github.com/tale/headplane/issues/new">
      {t("error.report")}
    </Link>
  );
}
