import { getSearchIndex } from "@/lib/services/search-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? 30), 50);
  const items = await getSearchIndex(query, limit);
  return NextResponse.json({ items });
}
