import { readFile } from "node:fs/promises";

import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { parse } from "yaml";

import { generalAction } from "~/routes/settings/general/general-actions";
import { loader } from "~/routes/settings/general/overview";

import { createTailnet, type Tailnet } from "../../harness/tailnet";
import { statusOf, type TestApp } from "../../support/app";

describe("server settings", () => {
  let tailnet: Tailnet;
  let app: TestApp;
  let owner: string;
  let admin: string;

  beforeAll(async () => {
    tailnet = await createTailnet();
    app = await tailnet.headplane();
    owner = (await app.signIn("owner")).cookie;
    admin = (await app.signIn("admin")).cookie;
  });

  afterAll(async () => {
    await tailnet?.dispose();
  });

  function save(form: Record<string, string>, as = owner) {
    return app.call(generalAction, "/settings/general", { as, form });
  }

  async function written() {
    return parse(await readFile(tailnet.server.configPath, "utf8"));
  }

  test("an administrator can read and change the safe settings subset", async () => {
    expect(await app.call(loader, "/settings/general", { as: admin })).toMatchObject({
      writable: true,
      settings: { policyMode: "database", nodeExpiry: "0" },
    });

    expect(statusOf(await save({ intent: "set_node_expiry", expiry: "180d" }, admin))).toBe(200);
    expect(statusOf(await save({ intent: "set_log_level", level: "debug" }, admin))).toBe(200);
    expect(statusOf(await save({ intent: "set_taildrop", enabled: "false" }, admin))).toBe(200);
    expect(statusOf(await save({ intent: "set_auto_update", enabled: "true" }, admin))).toBe(200);
    expect(
      statusOf(await save({ intent: "set_disable_check_updates", enabled: "true" }, admin)),
    ).toBe(200);

    expect(await written()).toMatchObject({
      node: { expiry: "180d" },
      log: { level: "debug" },
      taildrop: { enabled: false },
      auto_update: { enabled: true },
      disable_check_updates: true,
    });
  });

  test("an invalid expiry is rejected without changing the file", async () => {
    const before = await readFile(tailnet.server.configPath, "utf8");
    const result = await save({ intent: "set_node_expiry", expiry: "180" });

    expect(statusOf(result)).toBe(400);
    expect(result).toMatchObject({
      data: {
        errors: {
          expiry:
            "Use a Headscale duration such as 0, 30m, 24h, 30d or 180d. Units must go from large to small.",
        },
      },
    });
    expect(await readFile(tailnet.server.configPath, "utf8")).toBe(before);
  });

  test("a member can't read or change server settings", async () => {
    const member = await app.signIn("member");
    expect(statusOf(await app.call(loader, "/settings/general", { as: member.cookie }))).toBe(403);
    expect(statusOf(await save({ intent: "set_node_expiry", expiry: "30d" }, member.cookie))).toBe(
      403,
    );
  });
});
