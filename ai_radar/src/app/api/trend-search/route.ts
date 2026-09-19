import { trendSearchSchema } from "@/lib/schemas";
import { searchTrends } from "@/lib/services/trend-search-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const parsed = trendSearchSchema.safeParse({
    query: request.nextUrl.searchParams.get("query"),
    source: request.nextUrl.searchParams.get("source") ?? "all",
    periodDays: request.nextUrl.searchParams.get("periodDays") ?? 7,
    limit: request.nextUrl.searchParams.get("limit") ?? 20
  });
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_SEARCH", message: parsed.error.issues[0]?.message ?? "Arama alanlarını kontrol edin." } }, { status: 400 });
  try {
    return NextResponse.json({ data: await searchTrends(parsed.data) });
  } catch (error) {
    return NextResponse.json({ error: { code: "TREND_SEARCH_FAILED", message: error instanceof Error ? error.message : "Trend araması başarısız." } }, { status: 502 });
  }
}
