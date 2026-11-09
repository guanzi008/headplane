import { describe, expect, test } from "vitest";

import { getLocale, translate } from "~/utils/i18n";

function request(url: string, headers?: Record<string, string>) {
  return new Request(url, { headers });
}

describe("locale selection", () => {
  test("uses an explicit lang query over the cookie and browser language", () => {
    const locale = getLocale(
      request("http://headplane.test/admin/login?lang=en", {
        "Accept-Language": "zh-CN",
        Cookie: "hsc_locale=zh-CN",
      }),
    );

    expect(locale).toBe("en");
  });

  test("uses the shared locale cookie before the browser language", () => {
    const locale = getLocale(
      request("http://headplane.test/admin/login", {
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "hsc_locale=zh-CN",
      }),
    );

    expect(locale).toBe("zh-CN");
  });

  test("honors quality values in Accept-Language", () => {
    const locale = getLocale(
      request("http://headplane.test/admin/login", {
        "Accept-Language": "en-US;q=0.2, zh-CN;q=0.9",
      }),
    );

    expect(locale).toBe("zh-CN");
  });

  test("falls back to English for malformed locale cookies", () => {
    const locale = getLocale(
      request("http://headplane.test/admin/login", {
        Cookie: "hsc_locale=%E0%A4%A",
      }),
    );

    expect(locale).toBe("en");
  });
});

describe("translation", () => {
  test("interpolates named values without replacing unknown placeholders", () => {
    expect(translate("en", "machines.count", { count: 3 })).toBe("3 machines");
    expect(translate("zh-CN", "machines.count", { count: 3 })).toBe("3 台设备");
  });
});
