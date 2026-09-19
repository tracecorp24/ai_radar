import { runSourceIngestion } from "@/lib/ingestion/pipeline";
import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await runSourceIngestion(id);
    return NextResponse.json({ data: result.source, meta: { found: result.count, created: result.created, updated: result.updated } });
  } catch (error) {
    return NextResponse.json({ error: { code: "INGESTION_FAILED", message: error instanceof Error ? error.message : "Kaynak çalıştırılamadı." } }, { status: 502 });
  }
}
