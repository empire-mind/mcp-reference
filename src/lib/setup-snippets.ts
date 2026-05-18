import type { ServerConfig, SetupSnippet } from "./types";

export function buildSetupSnippets(server: ServerConfig): SetupSnippet[] {
  if (server.auth.type === "basic") {
    return authenticatedSnippets(server);
  }
  return unauthenticatedSnippets(server);
}

function authenticatedSnippets(server: ServerConfig): SetupSnippet[] {
  const auth = server.auth;
  if (auth.type !== "basic") {
    return [];
  }

  const authPlaceholder = `Basic <base64(${auth.publicKeyEnv}:${auth.secretKeyEnv})>`;
  return [
    {
      id: `${server.id}-cursor`,
      client: "Cursor",
      title: "Cursor mcp.json",
      language: "json",
      code: stringify({
        mcpServers: {
          [server.id]: {
            url: server.url,
            headers: {
              Authorization: authPlaceholder,
            },
          },
        },
      }),
    },
    {
      id: `${server.id}-claude-code`,
      client: "Claude Code",
      title: "Claude Code CLI",
      language: "bash",
      code: [
        `export ${auth.publicKeyEnv}=pk-lf-your-public-key`,
        `export ${auth.secretKeyEnv}=sk-lf-your-secret-key`,
        `claude mcp add --transport http ${server.id} ${server.url} \\`,
        `  --header "Authorization: Basic $(printf '%s:%s' "$${auth.publicKeyEnv}" "$${auth.secretKeyEnv}" | base64)"`,
      ].join("\n"),
    },
    {
      id: `${server.id}-generic`,
      client: "Generic MCP client",
      title: "Streamable HTTP JSON",
      language: "json",
      code: stringify({
        servers: {
          [server.id]: {
            transport: {
              type: "streamable-http",
              url: server.url,
              headers: {
                Authorization: authPlaceholder,
              },
            },
          },
        },
      }),
    },
  ];
}

function unauthenticatedSnippets(server: ServerConfig): SetupSnippet[] {
  return [
    {
      id: `${server.id}-cursor`,
      client: "Cursor",
      title: "Cursor mcp.json",
      language: "json",
      code: stringify({
        mcpServers: {
          [server.id]: {
            url: server.url,
          },
        },
      }),
    },
    {
      id: `${server.id}-vscode`,
      client: "VS Code Copilot",
      title: "VS Code settings.json",
      language: "json",
      code: stringify({
        mcp: {
          servers: {
            [server.id]: {
              type: "http",
              url: server.url,
            },
          },
        },
      }),
    },
    {
      id: `${server.id}-claude-code`,
      client: "Claude Code",
      title: "Claude Code CLI",
      language: "bash",
      code: `claude mcp add --transport http ${server.id} ${server.url}`,
    },
    {
      id: `${server.id}-windsurf`,
      client: "Windsurf",
      title: "Proxy command",
      language: "json",
      code: stringify({
        mcpServers: {
          [server.id]: {
            command: "npx",
            args: ["mcp-remote", server.url],
          },
        },
      }),
    },
    {
      id: `${server.id}-generic`,
      client: "Generic MCP client",
      title: "Streamable HTTP JSON",
      language: "json",
      code: stringify({
        servers: {
          [server.id]: {
            transport: {
              type: "streamable-http",
              url: server.url,
            },
          },
        },
      }),
    },
  ];
}

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
