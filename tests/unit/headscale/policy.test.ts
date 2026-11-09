import { describe, expect, test } from "vitest";

import { capabilitiesFor } from "~/server/headscale/api/capabilities";
import { makePolicyApi } from "~/server/headscale/api/resources/policy";
import { parseServerVersion } from "~/server/headscale/api/server-version";
import type { Transport } from "~/server/headscale/api/transport";

function responseTransport(response: unknown): Transport {
  return {
    async request<T>(): Promise<T> {
      return response as T;
    },
    async getPublic<T>(): Promise<T> {
      throw new Error("getPublic should not be called");
    },
    async health() {
      throw new Error("health should not be called");
    },
    async dispose() {},
  };
}

const capabilities = capabilitiesFor(parseServerVersion("0.30.0"));

describe("policy API timestamps", () => {
  test("treats a file-mode zero timestamp as read-only", async () => {
    const transport = responseTransport({
      policy: "{}",
      updatedAt: "0001-01-01T00:00:00Z",
    });

    await expect(makePolicyApi(transport, capabilities, "api-key").get()).resolves.toEqual({
      policy: "{}",
      updatedAt: null,
    });
  });

  test("keeps a real update timestamp", async () => {
    const transport = responseTransport({
      policy: "{}",
      updatedAt: "2026-01-02T03:04:05Z",
    });

    await expect(makePolicyApi(transport, capabilities, "api-key").get()).resolves.toEqual({
      policy: "{}",
      updatedAt: new Date("2026-01-02T03:04:05Z"),
    });
  });
});
