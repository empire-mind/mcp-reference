import { NextResponse, type NextRequest } from "next/server";

import { prefersMarkdown } from "./lib/content-negotiation";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/" && prefersMarkdown(request.headers.get("accept"))) {
    const response = NextResponse.rewrite(new URL("/generated/mcp-reference.md", request.url));
    response.headers.set("Vary", "Accept");
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("Vary", "Accept");
  return response;
}

export const config = {
  matcher: "/",
};
