import { analyzeStoredTrends } from "@/lib/services/autonomous-trend-analysis-service";
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ data: analyzeStoredTrends(true) });
}
