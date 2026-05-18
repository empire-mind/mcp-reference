"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "./ui/button";

interface MarkdownActionsProps {
  markdown: string;
}

export function MarkdownActions({ markdown }: MarkdownActionsProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copyMarkdown() {
    const copied = await writeClipboard(markdown);
    setStatus(copied ? "copied" : "failed");
    window.setTimeout(() => setStatus("idle"), 1800);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={copyMarkdown} variant="primary">
        {status === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
        {status === "copied" ? "Copied" : status === "failed" ? "Copy Failed" : "Copy server docs"}
      </Button>
      <a
        className="inline-flex h-8 items-center justify-center gap-2 rounded-sm border border-zinc-300 bg-[#fbfbf8] px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900 md:hidden xl:inline-flex"
        href="/generated/mcp-reference.md"
        download
      >
        <Download className="size-4" />
        Download
      </a>
    </div>
  );
}

async function writeClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }
}
