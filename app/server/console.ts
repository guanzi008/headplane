import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";

import { loadConfig } from "./config/load";
import { createAppContext, type AppContext } from "./context";

const ownerID = /^usr_[0-9a-f]{24}$/;

export function trustedConsoleRequest(headers: Headers, secret: string): boolean {
  const provided = headers.get("x-hsc-proxy-secret") ?? "";
  const expected = Buffer.from(secret);
  const candidate = Buffer.from(provided);
  return (
    expected.length >= 32 &&
    candidate.length === expected.length &&
    timingSafeEqual(candidate, expected)
  );
}

// One process serves separate application contexts. Databases, cookies, live
// stores, Headscale API keys, and editable configuration belong to one network.
export function createConsoleContexts(directory: string, secret: string, basePath: string) {
  const entries = new Map<string, Promise<AppContext>>();
  const removed = new Set<string>();
  let closed = false;

  async function get(request: Request): Promise<AppContext> {
    if (!trustedConsoleRequest(request.headers, secret)) throw new Error("Untrusted account proxy");
    const id = request.headers.get("x-hsc-tailnet") ?? "";
    if (!ownerID.test(id) || removed.has(id) || closed)
      throw new Error("Personal network unavailable");
    let entry = entries.get(id);
    if (!entry) {
      entry = (async () => {
        const config = await loadConfig(join(directory, id, "generated", "headplane.yaml"));
        if (config.server.base_path !== basePath)
          throw new Error("Personal network path does not match");
        const ctx = await createAppContext(config);
        ctx.startServices();
        return ctx;
      })();
      entries.set(id, entry);
      entry.catch(() => {
        if (entries.get(id) === entry) entries.delete(id);
      });
    }
    return entry;
  }

  async function remove(id: string) {
    if (!ownerID.test(id)) throw new Error("Invalid personal network");
    removed.add(id);
    const entry = entries.get(id);
    entries.delete(id);
    if (entry) await (await entry.catch(() => undefined))?.dispose();
  }

  async function dispose() {
    closed = true;
    await Promise.all([...entries.keys()].map(remove));
  }

  async function handle(request: IncomingMessage, response: ServerResponse): Promise<boolean> {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (request.method === "GET" && path === `${basePath}/healthz`) {
      response.writeHead(closed ? 503 : 200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      });
      response.end(JSON.stringify({ status: closed ? "stopping" : "ok" }));
      return true;
    }
    const headers = new Headers();
    const supplied = request.headers["x-hsc-proxy-secret"];
    if (typeof supplied === "string") headers.set("x-hsc-proxy-secret", supplied);
    if (!trustedConsoleRequest(headers, secret)) {
      response.writeHead(403);
      response.end("Forbidden");
      return true;
    }
    if (path.startsWith("/__console/tailnets/")) {
      const id = path.slice("/__console/tailnets/".length);
      if (request.method !== "DELETE" || !ownerID.test(id)) {
        response.writeHead(400);
        response.end("Invalid network request");
      } else {
        await remove(id);
        response.writeHead(204);
        response.end();
      }
      return true;
    }
    return false;
  }

  return { get, handle, remove, dispose };
}
