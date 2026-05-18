import { describe, expect, it } from "vitest";

import { discoverMcpServer, McpDiscoveryError } from "@/lib/discovery-client";
import type { ServerConfig } from "@/lib/types";

const server: ServerConfig = {
  id: "langfuse-docs",
  name: "Langfuse Docs MCP",
  url: "https://langfuse.com/api/mcp",
  auth: { type: "none" },
  variants: [],
};

describe("discoverMcpServer", () => {
  it("initializes and lists tools through JSON responses", async () => {
    const methods: string[] = [];
    const fetchImpl = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { method: string };
      methods.push(body.method);

      if (body.method === "initialize") {
        return json({
          jsonrpc: "2.0",
          id: 1,
          result: {
            protocolVersion: "2025-06-18",
            capabilities: { tools: {} },
            serverInfo: { name: "test" },
          },
        });
      }
      if (body.method === "notifications/initialized") {
        return new Response("", { status: 202 });
      }
      return json({
        jsonrpc: "2.0",
        id: 2,
        result: {
          tools: [
            {
              name: "search",
              description: "Search docs",
              inputSchema: { type: "object", properties: { query: { type: "string" } } },
            },
          ],
        },
      });
    };

    const result = await discoverMcpServer(server, { fetchImpl });

    expect(methods).toEqual(["initialize", "notifications/initialized", "tools/list"]);
    expect(result.tools[0].exampleRequest.params).toEqual({
      name: "search",
      arguments: { query: "string" },
    });
  });

  it("parses server-sent event JSON-RPC payloads", async () => {
    const fetchImpl = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { method: string };
      if (body.method === "notifications/initialized") {
        return new Response("", { status: 202 });
      }
      if (body.method === "initialize") {
        return sse({
          jsonrpc: "2.0",
          id: 1,
          result: { protocolVersion: "2025-06-18", capabilities: { tools: {} } },
        });
      }
      return sse({
        jsonrpc: "2.0",
        id: 2,
        result: { tools: [{ name: "overview", inputSchema: {} }] },
      });
    };

    const result = await discoverMcpServer(server, { fetchImpl });
    expect(result.tools[0].name).toBe("overview");
  });

  it("skips resource and prompt listing when capabilities are not advertised", async () => {
    const methods: string[] = [];
    const fetchImpl = async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { method: string };
      methods.push(body.method);
      if (body.method === "notifications/initialized") {
        return new Response("", { status: 202 });
      }
      return json({
        jsonrpc: "2.0",
        id: 1,
        result: { capabilities: { tools: {} }, tools: [] },
      });
    };

    await discoverMcpServer(server, { fetchImpl });
    expect(methods).not.toContain("resources/list");
    expect(methods).not.toContain("prompts/list");
  });

  it("fails on HTTP errors", async () => {
    const fetchImpl = async () => new Response("unauthorized", { status: 401 });
    await expect(discoverMcpServer(server, { fetchImpl })).rejects.toThrow(McpDiscoveryError);
  });

  it("fails on malformed JSON-RPC responses", async () => {
    const fetchImpl = async () =>
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      });
    await expect(discoverMcpServer(server, { fetchImpl })).rejects.toThrow(
      "malformed JSON-RPC",
    );
  });
});

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { "content-type": "application/json", "mcp-session-id": "session-1" },
  });
}

function sse(value: unknown): Response {
  return new Response(`event: message\ndata: ${JSON.stringify(value)}\n\n`, {
    headers: { "content-type": "text/event-stream", "mcp-session-id": "session-1" },
  });
}
