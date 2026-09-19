import { saveLocalSource } from "@/lib/local-db";
import { isSafeSourceUrl } from "@/lib/source-security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: { code: "INVALID_FILE", message: "OPML dosyası gerekli." } }, { status: 400 });
  const xml = await file.text();
  const sources = [...xml.matchAll(/<outline[^>]*xmlUrl=["']([^"']+)["'][^>]*>/gi)].map((match) => {
    const tag = match[0];
    const url = match[1].replaceAll("&amp;", "&");
    const name = tag.match(/(?:title|text)=["']([^"']+)["']/i)?.[1] ?? "RSS kaynağı";
    return { id: `local-${crypto.randomUUID()}`, name, type: "rss", url, status: "waiting", totalItems: 0, newItems: 0, checkIntervalMinutes: 120 };
  }).filter((source) => isSafeSourceUrl(source.type, source.url));
  sources.forEach((source) => saveLocalSource(source));
  return NextResponse.json({ data: sources, meta: { imported: sources.length } }, { status: 201 });
}
