import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReferencePage } from "@/components/reference-page";
import type { GeneratedReference } from "@/lib/types";

describe("ReferencePage", () => {
  it("renders server navigation, setup snippets, tool schemas, and header artifact buttons", () => {
    render(<ReferencePage markdown="# Ref" snapshot={reference} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Generated Test MCP Reference",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("Langfuse Docs MCP").length).toBeGreaterThan(0);
    expect(screen.getByText("Cursor mcp.json")).toBeTruthy();
    expect(screen.getAllByText("search").length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link", { name: /JSON/i })
        .some(
          (link) =>
            link.getAttribute("href") === "/generated/mcp-reference.json",
        ),
    ).toBe(true);
  });
});

const reference: GeneratedReference = {
  schemaVersion: "1.0",
  title: "Generated Test MCP Reference",
  description: "Generated test description.",
  build: {
    generatedAt: "2026-05-15T12:00:00.000Z",
    generator: "test",
    sourceConfig: "mcp-reference.config.json",
    serverCount: 1,
    toolCount: 1,
  },
  servers: [
    {
      id: "langfuse-docs",
      name: "Langfuse Docs MCP",
      description: "Docs server",
      canonicalUrl: "https://langfuse.com/api/mcp",
      auth: { type: "none" },
      variants: [],
      discovery: { discoveredAt: "2026-05-15T12:00:00.000Z" },
      resources: [],
      prompts: [],
      setupSnippets: [
        {
          id: "cursor",
          client: "Cursor",
          title: "Cursor mcp.json",
          language: "json",
          code: "{}",
        },
      ],
      tools: [
        {
          name: "search",
          description: "Search docs",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string" } },
          },
          exampleRequest: {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: { name: "search", arguments: { query: "string" } },
          },
        },
      ],
    },
  ],
};
