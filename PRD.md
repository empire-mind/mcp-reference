# MCP Reference Site PRD

## Problem Statement

Langfuse has MCP servers whose capabilities are discoverable from the servers themselves, but there is no standalone public reference that lists the currently available MCP servers, their tools, their schemas, and their client setup instructions in a way that is both human-readable and agent-readable.

The existing Langfuse docs pages explain individual MCP servers, but they are manually authored and do not provide a generated reference snapshot. The desired site should be deployed at `mcp.reference.langfuse.com`, feel visually aligned with the new Langfuse docs aesthetic, and remain safe for public hosting by performing all MCP introspection at build time only. The deployed website must not call authenticated MCP servers at runtime and must not expose build credentials.

The reference also needs to serve non-human consumers. Agents and scripts should be able to fetch a generated JSON catalog and a generated Markdown reference without scraping the rendered UI.

## Solution

Build a standalone open-source Next.js application using TypeScript, Tailwind CSS, shadcn/ui, and pnpm. The app will read a checked-in `mcp-reference.config.json` file that lists public MCP servers, authentication requirements, and connection variants. During the build, a generation step will initialize each configured MCP server and call discovery methods such as tool listing. The generator will produce a static machine-readable JSON snapshot and a static Markdown representation under `public/generated/`.

The web UI will render from the same generated snapshot and use a Langfuse-docs-inspired layout: sticky top navigation, left server/tool navigation, main reference content, compact typography, bordered panels, subtle pattern backgrounds, light/dark support, and copied Langfuse brand assets. The UI will include client setup snippets derived from configuration and existing Langfuse docs patterns.

Runtime behavior is limited to serving static generated artifacts and handling content negotiation. Requests for the home page that prefer Markdown should receive the generated Markdown representation. The website must never call MCP servers at runtime. The generated artifacts are deploy outputs and must not be committed.

## User Stories

