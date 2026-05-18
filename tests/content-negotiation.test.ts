import { describe, expect, it } from "vitest";

import { prefersMarkdown } from "@/lib/content-negotiation";

describe("prefersMarkdown", () => {
  it("keeps HTML as the default", () => {
    expect(prefersMarkdown(null)).toBe(false);
    expect(prefersMarkdown("text/html,application/xhtml+xml")).toBe(false);
    expect(prefersMarkdown("*/*")).toBe(false);
  });

  it("returns true when Markdown is explicitly preferred", () => {
    expect(prefersMarkdown("text/markdown")).toBe(true);
    expect(prefersMarkdown("text/html;q=0.4,text/markdown;q=1")).toBe(true);
  });

  it("keeps HTML when it has an equal or higher quality", () => {
    expect(prefersMarkdown("text/html,text/markdown")).toBe(false);
    expect(prefersMarkdown("text/html;q=0.9,text/markdown;q=0.2")).toBe(false);
  });
});
