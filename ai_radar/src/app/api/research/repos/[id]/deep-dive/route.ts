import { updateStoredPaper } from "@/lib/arxiv/repository";
import { getContentById } from "@/lib/services/content-service";
import { createGithubDeepDive } from "@/lib/services/github-deep-dive-service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getContentById(id);
  if (!item) return NextResponse.json({ error: "İçerik bulunamadı." }, { status: 404 });
  try {
    const repositoryDocument = await createGithubDeepDive(item);
    await updateStoredPaper(id, { repositoryDocument });
    return NextResponse.json({ repositoryDocument });
  } catch (error) {
    const repositoryDocument = { status: "failed" as const, parsedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "GitHub Deep Dive oluşturulamadı." };
    await updateStoredPaper(id, { repositoryDocument });
    return NextResponse.json({ error: repositoryDocument.error, repositoryDocument }, { status: 422 });
  }
}