1. As a Langfuse user, I want to see a public MCP reference, so that I can understand which Langfuse MCP servers are available.
2. As a Langfuse Cloud user, I want to see the authenticated Langfuse Cloud MCP server, so that I can connect my project-scoped API keys to an MCP client.
3. As a Langfuse docs user, I want to see the public Docs MCP server, so that I can connect an AI coding agent to Langfuse documentation.
4. As a developer, I want the reference to infer tools from MCP discovery, so that the site stays aligned with the current server implementation.
5. As a developer, I want MCP introspection to happen at build time, so that deployed pages do not make live MCP calls.
6. As a security-conscious maintainer, I want credentials used only during build, so that project API keys are never exposed to browsers or runtime routes.
7. As a maintainer, I want a global server configuration, so that adding or changing MCP servers does not require changing the rendering system.
8. As a maintainer, I want each configured server to declare its own auth environment variables, so that different authenticated servers can use different credentials.
9. As a maintainer, I want build generation to fail when any configured server cannot be introspected, so that the deployed reference is never silently incomplete.
10. As a user, I want Langfuse Cloud regional endpoints listed as variants, so that I can pick the correct Cloud region.
11. As a user, I want the Cloud EU server to be introspected once and used as the canonical Langfuse Cloud schema, so that equivalent regional variants are still documented without redundant authenticated introspection.
12. As a user, I want self-hosted endpoint examples, so that I can adapt the setup to my own deployment.
13. As a user, I want client setup snippets for supported MCP clients, so that I can quickly connect the server.
14. As a Cursor user, I want Cursor setup instructions, so that I can configure MCP from Cursor.
15. As a VS Code Copilot user, I want Copilot setup instructions for the Docs MCP server, so that I can add it to Agent mode.
16. As a Claude Code user, I want CLI setup instructions, so that I can add Langfuse MCP servers from the terminal.
17. As a Windsurf user, I want proxy-based setup instructions for the Docs MCP server, so that I can use clients that do not directly support streamable HTTP.
18. As a generic MCP client user, I want protocol-level JSON configuration examples, so that I can adapt the config to my client.
19. As a human reader, I want servers to be the primary navigation level, so that I can orient myself before choosing a tool.
20. As a human reader, I want tools listed under each server, so that I can jump directly to a tool reference.
21. As a human reader, I want each tool to show its advertised description, so that I can understand the tool in the server author's words.
22. As a human reader, I want each tool to show its input schema, so that I can understand required and optional arguments.
23. As a human reader, I want generated example MCP requests, so that I can see how to call each tool without executing it.
24. As a maintainer, I want examples generated from schemas only, so that builds do not invoke tools or expose project data.
25. As a maintainer, I want the generated JSON reference to be published as a static artifact, so that scripts and agents can consume the same catalog as the UI.
26. As an AI agent, I want a Markdown representation of the reference, so that I can consume the site without parsing HTML.
27. As an AI agent, I want content negotiation to return Markdown when requested, so that I can ask for the root URL in a machine-friendly format.
28. As a browser user, I want the default root URL to return the interactive HTML reference, so that the site works like normal documentation.
29. As a browser user, I want a "copy as Markdown" action, so that I can paste the full generated reference into another tool.
30. As a browser user, I want a "download Markdown" action, so that I can save the agent-readable reference locally.
31. As a maintainer, I want the generated JSON and Markdown files ignored by git, so that the repository does not churn when server schemas change.
32. As a maintainer, I want generated files to still be included in the Vercel build output, so that deployed static artifacts are available.
33. As a maintainer, I want the README to explain local setup, so that open-source contributors can run the project.
34. As a maintainer, I want the README to explain build-time credentials, so that contributors understand why authenticated generation can fail locally.
35. As a maintainer, I want the README to explain deployment on Vercel, so that production setup is reproducible.
36. As a maintainer, I want the README to explain the generated artifacts, so that contributors do not try to commit them.
37. As a designer, I want the site to use the aesthetic of the current Langfuse docs, so that the reference feels like part of the Langfuse ecosystem.
38. As a designer, I want the site to be standalone, so that it does not depend on the docs repository at build time.
39. As a user, I want light and dark theme support, so that the site matches my viewing preference.
40. As a mobile user, I want the reference to remain navigable on small screens, so that I can use it without a desktop viewport.
41. As a maintainer, I want the app to use the latest stable Next.js stack, so that the project starts from current framework defaults.
42. As a maintainer, I want pnpm to be the package manager, so that dependency management matches the desired workflow.
43. As a maintainer, I want no Scalar/OpenAPI adapter, so that MCP is represented according to its own concepts rather than forced into HTTP endpoint semantics.
44. As a maintainer, I want all configured servers treated as required, so that a failed server is visible during build rather than hidden in the UI.
45. As a Langfuse team member, I want the site to be open-source-ready, so that it can be shared and maintained publicly.
46. As a contributor, I want the generated JSON and Markdown artifact paths to be stable, so that external consumers can rely on them.
47. As a maintainer, I want root-level Markdown content negotiation without a runtime MCP fetch, so that agents can request the primary URL directly.
48. As a maintainer, I want the initial authenticated Cloud server to use documented Langfuse environment variables, so that Vercel setup is obvious.

## Implementation Decisions

