import { useLoaderData } from "react-router";

import Callout from "~/components/callout";
import Link from "~/components/link";
import PageError from "~/components/page-error";
import PageHeader from "~/components/page-header";
import { authContext, headscaleConfigContext, integrationContext } from "~/server/context";
import { Capabilities } from "~/server/web/roles";
import { useI18n } from "~/utils/i18n";
import { toastClientAction } from "~/utils/toast";

import type { Route } from "./+types/overview";
import General from "./components/general";
import ManageDomains from "./components/manage-domains";
import ManageNS from "./components/manage-ns";
import ManageRecords from "./components/manage-records";
import { dnsAction } from "./dns-actions";

// We do not want to expose every config value
export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = context.get(authContext);
  const headscaleConfig = context.get(headscaleConfigContext);

  const principal = await auth.requireCapability(request, Capabilities.read_network);

  // Without Headscale's config there's no DNS page, as the hidden tab suggests.
  if (!headscaleConfig.readable()) {
    throw new Response(null, { status: 404 });
  }

  const writablePermission = auth.can(principal, Capabilities.write_network);

  const dns = headscaleConfig.getDNSConfig();

  return {
    ...dns,
    access: writablePermission,
    writable: headscaleConfig.writable(),
    hasRecordsFile: headscaleConfig.hasRecordsFile(),
    recordsWritable: headscaleConfig.recordsWritable(),
    isAutoApplied: context.get(integrationContext) !== undefined,
  };
}

export const action = dnsAction;

export const clientAction = toastClientAction;

export default function Page() {
  const { t } = useI18n();
  const data = useLoaderData<typeof loader>();
  const isDisabled = data.access === false || data.writable === false;

  return (
    <>
      <PageHeader
        description={
          <>
            {t("dns.description")}{" "}
            <Link external styled to="https://headscale.net/stable/ref/dns">
              {t("common.docs")}
            </Link>
          </>
        }
        title={t("dns.title")}
      />
      <div className="max-w-5xl">
        {isDisabled && (
          <Callout className="mb-6">
            {data.writable ? t("dns.permissionDenied") : t("dns.readOnly")}
          </Callout>
        )}
        {!isDisabled && !data.isAutoApplied && (
          <Callout className="mb-6" variant="warning">
            {t("dns.restart.before")}{" "}
            <Link external styled to="https://headplane.net/configuration/integrations">
              {t("dns.restart.link")}
            </Link>{" "}
            {t("dns.restart.after")}
          </Callout>
        )}
        <General
          baseDomain={data.baseDomain}
          isDisabled={isDisabled}
          isMagicDns={data.magicDns}
          isOverrideDns={data.overrideDns}
        />
        <ManageNS global={data.nameservers} isDisabled={isDisabled} split={data.splitDns} />
        <ManageRecords
          hasRecordsFile={data.hasRecordsFile}
          isDisabled={isDisabled}
          isReadOnly={!data.recordsWritable}
          records={data.extraRecords}
        />
        <ManageDomains
          isDisabled={isDisabled}
          magic={data.magicDns ? data.baseDomain : undefined}
          searchDomains={data.searchDomains}
        />
      </div>
    </>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  return <PageError error={error} page="DNS settings" />;
}
