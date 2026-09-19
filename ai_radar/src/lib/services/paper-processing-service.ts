import { claimPaperDocumentJob, finishPaperDocumentJob } from "@/lib/local-db";
import { createPaperDocument } from "@/lib/services/paper-document-service";

export async function processQueuedPaperDocuments(limit = 1) {
  const results: Array<{ paperId: string; ok: boolean; sourceKind?: "tex" | "pdf"; error?: string }> = [];
  for (let index = 0; index < limit; index += 1) {
    const paper = claimPaperDocumentJob();
    if (!paper) break;
    try {
      const document = await createPaperDocument(paper);
      finishPaperDocumentJob(paper.id, document);
      results.push({ paperId: paper.id, ok: true, sourceKind: document.sourceKind });
    } catch (error) {
      const document = { status: "failed" as const, parsedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Makale işlenemedi." };
      finishPaperDocumentJob(paper.id, document);
      results.push({ paperId: paper.id, ok: false, error: document.error });
    }
  }
  return results;
}
