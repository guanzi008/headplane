import { describe, expect, test } from "vitest";

import { capabilitiesFor } from "~/server/headscale/api/capabilities";
import { parseServerVersion } from "~/server/headscale/api/server-version";

describe("Headscale capabilities", () => {
  test("gates the Headscale 0.30 wire changes together", () => {
    const old = capabilitiesFor(parseServerVersion("0.29.5"));
    expect(old.nodeExpiryUsesBody).toBe(false);
    expect(old.grantIpAllowsOnePortRange).toBe(false);

    const current = capabilitiesFor(parseServerVersion("0.30.0"));
    expect(current.nodeExpiryUsesBody).toBe(true);
    expect(current.grantIpAllowsOnePortRange).toBe(true);
  });
});
