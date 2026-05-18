import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { loadReferenceConfig } from "../src/lib/config";
import { discoverMcpServer } from "../src/lib/discovery-client";
import { loadDotEnv } from "../src/lib/env";
import { generateMarkdown } from "../src/lib/markdown";
import { buildSetupSnippets } from "../src/lib/setup-snippets";
import type { GeneratedReference, GeneratedServer, ServerConfig } from "../src/lib/types";

async function main() {
  loadDotEnv();

  const serverIds = parseServerIds(process.argv.slice(2));
  const configPath = path.join(process.cwd(), "mcp-reference.config.json");
  const config = await loadReferenceConfig(configPath, process.env, { serverIds });

  const servers: GeneratedServer[] = [];
  for (const server of config.servers) {
    console.log(`Discovering ${server.name} at ${server.url}`);
    const discovered = await discoverMcpServer(server, {
      headers: authHeaders(server),
    });

    servers.push({
      id: server.id,
      name: server.name,
      description: server.description,
      canonicalUrl: server.url,
      auth: server.auth,
      variants: server.variants,
      setupSnippets: buildSetupSnippets(server),
      ...discovered,
    });
  }

  const snapshot: GeneratedReference = {
    schemaVersion: "1.0",
    title: config.title,
    description: config.description,
    build: {
      generatedAt: new Date().toISOString(),
      generator: "scripts/generate-mcp-reference.ts",
      sourceConfig: "mcp-reference.config.json",
      serverCount: servers.length,
      toolCount: servers.reduce((total, server) => total + server.tools.length, 0),
    },
    servers,
  };

  const outputDir = path.join(process.cwd(), "public", "generated");
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "mcp-reference.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
  await writeFile(path.join(outputDir, "mcp-reference.md"), generateMarkdown(snapshot));

  console.log(
    `Generated ${snapshot.build.serverCount} servers and ${snapshot.build.toolCount} tools in public/generated/`,
  );
}

function parseServerIds(args: string[]): string[] | undefined {
  const serverIds: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--server") {
      const id = args[index + 1];
      if (!id) {
        throw new Error("--server requires a server id");
      }
      serverIds.push(id);
      index += 1;
    }
  }
  return serverIds.length > 0 ? serverIds : undefined;
}

function authHeaders(server: ServerConfig): Record<string, string> {
  if (server.auth.type === "none") {
    return {};
  }

  const publicKey = process.env[server.auth.publicKeyEnv];
  const secretKey = process.env[server.auth.secretKeyEnv];
  if (!publicKey || !secretKey) {
    throw new Error(`Missing credentials for ${server.id}`);
  }

  return {
    Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`,
  };
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
