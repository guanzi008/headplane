// Headscale reads node.expiry with Prometheus' duration parser, which accepts
// y/w/d in addition to Go's duration units and requires units from large to
// small. Keep the browser-side check aligned so a saved value doesn't silently
// fall back to "never expires" when Headscale restarts.
const units = ["y", "w", "d", "h", "m", "s", "ms"] as const;

export function isPrometheusDuration(value: string): boolean {
  const duration = value.trim();
  if (duration === "0") return true;
  if (duration.length === 0) return false;

  let rest = duration;
  let lastUnit = -1;

  while (rest.length > 0) {
    const number = rest.match(/^[0-9]+/)?.[0];
    if (!number) return false;

    rest = rest.slice(number.length);
    const unit = rest.match(/^[^0-9]+/)?.[0];
    if (!unit) return false;

    const index = units.indexOf(unit as (typeof units)[number]);
    if (index <= lastUnit) return false;

    lastUnit = index;
    rest = rest.slice(unit.length);
  }

  return true;
}
