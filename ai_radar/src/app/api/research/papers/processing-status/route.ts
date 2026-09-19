import { getPaperProcessingProgress } from "@/lib/local-db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ data: getPaperProcessingProgress() });
}
