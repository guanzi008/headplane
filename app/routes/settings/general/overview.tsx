import { useFetcher } from "react-router";

import Button from "~/components/button";
import Callout from "~/components/callout";
import Input from "~/components/input";
import PageError from "~/components/page-error";
import PageHeader from "~/components/page-header";
import Section, { SettingList, SettingRow } from "~/components/section";
import Select from "~/components/select";
import Switch from "~/components/switch";
import { authContext, headscaleConfigContext, integrationContext } from "~/server/context";
import { Capabilities } from "~/server/web/roles";
import type { ActionResult } from "~/utils/form";
import { useI18n } from "~/utils/i18n";
import { toastClientAction } from "~/utils/toast";

import type { Route } from "./+types/overview";
import { generalAction } from "./general-actions";

const logLevels = ["trace", "debug", "info", "warn", "error", "fatal", "panic"] as const;

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = context.get(authContext);
  const config = context.get(headscaleConfigContext);
  await auth.requireCapability(request, Capabilities.configure_server);

  if (!config.readable()) {
    throw new Response(null, { status: 404 });
  }

  return {
    isAutoApplied: context.get(integrationContext) !== undefined,
    settings: config.getGeneralConfig(),
    writable: config.writable(),
  };
}

export const action = generalAction;
export const clientAction = toastClientAction;

export default function Page({ loaderData }: Route.ComponentProps) {
  const { t } = useI18n();
  const { isAutoApplied, settings, writable } = loaderData;
  const isDisabled = !writable;

  return (
    <>
      <PageHeader
        isSubpage
        description={t("settings.general.description")}
        title={t("settings.general.title")}
      />
      <div className="max-w-5xl">
        {isDisabled && <Callout className="mb-6">{t("settings.general.readOnly")}</Callout>}
        {!isDisabled && !isAutoApplied && (
          <Callout className="mb-6" variant="warning">
            {t("settings.general.restart")}
          </Callout>
        )}

        <Section
          description={t("settings.general.node.description")}
          title={t("settings.general.node.title")}
        >
          <DurationSetting expiry={settings.nodeExpiry} isDisabled={isDisabled} />
        </Section>

        <Section
          description={t("settings.general.features.description")}
          title={t("settings.general.features.title")}
        >
          <ToggleSetting
            checked={settings.taildropEnabled}
            description={t("settings.general.taildrop.description")}
            intent="set_taildrop"
            isDisabled={isDisabled}
            label={t("settings.general.taildrop")}
          />
          <ToggleSetting
            checked={settings.autoUpdateEnabled}
            description={t("settings.general.autoUpdate.description")}
            intent="set_auto_update"
            isDisabled={isDisabled}
            label={t("settings.general.autoUpdate")}
          />
        </Section>

        <Section
          description={t("settings.general.server.description")}
          title={t("settings.general.server.title")}
        >
          <ToggleSetting
            checked={settings.disableCheckUpdates}
            description={t("settings.general.checkUpdates.description")}
            intent="set_disable_check_updates"
            isDisabled={isDisabled}
            label={t("settings.general.checkUpdates")}
          />
          <LogLevelSetting isDisabled={isDisabled} level={settings.logLevel} />
        </Section>

        <Section
          description={t("settings.general.policy.description")}
          title={t("settings.general.policy.title")}
        >
          <p className="font-mono text-xs">
            policy.mode: {settings.policyMode === "database" ? "database" : "file"}
          </p>
          <p className="text-muted mt-2 max-w-2xl text-sm">{t("settings.general.policy.note")}</p>
        </Section>
      </div>
    </>
  );
}

function DurationSetting({ expiry, isDisabled }: { expiry: string; isDisabled: boolean }) {
  const { t } = useI18n();
  const fetcher = useFetcher<ActionResult>();
  const errors = fetcher.data?.ok === false ? fetcher.data.errors : undefined;

  return (
    <fetcher.Form className="max-w-xl" method="post">
      <input name="intent" type="hidden" value="set_node_expiry" />
      <div className="flex items-start gap-2">
        <Input
          defaultValue={expiry}
          description={t("settings.general.node.expiryHelp")}
          disabled={isDisabled}
          errorMessage={errors?.expiry}
          invalid={errors?.expiry !== undefined}
          label={t("settings.general.node.expiry")}
          name="expiry"
          placeholder="180d"
          required
        />
        <Button
          className="mt-6"
          disabled={isDisabled}
          pending={fetcher.state !== "idle"}
          type="submit"
        >
          {t("common.save")}
        </Button>
      </div>
      {errors?.form && (
        <Callout className="mt-3" variant="error">
          {errors.form}
        </Callout>
      )}
    </fetcher.Form>
  );
}

function LogLevelSetting({ level, isDisabled }: { level: string; isDisabled: boolean }) {
  const { t } = useI18n();
  const fetcher = useFetcher<ActionResult>();
  const errors = fetcher.data?.ok === false ? fetcher.data.errors : undefined;

  return (
    <fetcher.Form className="mt-5 max-w-xl" method="post">
      <input name="intent" type="hidden" value="set_log_level" />
      <div className="flex items-start gap-2">
        <Select
          className="flex-1"
          defaultValue={logLevels.includes(level as (typeof logLevels)[number]) ? level : "info"}
          description={t("settings.general.logLevel.description")}
          disabled={isDisabled}
          errorMessage={errors?.level}
          invalid={errors?.level !== undefined}
          items={logLevels.map((value) => ({ label: value, value }))}
          label={t("settings.general.logLevel")}
          name="level"
          required
        />
        <Button
          className="mt-6"
          disabled={isDisabled}
          pending={fetcher.state !== "idle"}
          type="submit"
        >
          {t("common.save")}
        </Button>
      </div>
      {errors?.form && (
        <Callout className="mt-3" variant="error">
          {errors.form}
        </Callout>
      )}
    </fetcher.Form>
  );
}

function ToggleSetting({
  checked,
  description,
  intent,
  isDisabled,
  label,
}: {
  checked: boolean;
  description: string;
  intent: string;
  isDisabled: boolean;
  label: string;
}) {
  const { t } = useI18n();
  const fetcher = useFetcher<ActionResult>();
  const pending = fetcher.formData?.get("enabled");
  const enabled = pending ? pending === "true" : checked;
  const error =
    fetcher.data?.ok === false
      ? (fetcher.data.errors.form ?? t("settings.general.saveFailed"))
      : undefined;

  return (
    <div className="mt-5 first:mt-0">
      <SettingList>
        <SettingRow
          action={
            <Switch
              checked={enabled}
              disabled={isDisabled}
              label={label}
              onCheckedChange={(value) =>
                fetcher.submit({ intent, enabled: String(value) }, { method: "post" })
              }
            />
          }
          isMultiline
          label={label}
        >
          <span className="text-muted">{description}</span>
        </SettingRow>
      </SettingList>
      {error && (
        <Callout className="mt-3" variant="error">
          {error}
        </Callout>
      )}
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <PageError error={error} page="server settings" />;
}
