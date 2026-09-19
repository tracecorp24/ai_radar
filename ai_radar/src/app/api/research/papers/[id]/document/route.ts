import { updateStoredPaper } from "@/lib/arxiv/repository";
import { getContentById } from "@/lib/services/content-service";
import { createPaperDocument } from "@/lib/services/paper-document-service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getContentById(id);
  if (!paper) return NextResponse.json({ error: "Makale bulunamadı." }, { status: 404 });
  return NextResponse.json({ document: paper.paperDocument });
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getContentById(id);
  if (!paper) return NextResponse.json({ error: "Makale bulunamadı." }, { status: 404 });
  if (paper.type !== "paper" || (!paper.arxiv?.texUrl && !paper.arxiv?.pdfUrl)) return NextResponse.json({ error: "Yerel belge işleme yalnızca kaynak dosyası veya PDF bağlantısı bulunan arXiv makaleleri için kullanılabilir." }, { status: 400 });
  try {
    const document = await createPaperDocument(paper);
    await updateStoredPaper(id, { paperDocument: document });
    return NextResponse.json({ document });
  } catch (error) {
    const document = { status: "failed" as const, parsedAt: new Date().toISOString(), error: error instanceof Error ? error.message : "Makale işlenemedi." };
    await updateStoredPaper(id, { paperDocument: document });
    return NextResponse.json({ error: document.error, document }, { status: 422 });
  }
}
