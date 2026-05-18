interface MediaRange {
  type: string;
  q: number;
}

const MARKDOWN_TYPES = new Set(["text/markdown", "text/x-markdown", "application/markdown"]);

export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) {
    return false;
  }

  const ranges = parseAccept(acceptHeader);
  const htmlQ = bestQ(ranges, ["text/html", "application/xhtml+xml"]);
  const markdownQ = bestQ(ranges, Array.from(MARKDOWN_TYPES));
  return markdownQ > 0 && markdownQ > htmlQ;
}

function parseAccept(header: string): MediaRange[] {
  return header
    .split(",")
    .map((part) => {
      const [type = "", ...params] = part.trim().split(";").map((segment) => segment.trim());
      const qParam = params.find((param) => param.startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return {
        type: type.toLowerCase(),
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .filter((range) => range.type.length > 0);
}

function bestQ(ranges: MediaRange[], types: string[]): number {
  return ranges.reduce((best, range) => {
    if (types.includes(range.type)) {
      return Math.max(best, range.q);
    }
    return best;
  }, 0);
}
