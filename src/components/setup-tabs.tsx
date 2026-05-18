"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import type { SetupSnippet } from "@/lib/types";

export function SetupTabs({ snippets }: { snippets: SetupSnippet[] }) {
  const [activeId, setActiveId] = useState(snippets[0]?.id ?? "");
  const [copiedId, setCopiedId] = useState<string | undefined>();
  const activeSnippet = snippets.find((snippet) => snippet.id === activeId) ?? snippets[0];

  if (!activeSnippet) {
    return null;
  }

  async function copyActiveSnippet() {
    await navigator.clipboard.writeText(activeSnippet.code);
    setCopiedId(activeSnippet.id);
    window.setTimeout(() => setCopiedId(undefined), 1400);
  }

  return (
    <div className="overflow-hidden border border-zinc-200 bg-[#fbfbf8] dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-[#f7f7f4] px-3 py-2 dark:border-zinc-800 dark:bg-[#080808]">
        <div
          aria-label="Client setup options"
          className="flex w-full gap-1 overflow-x-auto"
          role="tablist"
        >
          {snippets.map((snippet) => {
            const active = snippet.id === activeSnippet.id;
            return (
              <button
                aria-selected={active}
                className={`h-8 shrink-0 rounded-sm border px-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-zinc-300 bg-zinc-200/70 text-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    : "border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                }`}
                key={snippet.id}
                onClick={() => setActiveId(snippet.id)}
                role="tab"
                type="button"
              >
                {snippet.client}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0" role="tabpanel">
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-zinc-100">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{activeSnippet.title}</p>
            <p className="text-xs uppercase text-zinc-500">{activeSnippet.language}</p>
          </div>
          <button
            aria-label={`Copy ${activeSnippet.client} setup`}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
            onClick={copyActiveSnippet}
            type="button"
          >
            {copiedId === activeSnippet.id ? <Check className="size-4" /> : <Copy className="size-4" />}
          </button>
        </div>
        <pre className="max-h-[360px] overflow-auto bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">
          <code>{activeSnippet.code}</code>
        </pre>
      </div>
    </div>
  );
}
