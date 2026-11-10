import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useFetcher } from "react-router";

import Button from "~/components/button";
import Callout from "~/components/callout";
import Code from "~/components/code";
import Field from "~/components/field";
import PageError from "~/components/page-error";
import PageHeader from "~/components/page-header";
import Section, { Row, RowList } from "~/components/section";
import { authContext, requestApiContext } from "~/server/context";
import {
  buildPoolPageData,
  findOwnedHeadscaleUser,
  getPolicySnapshot,
} from "~/server/web/ip-pools";
import { Capabilities } from "~/server/web/roles";
import type { IPPoolUser } from "~/types/IPPool";
import { useI18n } from "~/utils/i18n";
import {
  extractRoutePrefixes,
  parsePoolInput,
  parseRouteConflicts,
  suggestAvailablePools,
  validateUserPools,
} from "~/utils/ip-pool";
import { toastClientAction } from "~/utils/toast";

import type { Route } from "./+types/overview";
import { networkAction } from "./network-actions";

const textareaClass =
  "min-h-28 w-full resize-y rounded-md border border-line-strong bg-surface px-2.5 py-2 font-mono text-xs text-fg placeholder:text-muted outline-hidden transition-[border-color,box-shadow] duration-100 focus:border-accent focus:ring-3 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-50";

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = context.get(authContext);
  const principal = await auth.requireCapability(request, Capabilities.manage_own_ippool);
  const { api } = await context.get(requestApiContext)(request);
  const canManageAll = auth.can(principal, Capabilities.write_policy);

  const [users, nodes, policy] = await Promise.all([
    api.users.list(),
    api.nodes.list(),
    getPolicySnapshot(api),
  ]);

  const currentUser = canManageAll ? undefined : findOwnedHeadscaleUser(principal, users);
  return buildPoolPageData({
    canManageAll,
    currentUser,
    nodes,
    policyText: policy.policy,
    users,
    writable: policy.writable,
  });
}

export const action = networkAction;
export const clientAction = toastClientAction;

export default function Page({ loaderData }: Route.ComponentProps) {
  const { t } = useI18n();

  return (
    <>
      <PageHeader
        description={
          loaderData.canManageAll ? t("network.description.admin") : t("network.description")
        }
        title={t("network.title")}
      />
      {loaderData.readOnly && (
        <Callout className="mb-6" title={t("network.readOnly.title")} variant="warning">
          {loaderData.readOnlyReason ?? t("network.readOnly.body")}
        </Callout>
      )}
      {loaderData.policyError && (
        <Callout className="mb-6" title={t("network.policyError.title")} variant="error">
          {loaderData.policyError}
        </Callout>
      )}
      {!loaderData.canManageAll && !loaderData.linked && (
        <Callout className="mb-6" title={t("network.unlinked.title")} variant="warning">
          {t("network.unlinked.body")}
        </Callout>
      )}
      {loaderData.canManageAll && <Callout className="mb-6">{t("network.adminScope")}</Callout>}
      {loaderData.users.length === 0 ? (
        <p className="text-muted py-2.5 text-sm">{t("network.noUsers")}</p>
      ) : (
        loaderData.users.map((user) => (
          <PoolEditor
            canManageAll={loaderData.canManageAll}
            key={user.id}
            readOnly={loaderData.readOnly}
            user={user}
          />
        ))
      )}
    </>
  );
}

