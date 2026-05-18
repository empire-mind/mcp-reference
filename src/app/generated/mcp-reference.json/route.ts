import { buildReferenceArtifacts } from "@/lib/reference-builder";

export const dynamic = "force-static";
export const revalidate = 3600;
export const runtime = "nodejs";

export async function GET() {
  const { snapshot } = await buildReferenceArtifacts();

  return new Response(`${JSON.stringify(snapshot, null, 2)}\n`, {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
