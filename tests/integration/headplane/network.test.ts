import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { createTailnet, type Tailnet } from "../../harness/tailnet";
import { waitFor } from "../../harness/wait";

function ipv4(addresses: string[]) {
  const address = addresses.find((candidate) => candidate.includes("."));
  if (!address) throw new Error(`no IPv4 address in ${addresses.join(", ")}`);
  return address;
}

describe("custom address pools on a real tailnet", () => {
  let tailnet: Tailnet;
  let alice: Awaited<ReturnType<Tailnet["node"]>>;
  let bob: Awaited<ReturnType<Tailnet["node"]>>;
  let aliceIP: string;
  let bobIP: string;

  beforeAll(async () => {
    tailnet = await createTailnet();
    const aliceUser = await tailnet.user("network-alice", {
      email: "network-alice@example.com",
    });
    const bobUser = await tailnet.user("network-bob", {
      email: "network-bob@example.com",
    });

    // Pools must exist before the nodes register; otherwise their initial
    // globally allocated addresses would correctly count as conflicts.
    await tailnet.setPolicy({
      acls: [{ action: "accept", src: ["*"], dst: ["*:*"] }],
      nodeAttrs: [
        { target: [aliceUser.email], ipPool: ["10.42.5.0/24"] },
        { target: [bobUser.email], ipPool: ["10.43.5.0/24"] },
      ],
    });

    alice = await tailnet.node({
      acceptDns: true,
      kernelTun: true,
      name: "network-alice-node",
      user: aliceUser.name,
    });
    bob = await tailnet.node({
      acceptDns: true,
      kernelTun: true,
      name: "network-bob-node",
      user: bobUser.name,
    });

    aliceIP = ipv4((await alice.machine()).ipAddresses);
    bobIP = ipv4((await bob.machine()).ipAddresses);
  });

  afterAll(async () => {
    await tailnet?.dispose();
  });

  test("allocates per-user addresses and installs exact kernel host routes", async () => {
    expect(aliceIP).toBe("10.42.5.1");
    expect(bobIP).toBe("10.43.5.1");
    for (const address of [aliceIP, bobIP]) {
      expect(address.startsWith("100.100.100.")).toBe(false);
      expect(address.startsWith("100.115.92.") || address.startsWith("100.115.93.")).toBe(false);
    }

    const routes = await waitFor("a kernel route to the peer", async () => {
      // Tailscale installs peer routes in its policy-routing table, not main.
      const output = await alice.exec(["ip", "-4", "route", "show", "table", "all"]);
      expect(output).toContain(`${bobIP} dev tailscale0`);
      return output;
    });
    const routeLines = routes.split("\n").map((line) => line.trim());
    expect(routeLines.some((line) => line.startsWith(`${bobIP} dev tailscale0`))).toBe(true);
    expect(routes).not.toContain("10.43.5.0/24");
    expect(routes).not.toContain("10.0.0.0/8");
  });

  test("routes traffic and resolves MagicDNS in both directions", async () => {
    const ping = await waitFor("a kernel-mode ping to the peer", async () => {
      const output = await alice.exec(["ping", "-c", "1", "-W", "2", bobIP]);
      expect(output).toContain("0% packet loss");
      return output;
    });
    expect(ping).toContain("0% packet loss");

    await waitFor("MagicDNS forward and reverse records", async () => {
      const forward = await alice.exec(["nslookup", "network-bob-node.tailnet.test"]);
      expect(forward).toContain(bobIP);

      // BusyBox nslookup queries A records by default, even for an
      // in-addr.arpa name. Passing the address makes it issue a PTR query.
      const reverse = await alice.exec(["nslookup", bobIP]);
      expect(reverse).toContain("network-bob-node.tailnet.test");
    });
  });
});