function PoolEditor({
  canManageAll,
  readOnly,
  user,
}: {
  canManageAll: boolean;
  readOnly: boolean;
  user: IPPoolUser;
}) {
  const { t } = useI18n();
  const fetcher = useFetcher<typeof networkAction>();
  const [poolInput, setPoolInput] = useState(user.pools.join("\n"));
  const [routeInput, setRouteInput] = useState("");

  const validation = useMemo(
    () =>
      validateUserPools(poolInput, {
        conflicts: user.conflicts,
        ownAddresses: user.ownAddresses,
      }),
    [poolInput, user.conflicts, user.ownAddresses],
  );
  const candidates = useMemo(() => parsePoolInput(poolInput).prefixes, [poolInput]);
  const routeConflicts = useMemo(
    () => parseRouteConflicts(routeInput, candidates),
    [candidates, routeInput],
  );
  const routePrefixes = useMemo(() => extractRoutePrefixes(routeInput), [routeInput]);
  const suggestions = useMemo(
    () =>
      suggestAvailablePools([
        ...user.conflicts.pools,
        ...user.conflicts.addresses,
        ...routePrefixes,
      ]),
    [routePrefixes, user.conflicts.addresses, user.conflicts.pools],
  );
  const blocked = !validation.ok || routeConflicts.routeConflicts.length > 0;
  const serverError =
    fetcher.data &&
    typeof fetcher.data === "object" &&
    "ok" in fetcher.data &&
    fetcher.data.ok === false
      ? fetcher.data.errors.form
      : undefined;

  return (
    <Section
      description={
        <>
          {user.email ?? user.name}
          {canManageAll && !user.email && ` · ${user.name}`}
        </>
      }
      title={user.displayName || user.name}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2 text-sm">
          {user.pools.length === 0 ? (
            <span className="text-muted">{t("network.user.globalPool")}</span>
          ) : (
            user.pools.map((pool) => <Code key={pool}>{pool}</Code>)
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium">{t("network.user.nodes")}</h3>
          {user.nodes.length === 0 ? (
            <p className="text-muted mt-1 text-sm">{t("network.user.noNodes")}</p>
          ) : (
            <RowList>
              {user.nodes.map((node) => (
                <Row key={node.id}>
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-medium">{node.name}</span>
                    {node.ipAddresses.map((address) => (
                      <Code key={address}>{address}</Code>
                    ))}
                    {node.tags.map((tag) => (
                      <span className="text-muted text-xs" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </Row>
              ))}
            </RowList>
          )}
        </div>

        <PoolForm
          blocked={blocked}
          canManageAll={canManageAll}
          fetcher={fetcher}
          poolInput={poolInput}
          readOnly={readOnly}
          setPoolInput={setPoolInput}
          suggestions={suggestions}
          user={user}
        />

        <ValidationNotes errors={validation.errors} warnings={validation.warnings} />

        <div>
          <h3 className="text-sm font-medium">{t("network.user.knownConflicts")}</h3>
          {user.conflicts.pools.length === 0 && user.conflicts.addresses.length === 0 ? (
            <p className="text-muted mt-1 text-sm">{t("network.user.noKnownConflicts")}</p>
          ) : (
            <div className="mt-2 flex flex-col gap-1.5 text-sm">
              {user.conflicts.pools.length > 0 && (
                <p>
                  <span className="text-muted">{t("network.user.otherPools")}: </span>
                  {user.conflicts.pools.map((pool) => (
                    <Code key={pool}>{pool}</Code>
                  ))}
                </p>
              )}
              {user.conflicts.addresses.length > 0 && (
                <p>
                  <span className="text-muted">{t("network.user.otherAddresses")}: </span>
                  {user.conflicts.addresses.map((address) => (
                    <Code key={address}>{address}</Code>
                  ))}
                </p>
              )}
            </div>
          )}
          {user.ownAddresses.length > 0 && (
            <p className="mt-2 text-sm">
              <span className="text-muted">{t("network.user.existingAddresses")}: </span>
              {user.ownAddresses.map((address) => (
                <Code key={address}>{address}</Code>
              ))}
            </p>
          )}
          {serverError && (
            <Callout className="mt-4" variant="error">
              {serverError}
            </Callout>
          )}
        </div>

        <RouteCheck
          candidatesExist={candidates.length > 0}
          onChange={setRouteInput}
          report={routeConflicts}
          value={routeInput}
        />
      </div>
    </Section>
  );
}

function PoolForm({
  blocked,
  canManageAll,
  fetcher,
  poolInput,
  readOnly,
  setPoolInput,
  suggestions,
  user,
}: {
  blocked: boolean;
  canManageAll: boolean;
  fetcher: ReturnType<typeof useFetcher<typeof networkAction>>;
  poolInput: string;
  readOnly: boolean;
  setPoolInput: (value: string) => void;
  suggestions: string[];
  user: IPPoolUser;
}) {
  const { t } = useI18n();

  return (
    <fetcher.Form className="flex flex-col gap-3" method="post">
      <input name="intent" type="hidden" value="save" />
      {canManageAll && <input name="user_id" type="hidden" value={user.id} />}
      <Field
        description={t("network.user.poolHelp")}
        label={t("network.user.poolLabel")}
        name="pools"
      >
        <textarea
          className={textareaClass}
          disabled={readOnly}
          name="pools"
          onChange={(event) => setPoolInput(event.currentTarget.value)}
          placeholder={"10.42.5.0/24\nfd42:5::/64"}
          spellCheck={false}
          value={poolInput}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          disabled={readOnly || suggestions.length === 0}
          onClick={() => setPoolInput(suggestions.join("\n"))}
          type="button"
        >
          <Sparkles className="size-3.5" />
          {t("network.user.suggest")}
        </Button>
        <Button
          disabled={
            readOnly || blocked || (poolInput.trim().length > 0 && !validationPrefixes(poolInput))
          }
          pending={fetcher.state !== "idle"}
          type="submit"
          variant="primary"
        >
          {t("network.user.save")}
        </Button>
      </div>
      {readOnly && <p className="text-muted text-xs">{t("network.readOnly.form")}</p>}
    </fetcher.Form>
  );
}

function ValidationNotes({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  const { t } = useI18n();
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {errors.length > 0 && (
        <Callout title={t("network.user.validationErrors")} variant="error">
          <ul className="list-disc space-y-1 pl-4">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Callout>
      )}
      {warnings.length > 0 && (
        <Callout title={t("network.user.routeBehaviour")} variant="warning">
          <ul className="list-disc space-y-1 pl-4">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <p className="mt-2">{t("network.user.exactRoutes")}</p>
          <p>{t("network.user.quad100")}</p>
        </Callout>
      )}
    </div>
  );
}

function RouteCheck({
  candidatesExist,
  onChange,
  report,
  value,
}: {
  candidatesExist: boolean;
  onChange: (value: string) => void;
  report: ReturnType<typeof parseRouteConflicts>;
  value: string;
}) {
  const { t } = useI18n();

  return (
    <div className="border-line rounded-lg border p-4">
      <h3 className="text-sm font-medium">{t("network.route.title")}</h3>
      <p className="text-muted mt-1 text-sm">{t("network.route.description")}</p>
      <Field className="mt-3" label={t("network.route.label")}>
        <textarea
          className={textareaClass}
          onChange={(event) => onChange(event.currentTarget.value)}
          placeholder={t("network.route.placeholder")}
          spellCheck={false}
          value={value}
        />
      </Field>
      {value.trim().length > 0 && !candidatesExist && (
        <p className="text-muted mt-2 text-xs">{t("network.route.enterPoolFirst")}</p>
      )}
      {report.routeConflicts.length > 0 && (
        <Callout className="mt-3" title={t("network.route.conflicts")} variant="error">
          <ul className="space-y-2">
            {report.routeConflicts.map((conflict) => (
              <li key={`${conflict.cidr}:${conflict.line}`}>
                <Code>{conflict.cidr}</Code> <span>{conflict.message}</span>
                <pre className="text-muted mt-1 overflow-x-auto text-xs whitespace-pre-wrap">
                  {conflict.line}
                </pre>
              </li>
            ))}
          </ul>
        </Callout>
      )}
      {report.firewallWarnings.length > 0 && (
        <Callout className="mt-3" title={t("network.route.firewall")} variant="warning">
          <ul className="space-y-2">
            {report.firewallWarnings.map((warning) => (
              <li key={`${warning.cidr}:${warning.line}`}>
                <Code>{warning.cidr}</Code> <span>{warning.message}</span>
                <pre className="text-muted mt-1 overflow-x-auto text-xs whitespace-pre-wrap">
                  {warning.line}
                </pre>
              </li>
            ))}
          </ul>
        </Callout>
      )}
    </div>
  );
}

function validationPrefixes(input: string) {
  return parsePoolInput(input).prefixes.length > 0 || input.trim().length === 0;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <PageError error={error} page="this page" />;
}
