import type { Metadata } from "next";
import { cache } from "react";

import { ReferencePage } from "@/components/reference-page";
import { buildReferenceArtifacts } from "@/lib/reference-builder";

export const dynamic = "force-static";
export const revalidate = 3600;
export const runtime = "nodejs";

const getReferenceArtifacts = cache(buildReferenceArtifacts);

export async function generateMetadata(): Promise<Metadata> {
  const { snapshot } = await getReferenceArtifacts();
  return {
    title: snapshot.title,
    description: snapshot.description,
  };
}

export default async function Home() {
  const { snapshot, markdown } = await getReferenceArtifacts();

  return <ReferencePage markdown={markdown} snapshot={snapshot} />;
}
