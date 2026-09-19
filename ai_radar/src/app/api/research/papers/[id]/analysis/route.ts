import { getContentById } from "@/lib/services/content-service";
import { analyzePaperCitations } from "@/lib/services/paper-citation-analysis-service";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getContentById(id);
  if (!paper) return NextResponse.json({ error: "Makale bulunamadı." }, { status: 404 });
  if (paper.type !== "paper") return NextResponse.json({ error: "Atıf ağacı yalnızca makaleler için oluşturulabilir." }, { status: 400 });
  try {
    const analysis = await analyzePaperCitations(paper, new URL(request.url).searchParams.get("refresh") === "1");
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Paper analysis failed", { paperId: id, error });
    return NextResponse.json({ error: "Makale analizi şu anda tamamlanamadı. AI bağlantısını ve sunucu günlüklerini kontrol edin." }, { status: 502 });
  }
}
