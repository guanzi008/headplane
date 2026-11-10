import { applyEdits, modify } from "jsonc-parser";

import { parsePolicy } from "~/utils/acl-policy";

export interface ParsedPrefix {
  family: 4 | 6;
  bits: number;
  network: bigint;
  start: bigint;
  end: bigint;
  text: string;
}

export interface UserIPPoolEntry {
  index: number;
  targets: string[];
  pools: string[];
}

export interface PoolConflictContext {
  pools: string[];
  addresses: string[];
}

export interface PoolValidation {
  ok: boolean;
  prefixes: ParsedPrefix[];
  errors: string[];
  warnings: string[];
}

export interface RouteConflict {
  cidr: string;
  line: string;
  message: string;
}

export interface RouteConflictReport {
  routeConflicts: RouteConflict[];
  firewallWarnings: RouteConflict[];
}

export interface ExtractPoolsResult {
  ok: boolean;
  entries: UserIPPoolEntry[];
  error?: string;
}

export interface ReplacePoolsResult {
  ok: boolean;
  policy?: string;
  error?: string;
}

const IPV4_WIDTH = 32;
const IPV6_WIDTH = 128;
const IPV4_ALLOWED = [
  { text: "10.0.0.0/8" },
  { text: "172.16.0.0/12" },
  { text: "192.168.0.0/16" },
  { text: "100.64.0.0/10" },
];
const IPV6_ULA = "fc00::/7";
const RESERVED_TAILSCALE = ["100.100.100.0/24", "100.115.92.0/23"];

const FORMATTING_OPTIONS = {
  insertSpaces: true,
  tabSize: 2,
  eol: "\n",
} as const;

export function parsePoolInput(input: string): { prefixes: ParsedPrefix[]; errors: string[] } {
  const prefixes: ParsedPrefix[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const token of poolTokens(input)) {
    const parsed = parseCIDR(token);
    if (!parsed.ok) {
      errors.push(parsed.error);
      continue;
    }

    const prefix = parsed.prefix;
    if (seen.has(prefix.text)) {
      errors.push(`${prefix.text} is listed more than once.`);
      continue;
    }

    seen.add(prefix.text);
    const policyError = validatePolicyPrefix(prefix);
    if (policyError) {
      errors.push(policyError);
    }

    prefixes.push(prefix);
  }

  for (let left = 0; left < prefixes.length; left++) {
    for (let right = left + 1; right < prefixes.length; right++) {
      if (prefixesOverlap(prefixes[left], prefixes[right])) {
        errors.push(`${prefixes[left].text} overlaps ${prefixes[right].text}.`);
      }
    }
  }

  return { prefixes, errors };
}

export function validateUserPools(
  input: string,
  options: {
    ownAddresses?: string[];
    conflicts?: PoolConflictContext;
  } = {},
): PoolValidation {
  const parsed = parsePoolInput(input);
  const errors = [...parsed.errors];
  const warnings: string[] = [];
  const conflictPools = parseKnownPrefixes(options.conflicts?.pools ?? []);
  const conflictAddresses = parseKnownAddresses(options.conflicts?.addresses ?? []);

  for (const prefix of parsed.prefixes) {
    for (const conflict of conflictPools) {
      if (prefixesOverlap(prefix, conflict.prefix)) {
        errors.push(
          `${prefix.text} overlaps ${conflict.prefix.text}, which already belongs to another user's address pool.`,
        );
      }
    }

    for (const conflict of conflictAddresses) {
      if (prefixContainsAddress(prefix, conflict.address)) {
        errors.push(`${prefix.text} contains the existing node address ${conflict.text}.`);
      }
    }
  }

  const ownIPv4 = (options.ownAddresses ?? [])
    .map((address) => parseAddress(address))
    .filter((address): address is ParsedAddress => address !== undefined && address.family === 4);
  const ownIPv6 = (options.ownAddresses ?? [])
    .map((address) => parseAddress(address))
    .filter((address): address is ParsedAddress => address !== undefined && address.family === 6);

  const poolHasIPv4 = parsed.prefixes.some((prefix) => prefix.family === 4);
  const poolHasIPv6 = parsed.prefixes.some((prefix) => prefix.family === 6);

  if (poolHasIPv4) {
    for (const address of ownIPv4) {
      if (!parsed.prefixes.some((prefix) => prefixContainsAddress(prefix, address))) {
        errors.push(
          `The existing IPv4 address ${address.text} would fall outside this pool. Existing node addresses cannot be migrated automatically; include them or remove the node first.`,
        );
      }
    }
  }

  if (poolHasIPv6) {
    for (const address of ownIPv6) {
      if (!parsed.prefixes.some((prefix) => prefixContainsAddress(prefix, address))) {
        errors.push(
          `The existing IPv6 address ${address.text} would fall outside this pool. Existing node addresses cannot be migrated automatically; include them or remove the node first.`,
        );
      }
    }
  }

  if (parsed.prefixes.some((prefix) => prefix.family === 4)) {
    warnings.push(
      "Headscale enables exact /32 host routes for clients whenever a custom pool exists. Quad100 and MagicDNS ranges remain reserved.",
    );
  }

  return {
    errors: unique(errors),
    ok: errors.length === 0,
    prefixes: parsed.prefixes,
    warnings: unique(warnings),
  };
}

