import { platform } from "node:os";

import { type } from "arktype";

import type { Headscale } from "~/server/headscale/api";
import log from "~/utils/log";

import { Integration } from "./abstract";
import { findHeadscaleServe, restartAndWaitHealthy } from "./proc-helper";

const configSchema = {
  full: type({
    enabled: "boolean",
    console_reload_url: "string.url?",
    console_api_key: "string?",
  }),

  partial: type({
    enabled: "boolean?",
    console_reload_url: "string.url?",
    console_api_key: "string?",
  }).partial(),
};

export default class ProcIntegration extends Integration<typeof configSchema.full.infer> {
  get name() {
    if (this.context.console_reload_url) return "Managed personal network";
    return "Native Linux (/proc)";
  }

  static get configSchema() {
    return configSchema;
  }

  async isAvailable() {
    if (this.context.console_reload_url) return Boolean(this.context.console_api_key);
    if (platform() !== "linux") {
      log.error("config", "/proc is only available on Linux");
      return false;
    }

    try {
      const result = await findHeadscaleServe();
      if (!result) {
        log.error("config", "Could not find headscale serve process");
        return false;
      }

      log.info("config", "Found headscale serve (PID %d)", result);
      return true;
    } catch (error) {
      log.error("config", "Failed to scan /proc: %s", error);
      return false;
    }
  }

  async onConfigChange(headscale: Headscale) {
    if (this.context.console_reload_url && this.context.console_api_key) {
      try {
        const response = await fetch(this.context.console_reload_url, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.context.console_api_key}` },
          signal: AbortSignal.timeout(60_000),
        });
        return response.status === 204;
      } catch (error) {
        log.error("config", "Personal network reload failed: %s", String(error));
        return false;
      }
    }
    const pid = await findHeadscaleServe();
    if (!pid) {
      log.error("config", "Could not find headscale serve process");
      return false;
    }

    return restartAndWaitHealthy(headscale, pid);
  }
}
