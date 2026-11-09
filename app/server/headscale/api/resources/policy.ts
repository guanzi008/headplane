import type { Capabilities } from "../capabilities";
import type { Transport } from "../transport";

export interface PolicyApi {
  get(): Promise<{ policy: string; updatedAt: Date | null }>;
  set(policy: string): Promise<{ policy: string; updatedAt: Date }>;
}

export function makePolicyApi(
  transport: Transport,
  _capabilities: Capabilities,
  apiKey: string,
): PolicyApi {
  return {
    get: async () => {
      const { policy, updatedAt } = await transport.request<{
        policy: string;
        updatedAt: string | null;
      }>({ method: "GET", path: "v1/policy", apiKey });
      return {
        policy,
        updatedAt: parseUpdatedAt(updatedAt),
      };
    },
    set: async (policy) => {
      const { policy: newPolicy, updatedAt } = await transport.request<{
        policy: string;
        updatedAt: string;
      }>({ method: "PUT", path: "v1/policy", apiKey, body: { policy } });
      return { policy: newPolicy, updatedAt: new Date(updatedAt) };
    },
  };
}

// File mode has no update timestamp, but Headscale 0.30 emits Go's zero
// time instead of null. Treat it as absent so the policy stays read-only.
const ZERO_TIME = new Date("0001-01-01T00:00:00Z").getTime();

function parseUpdatedAt(value: string | null): Date | null {
  if (value === null) return null;

  const parsed = new Date(value);
  return parsed.getTime() === ZERO_TIME ? null : parsed;
}
