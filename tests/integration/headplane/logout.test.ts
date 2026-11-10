import { expect, test } from "vitest";

import { loader as login } from "~/routes/auth/login/page";
import { action as logout } from "~/routes/auth/logout";

import { createTestApp, statusOf } from "../../support/app";

const HEADSCALE = { url: "http://127.0.0.1:1", apiKey: "unused" };

test("signing out ends the session for good", async () => {
  await using app = await createTestApp({ headscale: HEADSCALE });
  const { cookie } = await app.signInWithApiKey();

  const result = (await app.call(logout, "/logout", { as: cookie, form: {} })) as Response;
  expect(result.headers.get("Location")).toBe("/login");
  expect(result.headers.get("Set-Cookie")).toMatch(/Expires=Thu, 01 Jan 1970/);
  expect(result.headers.get("Set-Cookie")).toMatch(/Max-Age=0/);

  // A copy of the old cookie doesn't sign anyone back in.
  await expect(app.ctx.auth.require(app.request("/", { as: cookie }))).rejects.toThrow();
});

test("a direct logout link ends an existing session", async () => {
  await using app = await createTestApp({ headscale: HEADSCALE });
  const { cookie } = await app.signInWithApiKey();

  const result = (await app.call(login, "/login", {
    as: cookie,
    search: "?s=logout",
  })) as {
    data: { urlState: string };
    init?: { headers?: HeadersInit };
    type: string;
  };

  expect(result.type).toBe("DataWithResponseInit");
  expect(result.data.urlState).toBe("logout");
  expect(new Headers(result.init?.headers).get("Set-Cookie")).toMatch(/Expires=Thu, 01 Jan 1970/);
  expect(new Headers(result.init?.headers).get("Set-Cookie")).toMatch(/Max-Age=0/);

  await expect(app.ctx.auth.require(app.request("/", { as: cookie }))).rejects.toThrow();
});

test("signing out doesn't bounce straight back in when only SSO is offered", async () => {
  const idp = "http://127.0.0.1:1";
  await using app = await createTestApp({
    headscale: HEADSCALE,
    config: {
      server: { base_url: "http://headplane.test" },
      oidc: {
        issuer: idp,
        client_id: "headplane",
        client_secret: "unused",
        disable_api_key_login: true,
        authorization_endpoint: `${idp}/auth`,
        token_endpoint: `${idp}/token`,
        userinfo_endpoint: `${idp}/userinfo`,
        jwks_endpoint: `${idp}/keys`,
      },
    },
  });
  const { cookie } = await app.signIn("owner");

  const result = (await app.call(logout, "/logout", { as: cookie, form: {} })) as Response;
  expect(result.headers.get("Location")).toBe("/login?s=logout");

  const after = await app.call(login, "/login", { search: "?s=logout" });
  expect(after).toMatchObject({ data: { urlState: "logout" } });
  expect(statusOf(await app.call(login, "/login"))).toBe(302);
});
