import { exit, versions } from "node:process";

import { createRequestListener } from "@react-router/node";
import type { ServerBuild } from "react-router";
import * as build from "virtual:react-router/server-build";

import log from "~/utils/log";

import { ConfigError } from "./config/error";
import { loadConfig } from "./config/load";
import { createConsoleContexts } from "./console";
import { createAppContext, createRouterContext } from "./context";

log.info("server", "Headplane is booting up (PID %d)", process.pid);
log.info("server", "Running Node.js %s", versions.node);
log.info(
  "server",
  "OS %s %s %s",
  process.platform,
  process.arch,
  process.release?.name ?? "unknown",
);

const config = await loadConfig().catch((error) => {
  const message = error instanceof ConfigError ? error.message : error;
  log.error("server", "Failed to load configuration: %s", message);
  exit(1);
});

// TODO: This probably doesn't belong in app.ts, move it to loadConfig()
if ((config.server.tls_cert_path || config.server.tls_key_path) && !config.server.cookie_secure) {
  log.warn(
    "server",
    "TLS is enabled but `server.cookie_secure` is false; forcing it to true (browsers reject Secure-less cookies over HTTPS)",
  );
  config.server.cookie_secure = true;
}

const consoleDirectory = process.env.HSC_CONSOLE_TAILNETS_DIR;
const consoleSecret = process.env.HSC_CONSOLE_PROXY_SECRET;
if (
  Boolean(consoleDirectory) !== Boolean(consoleSecret) ||
  (consoleSecret && consoleSecret.length < 32)
) {
  throw new Error(
    "Console network directory and a proxy secret of at least 32 characters are required together",
  );
}
const consoleContexts =
  consoleDirectory && consoleSecret
    ? createConsoleContexts(consoleDirectory, consoleSecret, config.server.base_path)
    : undefined;
const ctx = consoleContexts
  ? undefined
  : await createAppContext(config).catch((error) => {
      const message = error instanceof ConfigError ? error.message : error;
      log.error("server", "Failed to start Headplane: %s", message);
      exit(1);
    });

ctx?.startServices();
export { config };

// Handles SIGTERM/SIGINT and testing signals for shutdown
export async function dispose(): Promise<void> {
  await consoleContexts?.dispose();
  await ctx?.dispose();
}

export const handleConsoleRequest = consoleContexts?.handle;

// TODO: Move reverse proxy translation from OIDC logic to here. That kind of
// translation is needed for other things too, we should have it here.
async function getLoadContext(request: Request, client: ClientAddress) {
  const services = consoleContexts ? await consoleContexts.get(request) : ctx!;
  services.auth.registerRequestClientAddress(request, client.address);
  return createRouterContext(services);
}

interface ClientAddress {
  address?: string;
}

export function createListener(build: ServerBuild) {
  return createRequestListener({ build, mode: import.meta.env.MODE, getLoadContext });
}

export { build };
export default createListener({ ...build, basename: config.server.base_path });
