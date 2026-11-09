import { access, constants, readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { setTimeout } from "node:timers/promises";

import { parse as parseJson, type ParseError } from "jsonc-parser";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import log from "~/utils/log";

export interface DNSRecord {
  type: "A" | "AAAA" | (string & {});
  name: string;
  value: string;
}

// This class is solely for DNS records that are out of tree in the main
// Headscale config file. If you are using dns.extra_records_path, it will
// be managed here and not in the main config file.
//
// All DNS insertions and deletions are handled by the main config manager,
// but are passed through to here if the extra file is being used.
export class HeadscaleDNSConfig {
  private records: DNSRecord[];
  private access: "rw" | "ro" | "no";
  private path?: string;
  private writeLock = false;

  constructor(access: "rw" | "ro" | "no", records?: DNSRecord[], path?: string) {
    this.access = access;
    this.records = records ?? [];
    this.path = path;
  }

  readable() {
    return this.access !== "no";
  }

  writable() {
    return this.access === "rw";
  }

  get r() {
    return this.records;
  }

  async patch(records: DNSRecord[]) {
    if (!this.path || !this.readable() || !this.writable()) {
      return;
    }

    this.records = records;
    log.debug("config", "Patching DNS records (%d -> %d)", this.records.length, records.length);

    return this.write();
  }

  private async write() {
    if (!this.path || !this.writable()) {
      return;
    }

    while (this.writeLock) {
      await setTimeout(100);
    }

    this.writeLock = true;
    log.debug("config", "Writing updated DNS configuration to %s", this.path);
    const data = serializeRecords(this.path, this.records);
    await writeFile(this.path, data);
    this.writeLock = false;
  }
}

export async function loadHeadscaleDNS(path?: string) {
  if (!path) {
    return;
  }

  log.debug("config", "Loading Headscale DNS configuration file: %s", path);
  const { w, r } = await validateConfigPath(path);
  if (!r) {
    return new HeadscaleDNSConfig("no");
  }

  const records = await loadConfigFile(path);
  if (!records) {
    return new HeadscaleDNSConfig("no");
  }

  return new HeadscaleDNSConfig(w ? "rw" : "ro", records, path);
}

async function validateConfigPath(path: string) {
  try {
    await access(path, constants.F_OK | constants.R_OK);
    log.info("config", "Found a valid Headscale DNS file at %s", path);
  } catch (error) {
    log.error("config", "Unable to read a Headscale DNS file at %s", path);
    log.error("config", "%s", error);
    return { w: false, r: false };
  }

  try {
    await access(path, constants.F_OK | constants.W_OK);
    return { w: true, r: true };
  } catch {
    log.warn("config", "Headscale DNS file at %s is not writable", path);
    return { w: false, r: true };
  }
}

async function loadConfigFile(path: string) {
  log.debug("config", "Reading Headscale DNS file at %s", path);
  try {
    const data = await readFile(path, "utf8");
    return parseRecords(path, data);
  } catch (e) {
    log.error("config", "Error reading Headscale DNS file at %s", path);
    log.error("config", "%s", e);
    return false;
  }
}

// Headscale 0.30 picks the format from the extension. Both JSON extensions
// are HuJSON, so comments and trailing commas are valid in either one.
function parseRecords(path: string, data: string): DNSRecord[] {
  const format = recordsFormat(path);
  let parsed: unknown;

  if (format === "yaml") {
    parsed = parseYaml(data);
  } else {
    const errors: ParseError[] = [];
    parsed = parseJson(data, errors, { allowTrailingComma: true });
    if (errors.length > 0) {
      throw new Error(`invalid JSON: ${errors.map((error) => error.error).join(", ")}`);
    }
  }

  // Headscale treats an empty file as no records rather than invalid input.
  if (parsed == null) return [];
  if (!Array.isArray(parsed)) {
    throw new Error("DNS records must be a list");
  }

  return parsed.map((record, index) => {
    if (
      record == null ||
      typeof record !== "object" ||
      typeof record.name !== "string" ||
      typeof record.type !== "string" ||
      typeof record.value !== "string"
    ) {
      throw new Error(`DNS record ${index + 1} needs string name, type, and value fields`);
    }

    return record as DNSRecord;
  });
}

function serializeRecords(path: string, records: DNSRecord[]) {
  return recordsFormat(path) === "yaml" ? stringifyYaml(records) : JSON.stringify(records, null, 4);
}

function recordsFormat(path: string): "json" | "yaml" {
  switch (extname(path).toLowerCase()) {
    case ".json":
    case ".hujson":
      return "json";
    case ".yaml":
    case ".yml":
      return "yaml";
    default:
      throw new Error("DNS records file must end in .json, .hujson, .yaml, or .yml");
  }
}
