import { buildReferenceArtifacts } from "@/lib/reference-builder";

export const dynamic = "force-static";
export const revalidate = 3600;
export const runtime = "nodejs";

export async function GET() {
  const { markdown } = await buildReferenceArtifacts();

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}
