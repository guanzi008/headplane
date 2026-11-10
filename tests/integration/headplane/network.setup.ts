import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import tc from "testcontainers";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    poolHeadscaleImage: string;
  }
}

// Only the pool suite needs the fork. Upstream contract tests keep using the
// published versions, while this suite builds the actual local source tree.
export async function setup(project: TestProject) {
  const override = process.env.HP_HEADSCALE_POOL_IMAGE?.trim();
  if (override) {
    project.provide("poolHeadscaleImage", override);
    return;
  }

  const source = resolve(process.env.HP_HEADSCALE_SOURCE ?? "../headscale");
  if (!existsSync(join(source, "go.mod"))) {
    throw new Error(
      "Address pool tests require the Headscale fork at ../headscale. Set HP_HEADSCALE_SOURCE to its checkout, or HP_HEADSCALE_POOL_IMAGE to a prebuilt fork image.",
    );
  }

  const directory = await mkdtemp(join(tmpdir(), "hp-headscale-pools-"));
  try {
    execFileSync(
      "go",
      ["build", "-trimpath", "-o", join(directory, "headscale"), "./cmd/headscale"],
      {
        cwd: source,
        env: { ...process.env, CGO_ENABLED: "0", GOOS: "linux" },
        stdio: "inherit",
      },
    );
    await writeFile(
      join(directory, "Dockerfile"),
      [
        "FROM debian:bookworm-slim",
        "RUN mkdir -p /var/lib/headscale /var/run/headscale",
        "COPY headscale /usr/local/bin/headscale",
        'ENTRYPOINT ["headscale"]',
        "",
      ].join("\n"),
    );
    const image = `localhost/headplane-pool-tests:${randomBytes(8).toString("hex")}`;
    // Testcontainers labels the image for automatic cleanup with its Ryuk
    // session, just like the test containers and networks.
    await tc.GenericContainer.fromDockerfile(directory).build(image);
    project.provide("poolHeadscaleImage", image);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
