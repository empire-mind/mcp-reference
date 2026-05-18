import { readFile } from "node:fs/promises";

import type { AuthConfig, ConnectionVariant, ReferenceConfig, ServerConfig } from "./types";

type Env = Record<string, string | undefined>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

interface LoadOptions {
  serverIds?: string[];
  validateEnv?: boolean;
}

export async function loadReferenceConfig(
  path: string,
  env: Env = process.env,
  options: LoadOptions = {},
): Promise<ReferenceConfig> {
  const raw = JSON.parse(await readFile(path, "utf8")) as unknown;
  return validateReferenceConfig(raw, env, options);
}

export function validateReferenceConfig(
  raw: unknown,
  env: Env = process.env,
  options: LoadOptions = {},
): ReferenceConfig {
  const root = readRecord(raw, "config");
  if (!Array.isArray(root.servers) || root.servers.length === 0) {
    throw new ConfigError("config.servers must be a non-empty array");
  }
  const title = readString(root.title, "config.title");
  const description = readString(root.description, "config.description");

  const seen = new Set<string>();
  const servers = root.servers.map((server, index) => {
    const parsed = readServer(server, `config.servers[${index}]`);
    if (seen.has(parsed.id)) {
      throw new ConfigError(`Duplicate server id "${parsed.id}"`);
    }
    seen.add(parsed.id);
    return parsed;
  });

  const selected = selectServers(servers, options.serverIds);
  if (options.validateEnv !== false) {
    for (const server of selected) {
      validateAuthEnvironment(server, env);
    }
  }

  return { title, description, servers: selected };
}

function selectServers(servers: ServerConfig[], serverIds?: string[]): ServerConfig[] {
  if (!serverIds || serverIds.length === 0) {
    return servers;
  }

  const wanted = new Set(serverIds);
  const selected = servers.filter((server) => wanted.has(server.id));
  const selectedIds = new Set(selected.map((server) => server.id));
  const missing = serverIds.filter((id) => !selectedIds.has(id));
  if (missing.length > 0) {
    throw new ConfigError(`Unknown server id(s): ${missing.join(", ")}`);
  }
  return selected;
}

function readServer(raw: unknown, path: string): ServerConfig {
  const server = readRecord(raw, path);
  const id = readString(server.id, `${path}.id`);
  assertSlug(id, `${path}.id`);

  return {
    id,
    name: readString(server.name, `${path}.name`),
    description:
      server.description === undefined
        ? undefined
        : readString(server.description, `${path}.description`),
    url: readUrl(server.url, `${path}.url`),
    auth: readAuth(server.auth, `${path}.auth`),
    variants: readVariants(server.variants, `${path}.variants`),
  };
}

function readAuth(raw: unknown, path: string): AuthConfig {
  const auth = readRecord(raw, path);
  const type = readString(auth.type, `${path}.type`);

  if (type === "none") {
    return { type };
  }

  if (type === "basic") {
    return {
      type,
      publicKeyEnv: readEnvName(auth.publicKeyEnv, `${path}.publicKeyEnv`),
      secretKeyEnv: readEnvName(auth.secretKeyEnv, `${path}.secretKeyEnv`),
    };
  }

  throw new ConfigError(`${path}.type must be "none" or "basic"`);
}

function readVariants(raw: unknown, path: string): ConnectionVariant[] {
  if (raw === undefined) {
    return [];
  }
  if (!Array.isArray(raw)) {
    throw new ConfigError(`${path} must be an array when provided`);
  }
  return raw.map((variant, index) => {
    const value = readRecord(variant, `${path}[${index}]`);
    return {
      label: readString(value.label, `${path}[${index}].label`),
      url: readUrl(value.url, `${path}[${index}].url`),
    };
  });
}

function validateAuthEnvironment(server: ServerConfig, env: Env): void {
  if (server.auth.type === "none") {
    return;
  }

  const missing = [server.auth.publicKeyEnv, server.auth.secretKeyEnv].filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new ConfigError(
      `${server.id} requires missing build environment variable(s): ${missing.join(", ")}`,
    );
  }
}

function readRecord(raw: unknown, path: string): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ConfigError(`${path} must be an object`);
  }
  return raw as Record<string, unknown>;
}

function readString(raw: unknown, path: string): string {
  if (typeof raw !== "string" || raw.trim() === "") {
    throw new ConfigError(`${path} must be a non-empty string`);
  }
  return raw;
}

function readUrl(raw: unknown, path: string): string {
  const value = readString(raw, path);
  try {
    new URL(value);
  } catch {
    throw new ConfigError(`${path} must be a valid URL`);
  }
  return value;
}

function readEnvName(raw: unknown, path: string): string {
  const value = readString(raw, path);
  if (!/^[A-Z_][A-Z0-9_]*$/.test(value)) {
    throw new ConfigError(`${path} must be an environment variable name`);
  }
  return value;
}

function assertSlug(value: string, path: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new ConfigError(`${path} must be a lowercase slug`);
  }
}
