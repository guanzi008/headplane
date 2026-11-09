import { Construction, Eye, FileX, FlaskConical, Pencil, Shield, TagsIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Suspense, lazy, useMemo, useState } from "react";
import { isRouteErrorResponse, useFetcher } from "react-router";

import Button from "~/components/button";
import Callout from "~/components/callout";
import Link from "~/components/link";
import PageError, { ErrorState } from "~/components/page-error";
import PageHeader from "~/components/page-header";
import { Tabs, TabsList, TabsPanel, TabsTab } from "~/components/tabs";
import { isApiError } from "~/server/headscale/api/error-client";
import {
  parsePolicy,
  policyDestinations,
  policySources,
  serializePolicy,
  type Policy,
} from "~/utils/acl-policy";
import type { ActionResult } from "~/utils/form";
import { useI18n } from "~/utils/i18n";
import { toastClientAction } from "~/utils/toast";

import type { Route } from "./+types/overview";
import { aclAction } from "./acl-action";
import { aclLoader } from "./acl-loader";
import Fallback from "./components/fallback";
import RulesEditor from "./components/rules-editor";
import TagsGroupsEditor from "./components/tags-groups-editor";

const LazyEditor = lazy(() =>
  import("./components/cm.client").then((m) => ({ default: m.Editor })),
);
const LazyDiffer = lazy(() =>
  import("./components/cm.client").then((m) => ({ default: m.Differ })),
);

export const loader = aclLoader;
export const action = aclAction;
export const clientAction = toastClientAction;