- The app will be a standalone Next.js application deployed on Vercel.
- The app will target a standard Next.js deployment, not a pure static export, because root-level Markdown content negotiation needs middleware or equivalent request handling.
- The stack will use TypeScript, Tailwind CSS, shadcn/ui, React, and pnpm.
- At scaffold time, use the latest stable package versions. The versions verified during planning were Next.js 16.2.6, React 19.2.6, Tailwind CSS 4.3.0, and shadcn CLI 4.7.0.
- The repository will include a pnpm lockfile.
- The project will not use Scalar or an OpenAPI conversion layer.
- The UI will be custom-built around MCP concepts: servers, connection variants, tools, schemas, and JSON-RPC examples.
- A checked-in `mcp-reference.config.json` file will define the public server catalog.
- The initial catalog will include the authenticated Langfuse Cloud MCP server and the unauthenticated Langfuse Docs MCP server.
- The Langfuse Cloud server will be introspected from one canonical Cloud endpoint, while EU, US, Japan, HIPAA, self-hosted, and local development URLs are shown as connection variants.
- Authentication configuration will live per server, not globally.
- Basic Auth servers will specify the environment variable names for public and secret keys.
- The initial Langfuse Cloud MCP auth config will use `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`, and the build script will construct the Basic Auth header from those values.
- The build will fail if an authenticated server is missing required auth environment variables.
- The build will fail if any configured server cannot be initialized or introspected.
- All configured top-level servers are required; there will not be a non-required server mode in the initial PRD.
- Build-time MCP discovery will use initialization and capability-aware listing methods such as tools listing, resources listing, and prompts listing only when advertised by the server.
- The generator will only call discovery methods; it will not invoke tools.
- Tool examples will be generated from input schemas and will use placeholder values.
- The generated JSON snapshot will include server metadata, connection variants, discovery metadata, tools, input schemas, generated examples, and build metadata.
- The generated Markdown reference will introduce configured servers and list generated tool details from the JSON snapshot.
- Generated JSON and Markdown artifacts will live at `public/generated/mcp-reference.json` and `public/generated/mcp-reference.md`.
- `public/generated/` will be ignored by git.
- The generated artifacts will be created before the Next.js build so they are included in the Vercel deployment.
- The root page will render HTML by default.
- Content negotiation on `/` will return the generated Markdown representation when the request indicates a Markdown preference.
- `/generated/mcp-reference.json` will always return the generated JSON snapshot.
- `/generated/mcp-reference.md` will always return the generated Markdown artifact.
- The UI will include copy and download actions for the generated Markdown representation.
- The UI will use a server-first navigation model with tools nested below each server.
- The UI will include a right-side page outline where viewport space allows.
- The UI will include setup snippets derived from server configuration and encoded client patterns.
- Authenticated server snippets will render placeholders for credentials and never render real environment variable values.
- The Langfuse Docs MCP setup snippets will mirror the existing docs coverage for Cursor, VS Code Copilot, Claude Code, Windsurf, and generic clients.
- The Langfuse Cloud MCP setup snippets will mirror the existing docs coverage for Claude Code, Cursor, and generic clients.
- The visual design will copy only the minimum required Langfuse brand assets and design tokens into this repository.
- The copied assets will include the minimal logo, favicon/icon, font, pattern, and corner assets needed to match the new Langfuse docs aesthetic.
- The site will not import from or depend on the Langfuse docs repository at build time.
- The site will include a README covering purpose, local setup, configuration, generation, ignored artifacts, and Vercel deployment.
- The site will not show a prominent safety or write-capable-tools warning.

## Testing Decisions

- Tests should validate external behavior and stable contracts rather than implementation details.
- The configuration loader should be tested with valid configs, missing server fields, duplicate server IDs, unsupported auth types, and missing auth environment variables.
- The MCP discovery client should be tested with mocked MCP responses for initialization, tool listing, capability checks, HTTP errors, authentication errors, malformed JSON-RPC responses, and server-sent event payloads.
- The schema example generator should be tested with representative JSON Schema features, including strings, numbers, booleans, arrays, objects, enums, required fields, empty schemas, nested objects, and additional properties.
- The Markdown generator should be tested against generated reference data to ensure it includes server introductions, endpoint/auth information, variants, tool descriptions, schemas, and examples.
- The content negotiation layer should be tested to ensure HTML remains the default and Markdown is returned when requested via an appropriate Accept header.
- The UI should have focused component tests for server navigation, tool sections, schema rendering, setup snippets, and copy/download controls.
- Build verification should include a production build with generated artifacts present.
- Runtime verification should confirm that the built app serves `/generated/mcp-reference.json` and `/generated/mcp-reference.md`, performs root-level Markdown content negotiation, and does not call MCP servers after build.
- Browser verification should cover desktop and mobile layouts, light and dark themes, and basic navigation between server/tool sections.
- Prior art for tests is limited because the repository starts empty; tests should establish the project baseline rather than follow existing local patterns.

