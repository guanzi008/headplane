import { useFetcher } from "react-router";

import Callout from "~/components/callout";
import Section, { SettingList, SettingRow } from "~/components/section";
import Switch from "~/components/switch";
import type { ActionResult } from "~/utils/form";
import { useI18n } from "~/utils/i18n";

import RenameTailnet from "./rename-tailnet";

interface Props {
  baseDomain: string;
  isMagicDns: boolean;
  isOverrideDns: boolean;
  isDisabled: boolean;
}

export default function General({ baseDomain, isMagicDns, isOverrideDns, isDisabled }: Props) {
  const { t } = useI18n();
  const magic = useToggle("toggle_magic", isMagicDns, t("dns.saveFailed"));
  const override = useToggle("override_dns", isOverrideDns, t("dns.saveFailed"));
  const error = magic.error ?? override.error;

  return (
    <Section description={t("dns.general.description")} title={t("dns.general.title")}>
      <SettingList>
        <SettingRow
          action={<RenameTailnet isDisabled={isDisabled} name={baseDomain} />}
          label={t("dns.tailnetName")}
        >
          <span className="font-mono text-xs">{baseDomain}</span>
        </SettingRow>
        <SettingRow
          action={
            <Switch
              checked={magic.isEnabled}
              disabled={isDisabled}
              label={t("dns.magicDns")}
              onCheckedChange={magic.submit}
            />
          }
          label={t("dns.magicDns")}
        >
          {magic.isEnabled ? (
            <span className="font-mono text-xs">[device].{baseDomain}</span>
          ) : (
            <span className="text-muted">{t("dns.magicOff")}</span>
          )}
        </SettingRow>
        <SettingRow
          action={
            <Switch
              checked={override.isEnabled}
              disabled={isDisabled}
              label={t("dns.override")}
              onCheckedChange={override.submit}
            />
          }
          label={t("dns.override")}
        >
          <span className="text-muted">
            {override.isEnabled ? t("dns.overrideOn") : t("dns.overrideOff")}
          </span>
        </SettingRow>
      </SettingList>
      {error && (
        <Callout className="mt-3" variant="error">
          {error}
        </Callout>
      )}
    </Section>
  );
}

// Each switch gets its own fetcher so flipping both quickly doesn't cancel
// the first submit.
function useToggle(intent: string, isSaved: boolean, fallbackError: string) {
  const fetcher = useFetcher<ActionResult>();
  const pending = fetcher.formData?.get("enabled");

  return {
    isEnabled: pending ? pending === "true" : isSaved,
    error: fetcher.data?.ok === false ? (fetcher.data.errors.form ?? fallbackError) : undefined,
    submit: (checked: boolean) => {
      fetcher.submit({ intent, enabled: String(checked) }, { method: "POST" });
    },
  };
}
