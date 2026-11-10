import { expect, test } from "vitest";

import { trustedConsoleRequest } from "~/server/console";

test("browser-supplied tenant headers cannot select another network without the private proxy secret", () => {
  const secret = "a".repeat(48);
  const headers = new Headers({ "X-HSC-Tailnet": "usr_bbbbbbbbbbbbbbbbbbbbbbbb" });
  expect(trustedConsoleRequest(headers, secret)).toBe(false);
  headers.set("X-HSC-Proxy-Secret", "b".repeat(48));
  expect(trustedConsoleRequest(headers, secret)).toBe(false);
  headers.set("X-HSC-Proxy-Secret", secret);
  expect(trustedConsoleRequest(headers, secret)).toBe(true);
  expect(trustedConsoleRequest(new Headers({ "X-HSC-Proxy-Secret": "" }), "")).toBe(false);
});
