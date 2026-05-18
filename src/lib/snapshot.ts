import { readFile } from "node:fs/promises";
import path from "node:path";

import type { GeneratedReference } from "./types";

const GENERATED_DIR = path.join(process.cwd(), "public", "generated");

export async function readGeneratedSnapshot(): Promise<GeneratedReference> {
  const file = path.join(GENERATED_DIR, "mcp-reference.json");
  return JSON.parse(await readFile(file, "utf8")) as GeneratedReference;
}

export async function readGeneratedMarkdown(): Promise<string> {
  return readFile(path.join(GENERATED_DIR, "mcp-reference.md"), "utf8");
}
