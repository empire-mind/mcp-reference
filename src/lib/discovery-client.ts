import { exampleFromSchema, toolCallExample } from "./schema-examples";
import type {
  DiscoveryMetadata,
  JsonSchema,
  JsonValue,
  PromptReference,
  ResourceReference,
  ServerConfig,
  ToolReference,
} from "./types";

export const MCP_PROTOCOL_VERSION = "2025-06-18";

export class McpDiscoveryError extends Error {
  constructor(
    message: string,
    readonly details?: { status?: number; method?: string; code?: number },
  ) {
    super(message);
    this.name = "McpDiscoveryError";
  }
}

interface RpcResponse {
  jsonrpc: "2.0";
  id?: number | string | null;
  result?: JsonValue;
  error?: {
    code: number;
    message: string;
    data?: JsonValue;
  };
}

interface DiscoveryOptions {
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

interface DiscoveryResult {
  discovery: DiscoveryMetadata;
  tools: ToolReference[];
  resources: ResourceReference[];
  prompts: PromptReference[];
}

export async function discoverMcpServer(
  server: ServerConfig,
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult> {
  const client = new McpHttpClient(server.url, options.headers ?? {}, options.fetchImpl ?? fetch);
  const initialized = await client.request("initialize", {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: {
      name: "mcp-reference-generator",
      version: "0.1.0",
    },
  });

  await client.notify("notifications/initialized");

  const capabilities = getObject(initialized, "capabilities");
  const tools = capabilities.tools
    ? await listPaginated<ToolWire>(client, "tools/list", "tools")
    : [];
  const resources = capabilities.resources
    ? await listPaginated<ResourceReference>(client, "resources/list", "resources")
    : [];
  const prompts = capabilities.prompts
    ? await listPaginated<PromptReference>(client, "prompts/list", "prompts")
    : [];

  return {
    discovery: {
      protocolVersion: getString(initialized, "protocolVersion"),
      serverInfo: getValue(initialized, "serverInfo"),
      capabilities: getValue(initialized, "capabilities"),
      discoveredAt: new Date().toISOString(),
    },
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: normalizeSchema(tool.inputSchema),
      exampleRequest: toolCallExample(tool.name, normalizeSchema(tool.inputSchema)),
    })),
    resources,
    prompts,
  };
}

class McpHttpClient {
  private nextId = 1;
  private sessionId: string | undefined;

  constructor(
    private readonly url: string,
    private readonly extraHeaders: Record<string, string>,
    private readonly fetchImpl: typeof fetch,
  ) {}

  async request(method: string, params: JsonValue = {}): Promise<JsonValue> {
    const id = this.nextId++;
    const response = await this.post(method, { jsonrpc: "2.0", id, method, params });
    const rpc = await readRpcResponse(response, method);
    if (!rpc) {
      throw new McpDiscoveryError(`MCP method ${method} returned an empty response`, { method });
    }
    if (rpc.error) {
      throw new McpDiscoveryError(`MCP method ${method} failed: ${rpc.error.message}`, {
        method,
        code: rpc.error.code,
      });
    }
    return rpc.result ?? {};
  }

  async notify(method: string, params?: JsonValue): Promise<void> {
    await this.post(method, { jsonrpc: "2.0", method, ...(params === undefined ? {} : { params }) });
  }

  private async post(method: string, body: JsonValue): Promise<Response> {
    const headers: Record<string, string> = {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      "mcp-protocol-version": MCP_PROTOCOL_VERSION,
      ...this.extraHeaders,
    };
    if (this.sessionId) {
      headers["mcp-session-id"] = this.sessionId;
    }

    const response = await this.fetchImpl(this.url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const sessionId = response.headers.get("mcp-session-id");
    if (sessionId) {
      this.sessionId = sessionId;
    }

    if (!response.ok) {
      const text = await safeReadText(response);
      throw new McpDiscoveryError(
        `MCP method ${method} returned HTTP ${response.status}${text ? `: ${text}` : ""}`,
        { status: response.status, method },
      );
    }

    return response;
  }
}

interface ToolWire {
  name: string;
  description?: string;
  inputSchema?: JsonSchema;
}

async function listPaginated<T>(
  client: McpHttpClient,
  method: string,
  resultKey: string,
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;
  do {
    const result = await client.request(method, cursor ? { cursor } : {});
    const page = getValue(result, resultKey);
    if (Array.isArray(page)) {
      items.push(...(page as T[]));
    }
    cursor = getString(result, "nextCursor");
  } while (cursor);
  return items;
}

async function readRpcResponse(response: Response, method: string): Promise<RpcResponse | undefined> {
  const text = await response.text();
  if (!text.trim()) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload =
    contentType.includes("text/event-stream") || text.includes("\ndata:")
      ? parseSsePayload(text, method)
      : parseJsonPayload(text, method);

  if (Array.isArray(payload)) {
    return payload.find((item) => isRpcResponse(item));
  }
  if (isRpcResponse(payload)) {
    return payload;
  }

  throw new McpDiscoveryError(`MCP method ${method} returned malformed JSON-RPC`, { method });
}

function parseJsonPayload(text: string, method: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new McpDiscoveryError(`MCP method ${method} returned malformed JSON`, { method });
  }
}

function parseSsePayload(text: string, method: string): unknown {
  for (const event of text.split(/\n\n+/)) {
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n")
      .trim();
    if (!data || data === "[DONE]") {
      continue;
    }
    return parseJsonPayload(data, method);
  }
  throw new McpDiscoveryError(`MCP method ${method} returned an empty SSE payload`, { method });
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

function isRpcResponse(value: unknown): value is RpcResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const object = value as Record<string, unknown>;
  return object.jsonrpc === "2.0" && ("result" in object || "error" in object);
}

function normalizeSchema(schema: JsonSchema | undefined): JsonSchema {
  return schema ?? { type: "object", properties: {} };
}

function getObject(value: JsonValue, key: string): Record<string, JsonValue> {
  const child = getValue(value, key);
  if (typeof child === "object" && child !== null && !Array.isArray(child)) {
    return child as Record<string, JsonValue>;
  }
  return {};
}

function getString(value: JsonValue, key: string): string | undefined {
  const child = getValue(value, key);
  return typeof child === "string" ? child : undefined;
}

function getValue(value: JsonValue, key: string): JsonValue | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return (value as Record<string, JsonValue>)[key];
}

export { exampleFromSchema };
