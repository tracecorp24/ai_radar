import { indexPaperCatalog } from "@/lib/services/semantic-research-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { limit?: unknown };
  try {
    return NextResponse.json(await indexPaperCatalog(Number(body.limit) || 60));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Semantik indeks oluşturulamadı." }, { status: 502 });
  }
}
