import type { Metadata } from "next";

import { ReferencePage } from "@/components/reference-page";
import { readGeneratedMarkdown, readGeneratedSnapshot } from "@/lib/snapshot";

export const dynamic = "force-static";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await readGeneratedSnapshot();
  return {
    title: snapshot.title,
    description: snapshot.description,
  };
}

export default async function Home() {
  const [snapshot, markdown] = await Promise.all([
    readGeneratedSnapshot(),
    readGeneratedMarkdown(),
  ]);

  return <ReferencePage markdown={markdown} snapshot={snapshot} />;
}
