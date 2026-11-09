import type { PreAuthKey } from "./PreAuthKey";
import type { User } from "./User";

export interface Machine {
  id: string;
  machineKey: string;
  nodeKey: string;
  discoKey: string;
  ipAddresses: string[];
  name: string;

  // User can be null for tag-only nodes in Headscale 0.28+
  user?: User | null;
  lastSeen: string | null;
  expiry: string | null;

  preAuthKey?: PreAuthKey | null;

  createdAt: string;
  registerMethod:
    | "REGISTER_METHOD_UNSPECIFIED"
    | "REGISTER_METHOD_AUTH_KEY"
    | "REGISTER_METHOD_CLI"
    | "REGISTER_METHOD_OIDC";

  tags: string[];
  givenName: string;
  online: boolean;

  // Added to the v1 API in Headscale 0.30. Older versions only expose the
  // ephemeral flag on the key the node was created with.
  ephemeral?: boolean;

  // Added in Headscale 0.26+
  approvedRoutes: string[];
  availableRoutes: string[];
  subnetRoutes: string[];
}
