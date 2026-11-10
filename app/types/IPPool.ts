export interface IPPoolNode {
  id: string;
  name: string;
  ipAddresses: string[];
  tags: string[];
}

export interface IPPoolUser {
  id: string;
  name: string;
  displayName?: string;
  email?: string;
  pools: string[];
  ownAddresses: string[];
  nodes: IPPoolNode[];
  conflicts: {
    pools: string[];
    addresses: string[];
  };
  error?: string;
}

export interface IPPoolPageData {
  canManageAll: boolean;
  currentUserId?: string;
  linked: boolean;
  policyError?: string;
  readOnly: boolean;
  readOnlyReason?: string;
  users: IPPoolUser[];
}
