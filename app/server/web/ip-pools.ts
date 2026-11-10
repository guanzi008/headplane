import type { HeadscaleClient } from "~/server/headscale/api";
import { headscaleErrorMessage, isDataWithApiError } from "~/server/headscale/api/error-client";
import type { Principal } from "~/server/web/auth";
import { isUserPrincipal } from "~/server/web/auth";
import { ownsHeadscaleUser } from "~/server/web/headscale-identity";
import type { IPPoolNode, IPPoolPageData, IPPoolUser } from "~/types/IPPool";
import type { Machine } from "~/types/Machine";
import type { User } from "~/types/User";
import {
  asUserReference,
  extractUserIPPools,
  findUserPoolEntry,
  replaceUserIPPool,
  validateUserPools,
  type PoolConflictContext,
  type UserIPPoolEntry,
} from "~/utils/ip-pool";

import { ActionError } from "./actions";

export interface PolicySnapshot {
  policy: string;
  writable: boolean;
  reason?: string;
}

const FILE_POLICY_REASON =
  "The ACL policy is in file mode or read-only. Set policy.mode to database in the Headscale configuration before editing address pools here.";

export async function getPolicySnapshot(api: HeadscaleClient): Promise<PolicySnapshot> {
  try {
    const { policy, updatedAt } = await api.policy.get();
    if (updatedAt === null) {
      return { policy, reason: FILE_POLICY_REASON, writable: false };
    }

    return { policy, writable: true };
  } catch (error) {
    if (!isDataWithApiError(error)) {
      throw error;
    }

    if (error.data.rawData.includes("acl policy not found")) {
      return { policy: "", writable: true };
    }

    const detail = error.data.data?.detail;
    const message = headscaleErrorMessage(error)?.toLowerCase();
    if (
      (typeof detail === "string" && detail.startsWith('reading policy from path ""')) ||
      message?.includes('reading policy from path ""')
    ) {
      return { policy: "", reason: FILE_POLICY_REASON, writable: false };
    }

    throw error;
  }
}

export function findOwnedHeadscaleUser(principal: Principal, users: User[]): User | undefined {
  if (!isUserPrincipal(principal)) {
    return undefined;
  }

  if (principal.user.headscaleUserId) {
    const linked = users.find((user) => user.id === principal.user.headscaleUserId);
    if (linked) {
      return linked;
    }
  }

  return users.find((user) => ownsHeadscaleUser(principal, user));
}

export function buildPoolPageData(options: {
  canManageAll: boolean;
  currentUser?: User;
  nodes: Machine[];
  policyText: string;
  users: User[];
  writable: boolean;
}): IPPoolPageData {
  const entriesResult = extractUserIPPools(options.policyText);
  const entries = entriesResult.ok ? entriesResult.entries : [];
  let policyError = entriesResult.error;
  const unmatched = unmatchedPoolTargets(entries, options.users);
  if (unmatched.length > 0) {
    policyError = [policyError, `Unmatched ipPool targets: ${unmatched.join(", ")}.`]
      .filter(Boolean)
      .join(" ");
  }

  const targets = options.canManageAll
    ? options.users
    : options.currentUser
      ? [options.currentUser]
      : [];

  const poolUsers = targets.map((user) => {
    const found = findUserPoolEntry(entries, userPolicyReferences(user));
    const pools = found.entry?.pools ?? [];
    const userNodes = options.nodes.filter((node) => node.user?.id === user.id);
    const conflicts = conflictsForUser(user, options.nodes, entries);

    return {
      conflicts,
      displayName: user.displayName,
      email: user.email,
      error: found.error,
      id: user.id,
      name: user.name,
      nodes: userNodes.map(toPoolNode),
      ownAddresses: conflicts.ownAddresses,
      pools,
    } satisfies IPPoolUser;
  });

  return {
    canManageAll: options.canManageAll,
    currentUserId: options.currentUser?.id,
    linked: !options.canManageAll && options.currentUser !== undefined,
    policyError,
    readOnly: !options.writable,
    readOnlyReason: options.writable ? undefined : FILE_POLICY_REASON,
    users: poolUsers,
  };
}

