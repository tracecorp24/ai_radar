import { semanticPaperSearch } from "@/lib/services/semantic-research-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { query?: unknown; limit?: unknown } | null;
  if (typeof body?.query !== "string" || body.query.trim().length < 2 || body.query.length > 1_000) return NextResponse.json({ error: "2–1.000 karakter arasında bir semantik sorgu yazın." }, { status: 400 });
  try {
    return NextResponse.json(await semanticPaperSearch(body.query.trim(), Number(body.limit) || 24));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Semantik arama tamamlanamadı." }, { status: 502 });
  }
}
