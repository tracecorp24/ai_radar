import { getTrendData } from "@/lib/local-db";
import { analyzeStoredTrends } from "@/lib/services/autonomous-trend-analysis-service";
import { NextRequest, NextResponse } from "next/server";
export function GET(request: NextRequest) { const range = request.nextUrl.searchParams.get("range") ?? "14d"; const days = range === "7d" ? 7 : range === "30d" ? 30 : 14; const data = getTrendData(days); const analysis = analyzeStoredTrends(); return NextResponse.json({ data: { ...data, topics: analysis.topics }, meta: { range, analyzedAt: analysis.analyzedAt, analysisIntervalMinutes: 10 } }); }