export function poolContextForUser(
  user: User,
  nodes: Machine[],
  entries: UserIPPoolEntry[],
): PoolConflictContext & { ownAddresses: string[] } {
  return conflictsForUser(user, nodes, entries);
}

export async function saveUserPool(options: {
  api: HeadscaleClient;
  entries: UserIPPoolEntry[];
  nodes: Machine[];
  policyText: string;
  poolsInput: string;
  user: User;
}): Promise<string[]> {
  const conflicts = poolContextForUser(options.user, options.nodes, options.entries);
  const validation = validateUserPools(options.poolsInput, {
    conflicts: { addresses: conflicts.addresses, pools: conflicts.pools },
    ownAddresses: conflicts.ownAddresses,
  });
  if (!validation.ok) {
    throw new ActionError(validation.errors.join(" "), 400);
  }

  const userReference = userPolicyReference(options.user);
  const found = findUserPoolEntry(options.entries, userPolicyReferences(options.user));
  if (found.error) {
    throw new ActionError(found.error, 400);
  }

  const updated = replaceUserIPPool(
    options.policyText,
    found.entry?.index ?? null,
    userReference,
    validation.prefixes.map((prefix) => prefix.text),
  );
  if (!updated.ok || !updated.policy) {
    throw new ActionError(updated.error ?? "Could not update the ACL policy.", 400);
  }

  try {
    await options.api.policy.set(updated.policy);
  } catch (error) {
    if (isDataWithApiError(error)) {
      if (error.data.rawData.includes("update is disabled")) {
        throw new ActionError(FILE_POLICY_REASON, 403);
      }

      const message = headscaleErrorMessage(error);
      if (message) {
        throw new ActionError(message, 400);
      }
    }

    throw error;
  }

  return validation.prefixes.map((prefix) => prefix.text);
}

function conflictsForUser(
  user: User,
  nodes: Machine[],
  entries: UserIPPoolEntry[],
): PoolConflictContext & { ownAddresses: string[] } {
  const userReferences = new Set(userPolicyReferences(user));
  const pools = entries
    .filter(
      (entry) =>
        entry.pools.length > 0 && !entry.targets.some((target) => userReferences.has(target)),
    )
    .flatMap((entry) => entry.pools);

  const ownUntaggedNodeIds = new Set(
    nodes
      .filter((node) => node.user?.id === user.id && node.tags.length === 0)
      .map((node) => node.id),
  );
  const ownAddresses = nodes
    .filter((node) => ownUntaggedNodeIds.has(node.id))
    .flatMap((node) => node.ipAddresses ?? []);
  const addresses = nodes
    .filter((node) => !ownUntaggedNodeIds.has(node.id))
    .flatMap((node) => node.ipAddresses ?? []);

  return {
    addresses: unique(addresses),
    ownAddresses: unique(ownAddresses),
    pools: unique(pools),
  };
}

function unmatchedPoolTargets(entries: UserIPPoolEntry[], users: User[]): string[] {
  const known = new Set(users.flatMap(userPolicyReferences));
  return unique(
    entries
      .filter((entry) => entry.pools.length > 0)
      .flatMap((entry) => entry.targets)
      .filter((target) => !known.has(target)),
  );
}

// Prefer the email because Headscale resolves policy user tokens against
// email before the stored name. OIDC users always have an email; local users
// may need the conventional trailing "@".
function userPolicyReference(user: User): string {
  return user.email?.trim() || asUserReference(user.name);
}

// Headscale resolves a policy username against both the email and the stored
// name. Accept either spelling so changing a pool created by the ACL editor
// (which uses `name@`) does not create a second pool for the same user.
function userPolicyReferences(user: User): string[] {
  return Array.from(
    new Set(
      [user.email?.trim(), asUserReference(user.name)].filter((value): value is string =>
        Boolean(value),
      ),
    ),
  );
}

function toPoolNode(node: Machine): IPPoolNode {
  return {
    id: node.id,
    ipAddresses: node.ipAddresses ?? [],
    name: node.givenName || node.name,
    tags: node.tags,
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
