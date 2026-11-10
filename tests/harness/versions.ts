// The newest patch of every Headscale minor Headplane supports. CI runs one
// job per version, listed in .github/workflows/build.yaml. 0.30 has not been
// released yet, so its tests use Headscale's `development` image.
export const HEADSCALE_VERSIONS = ["0.27.1", "0.28.0", "0.29.5", "0.30.0"] as const;
export type HeadscaleVersion = (typeof HEADSCALE_VERSIONS)[number];
export const LATEST_HEADSCALE = HEADSCALE_VERSIONS[HEADSCALE_VERSIONS.length - 1];

export function headscaleImage(version: HeadscaleVersion) {
  // Local development can point the harness at a fork image without changing
  // the supported-version matrix. CI leaves this unset and uses the published
  // image for the requested version.
  const override = process.env.HP_HEADSCALE_IMAGE?.trim();
  if (override) {
    return override;
  }

  const tag = version === "0.30.0" ? "development" : version;
  return `headscale/headscale:${tag}`;
}

export function headscaleVersionAtLeast(version: HeadscaleVersion, target: string) {
  const [major, minor, patch] = version.split(".").map(Number);
  const [targetMajor, targetMinor, targetPatch] = target.split(".").map(Number);
  if (major !== targetMajor) return major > targetMajor;
  if (minor !== targetMinor) return minor > targetMinor;
  return patch >= targetPatch;
}

export const TAILSCALE_IMAGE = "tailscale/tailscale:v1.104.1";
export const DEX_IMAGE = "dexidp/dex:v2.41.1";
// Stands in for the browser, on the Node version Headplane runs on.
export const NODE_IMAGE = "node:24-slim";

// HP_HEADSCALE_VERSIONS: "all", a comma-separated list, or unset for the latest.
export function testedVersions(): readonly HeadscaleVersion[] {
  const env = process.env.HP_HEADSCALE_VERSIONS;
  if (!env) {
    return [LATEST_HEADSCALE];
  }

  if (env === "all") {
    return HEADSCALE_VERSIONS;
  }

  const requested = env.split(",").map((version) => version.trim());
  for (const version of requested) {
    if (!HEADSCALE_VERSIONS.includes(version as HeadscaleVersion)) {
      throw new Error(
        `HP_HEADSCALE_VERSIONS: ${version} isn't in ${HEADSCALE_VERSIONS.join(", ")}`,
      );
    }
  }

  return requested as HeadscaleVersion[];
}
