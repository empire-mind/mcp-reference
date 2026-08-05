export type AuthConfig =
  | {
      type: "none";
    }
  | {
      type: "basic";
      publicKeyEnv: string;
      secretKeyEnv: string;
    };

export interface ConnectionVariant {
  label: string;
  url: string;
}

export interface ServerConfig {
  id: string;
  name: string;
  description?: string;
  url: string;
  auth: AuthConfig;
  variants: ConnectionVariant[];
}

export interface ReferenceConfig {
  title: string;
  description: string;
  servers: ServerConfig[];
}

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export interface JsonSchema {
  type?: string | string[];
  enum?: JsonValue[];
  const?: JsonValue;
  default?: JsonValue;
  format?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
}

export interface SetupSnippet {
  id: string;
  client: string;
  title: string;
  language: "bash" | "json";
  code: string;
}

export interface ToolReference {
  name: string;
  description?: string;
  requiresV4?: boolean;
  inputSchema: JsonSchema;
  exampleRequest: JsonObject;
}

export interface ResourceReference {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface PromptReference {
  name: string;
  description?: string;
  arguments?: JsonValue[];
}

export interface DiscoveryMetadata {
  protocolVersion?: string;
  serverInfo?: JsonValue;
  capabilities?: JsonValue;
  discoveredAt: string;
}

export interface GeneratedServer {
  id: string;
  name: string;
  description?: string;
  canonicalUrl: string;
  auth: AuthConfig;
  variants: ConnectionVariant[];
  discovery: DiscoveryMetadata;
  tools: ToolReference[];
  resources: ResourceReference[];
  prompts: PromptReference[];
  setupSnippets: SetupSnippet[];
}

export interface GeneratedReference {
  schemaVersion: "1.0";
  title: string;
  description: string;
  build: {
    generatedAt: string;
    generator: string;
    sourceConfig: string;
    serverCount: number;
    toolCount: number;
  };
  servers: GeneratedServer[];
}