export function extractUserIPPools(policyText: string): ExtractPoolsResult {
  if (policyText.trim().length === 0) {
    return { ok: true, entries: [] };
  }

  const parsed = parsePolicy(policyText);
  if (!parsed.ok) {
    return { ok: false, entries: [], error: parsed.error };
  }

  const raw = parsed.policy.extra.nodeAttrs;
  if (raw === undefined) {
    return { ok: true, entries: [] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, entries: [], error: "nodeAttrs must be an array." };
  }

  const entries: UserIPPoolEntry[] = [];
  for (let index = 0; index < raw.length; index++) {
    const entry = raw[index];
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, entries: [], error: `nodeAttrs[${index}] must be an object.` };
    }

    const record = entry as Record<string, unknown>;
    const targets = toStringArray(record.target);
    if (targets === undefined) {
      return {
        ok: false,
        entries: [],
        error: `nodeAttrs[${index}].target must be a string array.`,
      };
    }

    const pools = record.ipPool === undefined ? [] : toStringArray(record.ipPool);
    if (pools === undefined) {
      return {
        ok: false,
        entries: [],
        error: `nodeAttrs[${index}].ipPool must be a string array.`,
      };
    }

    entries.push({ index, pools, targets });
  }

  return { ok: true, entries };
}

export function findUserPoolEntry(
  entries: UserIPPoolEntry[],
  userReference: string | string[],
): { entry?: UserIPPoolEntry; error?: string } {
  const references = new Set(Array.isArray(userReference) ? userReference : [userReference]);
  const displayReference = Array.from(references).join(" or ");
  const matches = entries.filter(
    (entry) =>
      entry.targets.length === 1 && references.has(entry.targets[0]) && entry.pools.length > 0,
  );

  if (matches.length > 1) {
    return {
      error: `${displayReference} has more than one nodeAttrs.ipPool entry. Fix the ACL policy before editing it here.`,
    };
  }

  return { entry: matches[0] };
}