## Out of Scope

- Calling MCP tools during generation.
- Capturing example tool responses from live servers.
- Exposing project prompts or other authenticated project data in the public reference.
- Runtime calls from the website to any MCP server.
- Runtime use of build-time credentials.
- A live "try it" playground for MCP tools.
- User-provided API keys in the browser.
- A fake OpenAPI or Scalar representation of MCP tools.
- Automatically scraping Langfuse docs pages at build time for setup instructions.
- Multi-region introspection for equivalent Langfuse Cloud endpoints unless they are explicitly added as separate top-level configured servers.
- A non-Vercel pure static deployment target for root-level content negotiation.
- A prominent safety or write-tool warning callout.

## Further Notes

- The current workspace is an empty git repository with no GitHub remote configured.
- Because no remote is configured, this PRD cannot yet be submitted as a GitHub issue from this checkout.
- The initial public MCP endpoints discussed are the authenticated Langfuse Cloud MCP endpoint and the unauthenticated Langfuse Docs MCP endpoint.
- The initial config should list `https://cloud.langfuse.com/api/public/mcp` as the canonical authenticated Cloud endpoint and `https://langfuse.com/api/mcp` as the public Docs MCP endpoint.
- The Docs MCP server was verified to initialize without authentication and expose tools for semantic docs search, page fetching, and overview retrieval.
- The authenticated Cloud MCP endpoint requires project-scoped Basic Auth credentials.
- The build should be designed so that contributors can still run non-authenticated parts locally, but production generation should fail unless all required server credentials are configured.

## Annex: Concrete Snippets Discussed

These snippets capture concrete code/configuration that was discussed during planning. They are included as implementation guidance and should be adjusted only if later implementation work discovers a better concrete shape.

### Initial MCP Reference Config

```json
{
  "servers": [
    {
      "id": "langfuse-cloud",
      "name": "Langfuse Cloud MCP",
      "url": "https://cloud.langfuse.com/api/public/mcp",
      "auth": {
        "type": "basic",
        "publicKeyEnv": "LANGFUSE_PUBLIC_KEY",
        "secretKeyEnv": "LANGFUSE_SECRET_KEY"
      },
      "variants": [
        {
          "label": "Cloud EU",
          "url": "https://cloud.langfuse.com/api/public/mcp"
        },
        {
          "label": "Cloud US",
          "url": "https://us.cloud.langfuse.com/api/public/mcp"
        },
        {
          "label": "Cloud Japan",
          "url": "https://jp.cloud.langfuse.com/api/public/mcp"
        },
        {
          "label": "HIPAA US",
          "url": "https://hipaa.cloud.langfuse.com/api/public/mcp"
        },
        {
          "label": "Self-Hosted",
          "url": "https://your-domain.com/api/public/mcp"
        },
        {
          "label": "Local Development",
          "url": "http://localhost:3000/api/public/mcp"
        }
      ]
    },
    {
      "id": "langfuse-docs",
      "name": "Langfuse Docs MCP",
      "url": "https://langfuse.com/api/mcp",
      "auth": {
        "type": "none"
      }
    }
  ]
}
```

### Build Environment

```bash
LANGFUSE_PUBLIC_KEY=pk-lf-your-public-key
LANGFUSE_SECRET_KEY=sk-lf-your-secret-key
```

The build script constructs the authenticated MCP header from these values:

```text
Authorization: Basic base64(LANGFUSE_PUBLIC_KEY:LANGFUSE_SECRET_KEY)
```

### Generated Artifact Paths

```text
public/generated/mcp-reference.json
public/generated/mcp-reference.md
```

### Gitignore Entry

```gitignore
public/generated/
```

### Public Artifact URLs

```text
/generated/mcp-reference.json
/generated/mcp-reference.md
```

### Content Negotiation Contract

```text
GET / with Accept preferring text/markdown -> generated Markdown reference
GET / with normal browser Accept header -> interactive HTML reference
```
