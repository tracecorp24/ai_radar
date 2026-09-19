import { NextResponse } from "next/server";
import { getTrendAnalysisState } from "@/lib/services/autonomous-trend-analysis-service";
import { listContent } from "@/lib/local-db";

export async function GET() {
  const trendState = getTrendAnalysisState();
  const totalContent = listContent({ limit: 5000 });
  
  const now = Date.now();
  const last24hCutoff = now - 24 * 60 * 60 * 1000;
  const recentItems = totalContent.filter((item) => new Date(item.publishedAt).getTime() >= last24hCutoff);

  let backendDiagnostics = null;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${backendUrl}/api/v1/diagnostics`, { cache: "no-store" });
    if (res.ok) {
      backendDiagnostics = await res.json();
    }
  } catch (err) {
    backendDiagnostics = { error: `Backend diagnostics unreachable: ${err instanceof Error ? err.message : String(err)}` };
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    frontend: {
      total_content_items: totalContent.length,
      items_in_last_24h: recentItems.length,
      trend_topics_count: trendState?.topics?.length || 0,
      trend_last_analyzed: trendState?.analyzedAt || null,
      sources_distribution: trendState?.sources || null,
      window_days: trendState?.windowDays || 1
    },
    backend: backendDiagnostics
  });
}
