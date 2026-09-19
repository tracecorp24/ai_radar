import { runArxivSync } from "@/lib/arxiv/ingestion";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json(await runArxivSync());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ArXiv senkronizasyonu başarısız." }, { status: 502 });
  }
}