export function replaceUserIPPool(
  policyText: string,
  entryIndex: number | null,
  userReference: string,
  pools: string[],
): ReplacePoolsResult {
  const source = policyText.trim().length === 0 ? "{}\n" : policyText;
  const parsed = parsePolicy(source);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const nodeAttrs = parsed.policy.extra.nodeAttrs;
  if (nodeAttrs !== undefined && !Array.isArray(nodeAttrs)) {
    return { ok: false, error: "nodeAttrs must be an array." };
  }

  const entries = extractUserIPPools(source);
  if (!entries.ok) {
    return { ok: false, error: entries.error };
  }

  if (entryIndex === null && pools.length > 0) {
    if (nodeAttrs === undefined) {
      const edits = modify(source, ["nodeAttrs"], [{ ipPool: pools, target: [userReference] }], {
        formattingOptions: FORMATTING_OPTIONS,
      });
      return finishPolicyEdit(source, edits);
    }

    const newIndex = nodeAttrs.length;
    const edits = modify(
      source,
      ["nodeAttrs", newIndex],
      { ipPool: pools, target: [userReference] },
      { formattingOptions: FORMATTING_OPTIONS },
    );
    return finishPolicyEdit(source, edits);
  }

  if (entryIndex === null) {
    return { ok: true, policy: source };
  }

  const entry = Array.isArray(nodeAttrs) ? nodeAttrs[entryIndex] : undefined;
  if (entry === undefined || entry === null || typeof entry !== "object" || Array.isArray(entry)) {
    return { ok: false, error: "The selected nodeAttrs entry no longer exists." };
  }

  const record = entry as Record<string, unknown>;
  if (pools.length > 0) {
    const edits = modify(source, ["nodeAttrs", entryIndex, "ipPool"], pools, {
      formattingOptions: FORMATTING_OPTIONS,
    });
    return finishPolicyEdit(source, edits);
  }

  const hasOtherFields = Object.keys(record).some((key) => key !== "target" && key !== "ipPool");
  const edits = modify(
    source,
    hasOtherFields ? ["nodeAttrs", entryIndex, "ipPool"] : ["nodeAttrs", entryIndex],
    undefined,
    { formattingOptions: FORMATTING_OPTIONS },
  );
  return finishPolicyEdit(source, edits);
}

