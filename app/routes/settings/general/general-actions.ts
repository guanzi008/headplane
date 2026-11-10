import * as v from "valibot";

import {
  authContext,
  headscaleConfigContext,
  headscaleContext,
  integrationContext,
} from "~/server/context";
import { ActionError, createAction } from "~/server/web/actions";
import { Capabilities } from "~/server/web/roles";
import { isPrometheusDuration } from "~/utils/duration";
import { ok } from "~/utils/form";

const logLevels = ["trace", "debug", "info", "warn", "error", "fatal", "panic"] as const;
const toggle = v.picklist(["true", "false"]);
const nodeExpiry = v.pipe(
  v.string(),
  v.trim(),
  v.nonEmpty("Enter a duration."),
  v.check(
    isPrometheusDuration,
    "Use a Headscale duration such as 0, 30m, 24h, 30d or 180d. Units must go from large to small.",
  ),
);

export const generalAction = createAction({
  capability: Capabilities.configure_server,
  async setup({ request, context }) {
    const principal = await context.get(authContext).require(request);
    const config = context.get(headscaleConfigContext);
    const headscale = context.get(headscaleContext);
    const integration = context.get(integrationContext);

    if (!config.readable()) {
      throw new ActionError("The Headscale configuration file isn't available.", 404);
    }
    if (!config.writable()) {
      throw new ActionError("The Headscale configuration is read-only.", 403);
    }

    return {
      principal,
      config,
      restart: async () => {
        if (integration && !(await integration.onConfigChange(headscale))) {
          throw new ActionError(
            "Saved, but Headscale didn't come back after restarting. Check its logs.",
            502,
          );
        }
      },
    };
  },
  intents: {
    set_node_expiry: {
      fields: { expiry: nodeExpiry },
      async handler(input, { config, restart }) {
        await config.patch([
          { path: "node.expiry", value: input.expiry === "0" ? 0 : input.expiry },
        ]);
        await restart();
        return ok("Default node expiry saved");
      },
    },
    set_log_level: {
      fields: { level: v.picklist(logLevels, "Choose a valid log level.") },
      async handler(input, { config, restart }) {
        await config.patch([{ path: "log.level", value: input.level }]);
        await restart();
        return ok("Log level saved");
      },
    },
    set_taildrop: {
      fields: { enabled: toggle },
      async handler(input, { config, restart }) {
        const enabled = input.enabled === "true";
        await config.patch([{ path: "taildrop.enabled", value: enabled }]);
        await restart();
        return ok(enabled ? "Taildrop enabled" : "Taildrop disabled");
      },
    },
    set_auto_update: {
      fields: { enabled: toggle },
      async handler(input, { config, restart }) {
        const enabled = input.enabled === "true";
        await config.patch([{ path: "auto_update.enabled", value: enabled }]);
        await restart();
        return ok(
          enabled ? "Node auto-update enabled by default" : "Node auto-update disabled by default",
        );
      },
    },
    set_disable_check_updates: {
      fields: { enabled: toggle },
      async handler(input, { config, restart }) {
        const enabled = input.enabled === "true";
        await config.patch([{ path: "disable_check_updates", value: enabled }]);
        await restart();
        return ok(enabled ? "Headscale update checks disabled" : "Headscale update checks enabled");
      },
    },
  },
});
