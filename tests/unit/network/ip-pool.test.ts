import { describe, expect, test } from "vitest";

import {
  extractRoutePrefixes,
  extractUserIPPools,
  findUserPoolEntry,
  parsePoolInput,
  parseRouteConflicts,
  replaceUserIPPool,
  suggestAvailablePools,
  validateUserPools,
} from "~/utils/ip-pool";

describe("pool validation", () => {
  test("accepts private IPv4 and IPv6 ULA pools", () => {
    const result = validateUserPools("10.42.0.0/24\n172.20.0.0/16\nfd42:1234::/64");
    expect(result.ok).toBe(true);
    expect(result.prefixes.map((prefix) => prefix.text)).toEqual([
      "10.42.0.0/24",
      "172.20.0.0/16",
      "fd42:1234::/64",
    ]);
  });

  test("rejects public ranges, host bits, and Tailscale reserved ranges", () => {
    const result = validateUserPools(
      "8.8.8.0/24\n10.0.0.1/24\n100.115.92.0/24\n100.100.100.0/24\n2001:db8::/64",
    );
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("must be inside 10.0.0.0/8");
    expect(result.errors.join("\n")).toContain("host bits set; use 10.0.0.0/24");
    expect(result.errors.join("\n")).toContain("Tailscale-reserved");
    expect(result.errors.join("\n")).toContain("IPv6 ULA");
  });

  test("detects other pools, other node addresses, and shrinking below existing nodes", () => {
    const result = validateUserPools("10.42.0.0/24\nfd42:2::/64", {
      conflicts: {
        addresses: ["10.42.0.17", "fd42:1::17"],
        pools: ["10.42.0.0/25"],
      },
      ownAddresses: ["10.42.0.10", "fd42:1::10"],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join("\n")).toContain("another user's address pool");
    expect(result.errors.join("\n")).toContain("existing node address 10.42.0.17");
    expect(result.errors.join("\n")).toContain("existing IPv6 address fd42:1::10");
  });

  test("does not require an omitted address family to contain existing addresses", () => {
    const result = validateUserPools("10.42.0.0/24", {
      ownAddresses: ["10.42.0.10", "fd42:1::10"],
    });
    expect(result.ok).toBe(true);
  });
});

describe("route conflict detection", () => {
  test("finds local and VPN routes but treats firewall CIDRs as warnings", () => {
    const candidates = parsePoolInput("10.42.5.0/24").prefixes;
    const report = parseRouteConflicts(
      [
        "10.42.0.0/16 dev eth0 proto kernel scope link",
        "10.43.0.0/16 dev wg0 scope link",
        "iptables -A INPUT -s 10.42.5.0/24 -j ACCEPT",
      ].join("\n"),
      candidates,
    );

    expect(report.routeConflicts).toHaveLength(1);
    expect(report.routeConflicts[0].cidr).toBe("10.42.0.0/16");
    expect(report.firewallWarnings).toHaveLength(1);
    expect(report.firewallWarnings[0].cidr).toBe("10.42.5.0/24");
  });

  test("understands Windows route print netmask pairs", () => {
    const candidates = parsePoolInput("192.168.50.0/24").prefixes;
    const report = parseRouteConflicts(
      "192.168.50.0    255.255.255.0         On-link       192.168.50.10    281",
      candidates,
    );
    expect(report.routeConflicts.some((conflict) => conflict.cidr === "192.168.50.0/24")).toBe(
      true,
    );
  });

  test("ignores default routes and Tailscale's own route table lines", () => {
    const candidates = parsePoolInput("10.42.5.0/24").prefixes;
    const report = parseRouteConflicts(
      "default via 10.0.0.1 dev eth0\n100.64.0.0/10 dev tailscale0",
      candidates,
    );
    expect(report.routeConflicts).toHaveLength(0);
    expect(report.firewallWarnings).toHaveLength(0);
  });
});

describe("suggestions", () => {
  test("suggests one IPv4 and one IPv6 range outside known conflicts", () => {
    const suggestions = suggestAvailablePools(["10.0.0.0/8", "172.16.0.0/12"]);
    expect(suggestions.some((prefix) => prefix.startsWith("192.168."))).toBe(true);
    expect(suggestions.some((prefix) => prefix.startsWith("fd42:"))).toBe(true);
  });

  test("treats bare node addresses as occupied ranges", () => {
    const suggestions = suggestAvailablePools(["10.0.0.0/8", "172.16.0.1"]);
    expect(suggestions).not.toContain("172.16.0.0/24");
    expect(suggestions.some((prefix) => prefix.startsWith("172.16."))).toBe(true);
  });

  test("extracts only route prefixes, not ports or interface metrics", () => {
    expect(
      extractRoutePrefixes(
        [
          "10.42.0.0/16 dev eth0 proto kernel scope link src 10.42.0.17 metric 100",
          "default via 10.42.0.1 dev eth0",
          "100.64.0.0/10 dev tailscale0",
        ].join("\n"),
      ),
    ).toEqual(["10.42.0.0/16", "10.42.0.17/32", "10.42.0.1/32"]);
  });
});

describe("policy editing", () => {
  const policy = `{
  // keep this comment
  "groups": { "admins": ["alice@"] },
  "nodeAttrs": [
    { "target": ["alice@"], "attr": ["randomize-client-port"] },
    { "target": ["bob@"], "ipPool": ["10.20.0.0/24"] },
  ],
}`;

  test("extracts entries and finds the exact user", () => {
    const entries = extractUserIPPools(policy);
    expect(entries.ok).toBe(true);
    expect(entries.entries).toHaveLength(2);
    expect(findUserPoolEntry(entries.entries, "bob@").entry?.pools).toEqual(["10.20.0.0/24"]);
  });

  test("finds a pool through either the email or name@ spelling", () => {
    const entries = extractUserIPPools(policy);
    expect(entries.ok).toBe(true);
    expect(findUserPoolEntry(entries.entries, ["bob@example.org", "bob@"]).entry?.pools).toEqual([
      "10.20.0.0/24",
    ]);
  });

  test("rejects duplicate pools spread across both user spellings", () => {
    const duplicate = JSON.stringify({
      nodeAttrs: [
        { target: ["alice@"], ipPool: ["10.21.0.0/24"] },
        { target: ["alice@example.com"], ipPool: ["10.22.0.0/24"] },
      ],
    });
    const entries = extractUserIPPools(duplicate);
    expect(entries.ok).toBe(true);
    expect(findUserPoolEntry(entries.entries, ["alice@example.com", "alice@"]).error).toContain(
      "more than one",
    );
  });

  test("adds a pool without modifying another user's attributes", () => {
    const result = replaceUserIPPool(policy, null, "alice@", ["10.42.0.0/24", "fd42::/64"]);
    expect(result.ok).toBe(true);
    expect(result.policy).toContain("// keep this comment");
    expect(result.policy).toContain('"attr": ["randomize-client-port"]');

    const entries = extractUserIPPools(result.policy!);
    expect(findUserPoolEntry(entries.entries, "alice@").entry?.pools).toEqual([
      "10.42.0.0/24",
      "fd42::/64",
    ]);
  });

  test("updates and removes only the selected pool", () => {
    const entries = extractUserIPPools(policy);
    const entry = findUserPoolEntry(entries.entries, "bob@").entry;
    expect(entry).toBeDefined();

    const updated = replaceUserIPPool(policy, entry!.index, "bob@", ["10.20.0.0/23"]);
    expect(updated.ok).toBe(true);

    const updatedEntries = extractUserIPPools(updated.policy!);
    expect(findUserPoolEntry(updatedEntries.entries, "bob@").entry?.pools).toEqual([
      "10.20.0.0/23",
    ]);

    const cleared = replaceUserIPPool(updated.policy!, entry!.index, "bob@", []);
    expect(cleared.ok).toBe(true);
    expect(cleared.policy).not.toContain('"ipPool"');
    expect(cleared.policy).toContain("// keep this comment");
  });
});