export default function Page({
  loaderData: {
    access,
    writable,
    canEditGrants,
    grantIpAllowsOnePortRange,
    policy,
    users,
    tagUsage,
  },
}: Route.ComponentProps) {
  const { t } = useI18n();
  const [codePolicy, setCodePolicy] = useState(policy);
  const [savedPolicy, setSavedPolicy] = useState(policy);
  if (savedPolicy !== policy) {
    setSavedPolicy(policy);
    setCodePolicy(policy);
  }

  const fetcher = useFetcher<ActionResult>();
  const disabled = !access || !writable; // Disable if no permission or not writable

  const parsed = useMemo(() => parsePolicy(codePolicy), [codePolicy]);
  const sources = useMemo(
    () => (parsed.ok ? policySources(parsed.policy, users) : []),
    [parsed, users],
  );
  const destinations = useMemo(
    () => (parsed.ok ? policyDestinations(parsed.policy, users) : []),
    [parsed, users],
  );

  // The structured editors round-trip through the policy text, so the file
  // editor, the diff view and Save all work off one source of truth.
  function applyPolicy(next: Policy) {
    setCodePolicy(serializePolicy(next));
  }

  function structuredPanel(render: (value: Policy) => ReactNode) {
    if (!parsed.ok) {
      return (
        <div className="p-4">
          <Callout className="my-4 max-w-2xl" title={t("acls.parseError.title")} variant="error">
            {t("acls.parseError.body", { error: parsed.error })}
          </Callout>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 p-4">
        {parsed.hasComments ? (
          <Callout className="my-4 max-w-2xl" title={t("acls.comments.title")} variant="warning">
            {t("acls.comments.body")}
          </Callout>
        ) : null}
        {render(parsed.policy)}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        description={
          <>
            {t("acls.description")}{" "}
            <Link external styled to="https://tailscale.com/kb/1018/acls">
              {t("acls.tailscaleGuide")}
            </Link>{" "}
            /{" "}
            <Link external styled to="https://headscale.net/stable/ref/acls/">
              {t("acls.headscaleDocs")}
            </Link>
          </>
        }
        title={t("acls.pageTitle")}
      />
      {!access ? (
        <Callout className="my-4 max-w-2xl" title={t("acls.restricted.title")} variant="warning">
          {t("acls.restricted.body")}
        </Callout>
      ) : !writable ? (
        <Callout className="my-4 max-w-2xl" title={t("acls.readOnly.title")} variant="error">
          {t("acls.readOnly.body")}
        </Callout>
      ) : undefined}
      {fetcher.data?.ok === false && (
        <Callout className="my-4 max-w-2xl" title={t("acls.saveFailed.title")} variant="error">
          {fetcher.data.errors.form ?? fetcher.data.errors.policy}
        </Callout>
      )}
      <Tabs className="mb-4" label={t("acls.editor")} defaultValue="rules">
        <TabsList>
          <TabsTab value="rules">
            <div className="flex items-center gap-2">
              <Shield className="p-1" />
              <span>{t("acls.rules")}</span>
            </div>
          </TabsTab>
          <TabsTab value="tags">
            <div className="flex items-center gap-2">
              <TagsIcon className="p-1" />
              <span>{t("acls.tagsGroups")}</span>
            </div>
          </TabsTab>
          <TabsTab value="edit">
            <div className="flex items-center gap-2">
              <Pencil className="p-1" />
              <span>{t("acls.editFile")}</span>
            </div>
          </TabsTab>
          <TabsTab value="diff">
            <div className="flex items-center gap-2">
              <Eye className="p-1" />
              <span>{t("acls.previewChanges")}</span>
            </div>
          </TabsTab>
          <TabsTab value="preview">
            <div className="flex items-center gap-2">
              <FlaskConical className="p-1" />
              <span>{t("acls.previewRules")}</span>
            </div>
          </TabsTab>
        </TabsList>
        <TabsPanel value="rules">
          {structuredPanel((value) => (
            <RulesEditor
              canEditGrants={canEditGrants}
              destinations={destinations}
              grantIpAllowsOnePortRange={grantIpAllowsOnePortRange}
              isDisabled={disabled}
              onChange={applyPolicy}
              policy={value}
              sources={sources}
            />
          ))}
        </TabsPanel>
        <TabsPanel value="tags">
          {structuredPanel((value) => (
            <TagsGroupsEditor
              isDisabled={disabled}
              onChange={applyPolicy}
              policy={value}
              tagUsage={tagUsage}
              users={users}
            />
          ))}
        </TabsPanel>
        <TabsPanel value="edit">
          <Suspense fallback={<Fallback />}>
            <LazyEditor isDisabled={disabled} onChange={setCodePolicy} value={codePolicy} />
          </Suspense>
        </TabsPanel>
        <TabsPanel value="diff">
          <Suspense fallback={<Fallback />}>
            <LazyDiffer left={policy} right={codePolicy} />
          </Suspense>
        </TabsPanel>
        <TabsPanel value="preview">
          <div className="flex flex-col items-center py-8">
            <Construction />
            <p className="mt-4 w-1/2 text-center">{t("acls.previewUnavailable")}</p>
          </div>
        </TabsPanel>
      </Tabs>
      <Button
        className="mr-2"
        disabled={
          disabled ||
          fetcher.state !== "idle" ||
          codePolicy.trim().length === 0 ||
          !parsed.ok ||
          codePolicy === policy
        }
        onClick={() => {
          fetcher.submit({ intent: "save", policy: codePolicy }, { method: "POST" });
        }}
        variant="primary"
      >
        {t("common.save")}
      </Button>
      <Button
        disabled={disabled || fetcher.state !== "idle" || codePolicy === policy}
        onClick={() => {
          // Reset the editor to the original policy
          setCodePolicy(policy);
        }}
      >
        {t("acls.discard")}
      </Button>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const { t } = useI18n();
  if (
    isRouteErrorResponse(error) &&
    isApiError(error.data) &&
    error.data.rawData.includes("reading policy from path") &&
    error.data.rawData.includes("no such file or directory")
  ) {
    return (
      <ErrorState
        description={t("acls.missingFile.body")}
        icon={<FileX />}
        title={t("acls.missingFile.title")}
      />
    );
  }

  return <PageError error={error} page="the access control policy" />;
}
