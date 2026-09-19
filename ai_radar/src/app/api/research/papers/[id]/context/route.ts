import { getContentById } from "@/lib/services/content-service";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getContentById(id);
  const markdownPath = paper?.paperDocument?.markdownPath;
  if (!paper || !markdownPath || paper.paperDocument?.status !== "ready") return NextResponse.json({ error: "Önce makaleyi yerel Markdown olarak hazırlayın." }, { status: 404 });
  const papersDir = path.resolve(process.cwd(), ".data", "papers");
  if (!path.resolve(markdownPath).startsWith(`${papersDir}${path.sep}`)) return NextResponse.json({ error: "Geçersiz yerel Markdown yolu." }, { status: 400 });
  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 12000), 1000), 100000);
  try {
    const markdown = await readFile(markdownPath, "utf8");
    return NextResponse.json({ paperId: paper.id, markdown: markdown.slice(0, limit), truncated: markdown.length > limit, citationLocations: paper.paperDocument.citationLocations ?? [] });
  } catch { return NextResponse.json({ error: "Yerel Markdown dosyası okunamadı." }, { status: 404 }); }
}
