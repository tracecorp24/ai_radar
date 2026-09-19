import { arxivAdapter } from "@/lib/adapters/arxiv-adapter";
import { arxivQueryFromText, searchArxiv } from "@/lib/arxiv/client";
import { scorePapers } from "@/lib/arxiv/trend-scoring";
import { NextRequest, NextResponse } from "next/server";
import { upsertContent } from "@/lib/local-db";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const max = Number(request.nextUrl.searchParams.get("max") ?? 30);
    const papers = scorePapers((await searchArxiv({ query: arxivQueryFromText(query), max })).map(arxivAdapter.normalize));
    papers.forEach((paper) => upsertContent(paper));
    return NextResponse.json({ items: papers, query });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ArXiv araması başarısız." }, { status: 502 });
  }
}
