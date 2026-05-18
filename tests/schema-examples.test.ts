import { describe, expect, it } from "vitest";

import { exampleFromSchema, toolCallExample } from "@/lib/schema-examples";

describe("exampleFromSchema", () => {
  it("generates representative examples for common JSON Schema features", () => {
    expect(
      exampleFromSchema({
        type: "object",
        required: ["query", "limit"],
        properties: {
          query: { type: "string" },
          limit: { type: "integer" },
          includeArchived: { type: "boolean" },
          tags: { type: "array", items: { enum: ["prod", "dev"] } },
          window: {
            type: "object",
            properties: {
              start: { type: "string", format: "date-time" },
            },
          },
        },
      }),
    ).toEqual({
      limit: 1,
      query: "string",
      includeArchived: true,
      tags: ["prod"],
      window: {
        start: "2026-05-15T12:00:00.000Z",
      },
    });
  });

  it("wraps examples as MCP tool call requests", () => {
    expect(toolCallExample("search", { type: "object", properties: { q: { type: "string" } } }))
      .toMatchObject({
        jsonrpc: "2.0",
        method: "tools/call",
        params: {
          name: "search",
          arguments: { q: "string" },
        },
      });
  });
});
