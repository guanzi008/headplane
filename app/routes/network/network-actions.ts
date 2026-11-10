import * as v from "valibot";

import { authContext, requestApiContext } from "~/server/context";
import { ActionError, createAction } from "~/server/web/actions";
import { findOwnedHeadscaleUser, getPolicySnapshot, saveUserPool } from "~/server/web/ip-pools";
import { Capabilities } from "~/server/web/roles";
import { ok } from "~/utils/form";
import { extractUserIPPools } from "~/utils/ip-pool";

export const networkAction = createAction({
  async setup({ request, context }) {
    const auth = context.get(authContext);
    const principal = await auth.requireCapability(request, Capabilities.manage_own_ippool);
    const { api } = await context.get(requestApiContext)(request);
    const canManageAll = auth.can(principal, Capabilities.write_policy);

    const [users, nodes, policy] = await Promise.all([
      api.users.list(),
      api.nodes.list(),
      getPolicySnapshot(api),
    ]);

    return {
      api,
      canManageAll,
      currentUser: canManageAll ? undefined : findOwnedHeadscaleUser(principal, users),
      nodes,
      policy,
      principal,
      users,
    };
  },
  intents: {
    save: {
      fields: {
        user_id: v.optional(v.string()),
        pools: v.string(),
      },
      async handler(input, { api, canManageAll, currentUser, nodes, policy, users }) {
        if (!policy.writable) {
          throw new ActionError(policy.reason ?? "The ACL policy is read-only.", 403);
        }

        let user;
        if (canManageAll) {
          user = users.find((candidate) => candidate.id === input.user_id);
          if (!user) {
            throw new ActionError("Choose a Headscale user.", 400);
          }
        } else {
          if (!currentUser) {
            throw new ActionError("Link your Headscale user before managing an address pool.", 400);
          }
          if (input.user_id && input.user_id !== currentUser.id) {
            throw new ActionError("You can only manage your own address pool.", 403);
          }
          user = currentUser;
        }

        const entries = extractUserIPPools(policy.policy);
        if (!entries.ok) {
          throw new ActionError(entries.error ?? "Could not read the ACL policy.", 400);
        }

        const pools = await saveUserPool({
          api,
          entries: entries.entries,
          nodes,
          policyText: policy.policy,
          poolsInput: input.pools,
          user,
        });

        return ok(
          pools.length > 0
            ? "Address pool saved"
            : "Address pool cleared; global allocation resumed",
        );
      },
    },
  },
});
