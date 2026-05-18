# Langfuse MCP Servers

Standalone Next.js site for Langfuse MCP servers. The app introspects configured MCP servers at build time, writes static JSON and Markdown artifacts, and renders the same generated snapshot in the browser.

## Local Setup

```bash
pnpm install
pnpm generate
pnpm dev
```

The default generation command discovers every configured server and fails if any required server cannot be initialized or introspected.

For unauthenticated local work, generate only the public Docs MCP snapshot:

```bash
pnpm generate:docs
pnpm dev
```

## Build-Time Credentials

The authenticated Langfuse Cloud MCP server uses project-scoped Basic Auth at build time only:

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key
```

The generator constructs `Authorization: Basic base64(LANGFUSE_PUBLIC_KEY:LANGFUSE_SECRET_KEY)` in memory. Credential values are never written into generated artifacts, snippets, browser code, or logs.

## Configuration

`mcp-reference.config.json` is the source of truth for public MCP servers, authentication requirements, and endpoint variants. The initial catalog includes:

- `langfuse-cloud`: authenticated Langfuse Cloud MCP server, introspected from the Cloud EU endpoint and documented with EU, US, Japan, HIPAA, self-hosted, and local variants.
- `langfuse-docs`: unauthenticated Langfuse Docs MCP server.

All configured top-level servers are required for the default production build.

## Generated Artifacts

Generation writes:

- `public/generated/mcp-reference.json`
- `public/generated/mcp-reference.md`

`public/generated/` is ignored by git, but the files are created before `next build` so Vercel includes them in the deployment output.

## Vercel Deployment

Set the Langfuse Cloud credentials in the Vercel project environment, then use the default build command:

```bash
pnpm build
```

The `build` script runs generation before Next.js builds the site. At runtime, the site only serves static generated artifacts and rendered HTML. It does not call MCP servers.

## Public URLs

- `/`: interactive HTML reference by default.
- `/`: generated Markdown when the request `Accept` header prefers Markdown over HTML.
- `/generated/mcp-reference.json`: generated machine-readable JSON catalog.
- `/generated/mcp-reference.md`: generated Markdown catalog.

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
```

Runtime checks should confirm the generated JSON and Markdown URLs are served, root-level Markdown content negotiation works, and no MCP network calls happen after build.