export function parseRouteConflicts(
  input: string,
  candidates: ParsedPrefix[],
): RouteConflictReport {
  const routeConflicts: RouteConflict[] = [];
  const firewallWarnings: RouteConflict[] = [];
  const seen = new Set<string>();
  const candidateText = candidates.map((prefix) => prefix.text).join(", ");

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }

    // The API already gives us every node in this tailnet. A pasted
    // `tailscale status` line would only duplicate those checks and the
    // 100.64/10 interface route is expected even for a custom pool.
    if (/\btailscale\d*\b/i.test(line)) {
      continue;
    }

    const observed = observedRanges(line);
    for (const range of observed) {
      if (range.bits === 0 || !candidates.some((candidate) => prefixesOverlap(candidate, range))) {
        continue;
      }

      const isFirewall = /\b(iptables|ip6tables|nft|ufw|firewall|firewalld|pfctl|netsh)\b/i.test(
        line,
      );
      const conflict: RouteConflict = {
        cidr: range.text,
        line,
        message: isFirewall
          ? `${range.text} appears in a firewall rule and overlaps the proposed pool ${candidateText}. Review the rule before saving.`
          : `${range.text} overlaps the proposed pool ${candidateText}.`,
      };
      const key = `${isFirewall ? "firewall" : "route"}:${range.text}:${line}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      if (isFirewall) {
        firewallWarnings.push(conflict);
      } else {
        routeConflicts.push(conflict);
      }
    }
  }

  return { firewallWarnings, routeConflicts };
}

export function extractRoutePrefixes(input: string): string[] {
  const prefixes: string[] = [];
  const seen = new Set<string>();
  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#") || /\btailscale\d*\b/i.test(line)) {
      continue;
    }
    for (const range of observedRanges(line)) {
      if (range.bits === 0 || seen.has(range.text)) {
        continue;
      }
      seen.add(range.text);
      prefixes.push(range.text);
    }
  }
  return prefixes;
}

export function suggestAvailablePools(exclusions: string[]): string[] {
  const excluded = [
    ...parseKnownPrefixes(exclusions).map((entry) => entry.prefix),
    ...parseKnownAddresses(exclusions)
      .map((entry) => parseCIDR(`${entry.text}/${entry.address.family === 4 ? 32 : 128}`))
      .filter((entry): entry is { ok: true; prefix: ParsedPrefix } => entry.ok)
      .map((entry) => entry.prefix),
    ...parseKnownPrefixes(RESERVED_TAILSCALE).map((entry) => entry.prefix),
  ];
  const suggestions: string[] = [];
  let hasIPv4 = false;
  let hasIPv6 = false;

  const addSuggestion = (text: string) => {
    const parsed = parseCIDR(text);
    if (!parsed.ok || suggestions.includes(parsed.prefix.text)) {
      return false;
    }
    if ((parsed.prefix.family === 4 && hasIPv4) || (parsed.prefix.family === 6 && hasIPv6)) {
      return false;
    }
    if (excluded.some((prefix) => prefixesOverlap(prefix, parsed.prefix))) {
      return false;
    }
    if (validatePolicyPrefix(parsed.prefix)) {
      return false;
    }

    suggestions.push(parsed.prefix.text);
    hasIPv4 ||= parsed.prefix.family === 4;
    hasIPv6 ||= parsed.prefix.family === 6;
    return hasIPv4 && hasIPv6;
  };

  for (let second = 42; second <= 255; second++) {
    for (let third = 0; third <= 255; third++) {
      if (addSuggestion(`10.${second}.${third}.0/24`)) {
        return suggestions;
      }
    }
  }

  for (let second = 16; second <= 31; second++) {
    for (let third = 0; third <= 255; third++) {
      if (addSuggestion(`172.${second}.${third}.0/24`)) {
        return suggestions;
      }
    }
  }

  for (let third = 0; third <= 255; third++) {
    if (addSuggestion(`192.168.${third}.0/24`)) {
      return suggestions;
    }
  }

  for (let second = 64; second <= 127; second++) {
    for (let third = 0; third <= 255; third++) {
      if (addSuggestion(`100.${second}.${third}.0/24`)) {
        return suggestions;
      }
    }
  }

  for (let group = 1; group <= 65_535; group++) {
    if (addSuggestion(`fd42:${group.toString(16)}::/64`)) {
      return suggestions;
    }
  }

  return suggestions;
}

export function asUserReference(userName: string): string {
  return userName.endsWith("@") ? userName : `${userName}@`;
}

export function prefixesOverlap(left: ParsedPrefix, right: ParsedPrefix): boolean {
  return left.start <= right.end && right.start <= left.end;
}

function prefixContainsAddress(prefix: ParsedPrefix, address: ParsedAddress): boolean {
  return (
    prefix.family === address.family && address.value >= prefix.start && address.value <= prefix.end
  );
}

interface ParsedAddress {
  family: 4 | 6;
  value: bigint;
  text: string;
}

function parseAddress(input: string): ParsedAddress | undefined {
  const value = input.trim().replace(/%.+$/, "");
  const ipv4 = parseIPv4(value);
  if (ipv4 !== undefined) {
    return { family: 4, text: formatIPv4(ipv4), value: ipv4 };
  }

  const ipv6 = parseIPv6(value);
  if (ipv6 !== undefined) {
    return { family: 6, text: formatIPv6(ipv6), value: ipv6 };
  }

  return undefined;
}

function parseCIDR(
  input: string,
): { ok: true; prefix: ParsedPrefix } | { ok: false; error: string } {
  const parts = input.trim().split("/");
  if (parts.length !== 2) {
    return { ok: false, error: `${input} is not a CIDR range.` };
  }

  const [rawAddress, rawBits] = parts;
  const address = parseAddress(rawAddress);
  if (!address) {
    return { ok: false, error: `${input} does not contain a valid IP address.` };
  }
  if (!/^\d{1,3}$/.test(rawBits)) {
    return { ok: false, error: `${input} does not contain a valid prefix length.` };
  }

  const bits = Number(rawBits);
  const width = address.family === 4 ? IPV4_WIDTH : IPV6_WIDTH;
  if (bits < 0 || bits > width) {
    return { ok: false, error: `${input} has a prefix length outside 0-${width}.` };
  }

  const hostBits = BigInt(width - bits);
  const masked = (address.value >> hostBits) << hostBits;
  if (masked !== address.value) {
    const network = address.family === 4 ? formatIPv4(masked) : formatIPv6(masked);
    return {
      ok: false,
      error: `${input} has host bits set; use ${network}/${bits}.`,
    };
  }

  const widthMask = (1n << BigInt(width)) - 1n;
  const networkMask = widthMask ^ ((1n << hostBits) - 1n);
  const start = address.value & networkMask;
  const end = start | (widthMask ^ networkMask);
  const text = `${address.text}/${bits}`;

  return {
    ok: true,
    prefix: {
      bits,
      end,
      family: address.family,
      network: start,
      start,
      text,
    },
  };
}

function validatePolicyPrefix(prefix: ParsedPrefix): string | undefined {
  if (prefix.family === 4) {
    const allowed = IPV4_ALLOWED.some((entry) => {
      const parsed = parseCIDR(entry.text);
      return (
        parsed.ok && prefix.bits >= parsed.prefix.bits && prefixesAreWithin(prefix, parsed.prefix)
      );
    });
    if (!allowed) {
      return `${prefix.text} must be inside 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, or 100.64.0.0/10.`;
    }
    if (prefix.bits > 30) {
      return `${prefix.text} is too small for Headscale to allocate node addresses (use /30 or larger).`;
    }
  } else {
    const ula = parseCIDR(IPV6_ULA);
    if (!ula.ok || prefix.bits < ula.prefix.bits || !prefixesAreWithin(prefix, ula.prefix)) {
      return `${prefix.text} must be an IPv6 ULA range inside fc00::/7.`;
    }
    if (prefix.bits > 126) {
      return `${prefix.text} is too small for Headscale to allocate node addresses (use /126 or larger).`;
    }
  }

  for (const reserved of parseKnownPrefixes(RESERVED_TAILSCALE)) {
    if (prefixesOverlap(prefix, reserved.prefix)) {
      return `${prefix.text} overlaps the Tailscale-reserved range ${reserved.prefix.text}. Quad100 (100.115.92.0/23) and MagicDNS (100.100.100.0/24) must stay reserved.`;
    }
  }

  return undefined;
}

function prefixesAreWithin(inner: ParsedPrefix, outer: ParsedPrefix): boolean {
  return inner.family === outer.family && inner.start >= outer.start && inner.end <= outer.end;
}

function parseKnownPrefixes(values: string[]): Array<{ prefix: ParsedPrefix; text: string }> {
  const result: Array<{ prefix: ParsedPrefix; text: string }> = [];
  for (const value of values) {
    const parsed = parseCIDR(value);
    if (parsed.ok) {
      result.push({ prefix: parsed.prefix, text: parsed.prefix.text });
    }
  }
  return result;
}

function parseKnownAddresses(values: string[]): Array<{ address: ParsedAddress; text: string }> {
  const result: Array<{ address: ParsedAddress; text: string }> = [];
  for (const value of values) {
    const address = parseAddress(value);
    if (address) {
      result.push({ address, text: address.text });
    }
  }
  return result;
}

function observedRanges(line: string): ParsedPrefix[] {
  const ranges: ParsedPrefix[] = [];
  const seen = new Set<string>();
  const addRange = (value: string) => {
    const parsed = parseCIDR(value);
    if (parsed.ok && !seen.has(parsed.prefix.text)) {
      seen.add(parsed.prefix.text);
      ranges.push(parsed.prefix);
    }
  };

  for (const match of line.match(/[0-9a-fA-F:.]+?\/\d{1,3}/g) ?? []) {
    addRange(match);
  }

  const netmaskPattern = /(\d{1,3}(?:\.\d{1,3}){3})\s+(\d{1,3}(?:\.\d{1,3}){3})/g;
  for (const match of line.matchAll(netmaskPattern)) {
    const destination = parseIPv4(match[1]);
    const netmask = parseIPv4(match[2]);
    if (destination === undefined || netmask === undefined) {
      continue;
    }
    const bits = netmaskPrefixLength(netmask);
    if (bits !== undefined) {
      addRange(`${formatIPv4(destination)}/${bits}`);
    }
  }

  for (const rawToken of line.split(/[\s,=()<>[\]{}"']+/)) {
    const token = rawToken.replace(/^[:;]+|[:;]+$/g, "");
    if (token.length === 0 || token.includes("/")) {
      continue;
    }
    const address = parseAddress(token);
    if (address) {
      addRange(`${address.text}/${address.family === 4 ? 32 : 128}`);
    }
  }

  return ranges;
}

function netmaskPrefixLength(netmask: bigint): number | undefined {
  let bits = 0;
  let sawZero = false;
  for (let bit = 31; bit >= 0; bit--) {
    const set = ((netmask >> BigInt(bit)) & 1n) === 1n;
    if (set && sawZero) {
      return undefined;
    }
    if (set) {
      bits++;
    } else {
      sawZero = true;
    }
  }
  return bits;
}

function poolTokens(input: string): string[] {
  const tokens: string[] = [];
  for (const line of input.split(/\r?\n/)) {
    const comment = line.indexOf("#");
    const content = (comment === -1 ? line : line.slice(0, comment)).trim();
    if (content.length === 0) {
      continue;
    }
    for (const token of content.split(/[\s,]+/)) {
      const trimmed = token.replace(/^["']|["']$/g, "").replace(/[;,]+$/, "");
      if (trimmed.length > 0) {
        tokens.push(trimmed);
      }
    }
  }
  return tokens;
}

function parseIPv4(input: string): bigint | undefined {
  const parts = input.split(".");
  if (parts.length !== 4) {
    return undefined;
  }

  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part) || (part.length > 1 && part.startsWith("0"))) {
      return undefined;
    }
    const byte = Number(part);
    if (byte > 255) {
      return undefined;
    }
    value = (value << 8n) + BigInt(byte);
  }
  return value;
}

function parseIPv6(input: string): bigint | undefined {
  let text = input.toLowerCase();
  if (text.includes(".")) {
    const lastColon = text.lastIndexOf(":");
    if (lastColon < 0) {
      return undefined;
    }
    const ipv4 = parseIPv4(text.slice(lastColon + 1));
    if (ipv4 === undefined) {
      return undefined;
    }
    text = `${text.slice(0, lastColon + 1)}${(ipv4 >> 16n).toString(16)}:${(ipv4 & 0xffffn).toString(16)}`;
  }

  const halves = text.split("::");
  if (halves.length > 2) {
    return undefined;
  }
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (
    missing < 0 ||
    (halves.length === 1 && missing !== 0) ||
    (halves.length === 2 && missing < 1)
  ) {
    return undefined;
  }

  const groups = [...head, ...Array<string>(missing).fill("0"), ...tail];
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    return undefined;
  }

  let value = 0n;
  for (const group of groups) {
    value = (value << 16n) + BigInt(parseInt(group, 16));
  }
  return value;
}

function formatIPv4(value: bigint): string {
  return [24n, 16n, 8n, 0n].map((shift) => Number((value >> shift) & 0xffn)).join(".");
}

function formatIPv6(value: bigint): string {
  const groups: string[] = [];
  for (let index = 7; index >= 0; index--) {
    groups.push(((value >> BigInt(index * 16)) & 0xffffn).toString(16));
  }

  let bestStart = -1;
  let bestLength = 0;
  for (let index = 0; index < groups.length; index++) {
    if (groups[index] !== "0") {
      continue;
    }
    let end = index;
    while (end < groups.length && groups[end] === "0") {
      end++;
    }
    const length = end - index;
    if (length >= 2 && length > bestLength) {
      bestStart = index;
      bestLength = length;
    }
    index = end - 1;
  }

  if (bestStart < 0) {
    return groups.join(":");
  }

  const before = groups.slice(0, bestStart).join(":");
  const after = groups.slice(bestStart + bestLength).join(":");
  return `${before}::${after}`;
}

function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    return undefined;
  }
  return value as string[];
}

function finishPolicyEdit(source: string, edits: ReturnType<typeof modify>): ReplacePoolsResult {
  const policy = applyEdits(source, edits);
  const parsed = parsePolicy(policy);
  if (!parsed.ok) {
    return { ok: false, error: `The edited policy is invalid: ${parsed.error}` };
  }
  return { ok: true, policy };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
