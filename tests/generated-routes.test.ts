import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GeneratedReference } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  buildReferenceArtifacts: vi.fn(),
}));

vi.mock("@/lib/reference-builder", () => ({
  buildReferenceArtifacts: mocks.buildReferenceArtifacts,
}));

const snapshot: GeneratedReference = {
  schemaVersion: "1.0",
  title: "Langfuse MCP Servers",
  description: "Reference",
  build: {
    generatedAt: "2026-05-18T12:00:00.000Z",
    generator: "src/lib/reference-builder.ts",
    sourceConfig: "mcp-reference.config.json",
    serverCount: 0,
    toolCount: 0,
  },
  servers: [],
};

describe("generated artifact routes", () => {
  beforeEach(() => {
    mocks.buildReferenceArtifacts.mockResolvedValue({
      snapshot,
      markdown: "# Langfuse MCP Servers\n",
    });
  });

  it("serves the JSON artifact through an hourly ISR route", async () => {
    const route = await import("@/app/generated/mcp-reference.json/route");
    const response = await route.GET();

    expect(route.dynamic).toBe("force-static");
    expect(route.revalidate).toBe(3600);
    expect(route.runtime).toBe("nodejs");
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await response.json()).toMatchObject({
      title: "Langfuse MCP Servers",
      build: { sourceConfig: "mcp-reference.config.json" },
    });
  });

  it("serves the Markdown artifact through an hourly ISR route", async () => {
    const route = await import("@/app/generated/mcp-reference.md/route");
    const response = await route.GET();

    expect(route.dynamic).toBe("force-static");
    expect(route.revalidate).toBe(3600);
    expect(route.runtime).toBe("nodejs");
    expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
    expect(await response.text()).toBe("# Langfuse MCP Servers\n");
  });
});
