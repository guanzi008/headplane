import { expect, test } from "vitest";

import { isPrometheusDuration } from "~/utils/duration";

test.for(["0", "30m", "24h", "180d", "1h30m", "1y2w3d4h5m6s7ms"])(
  "accepts Headscale duration %s",
  (value) => {
    expect(isPrometheusDuration(value)).toBe(true);
  },
);

test.for(["", "180", "1m1d", "1d1d", "1x", "-1h", "1h 30m"])(
  "rejects invalid Headscale duration %s",
  (value) => {
    expect(isPrometheusDuration(value)).toBe(false);
  },
);
