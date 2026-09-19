import { deleteLocalSource, saveLocalSource } from "@/lib/local-db";
import { getSources } from "@/lib/services/source-service";
import { NextRequest, NextResponse } from "next/server";
import { isSafeSourceUrl } from "@/lib/source-security";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = (await getSources()).find((item) => item.id === id);
  if (!source) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Kaynak bulunamadı." } }, { status: 404 });
  const body = await request.json().catch(() => null) as { isActive?: unknown; checkIntervalMinutes?: unknown; name?: unknown; url?: unknown; type?: unknown; keywords?: unknown; lookbackDays?: unknown; maxResults?: unknown } | null;
  const isActive = typeof body?.isActive === "boolean" ? body.isActive : source.status !== "disabled" && source.status !== "paused";
  const requestedType = typeof body?.type === "string" && body.type.trim() ? body.type.trim() : source.type;
  const minimumInterval = requestedType.toLowerCase().includes("arxiv") ? 1440 : 5;
  const interval = typeof body?.checkIntervalMinutes === "number" && body.checkIntervalMinutes >= minimumInterval ? Math.round(body.checkIntervalMinutes) : Math.max(minimumInterval, source.checkIntervalMinutes);
  const requestedUrl = typeof body?.url === "string" ? body.url : source.url;
  if (requestedUrl && !isSafeSourceUrl(requestedType, requestedUrl)) return NextResponse.json({ error: { code: "UNSAFE_URL", message: "Kaynak adresi güvenli değil." } }, { status: 400 });
  const status = isActive ? (source.status === "disabled" || source.status === "paused" ? "waiting" : source.status) : "paused";
  const keywords = typeof body?.keywords === "string" ? body.keywords.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 12) : Array.isArray(body?.keywords) ? body.keywords.map(String).map((value) => value.trim()).filter(Boolean).slice(0, 12) : source.keywords;
  const lookbackDays = typeof body?.lookbackDays === "number" && [1, 3, 7, 14, 30, 90].includes(body.lookbackDays) ? body.lookbackDays : source.lookbackDays;
  const maxResults = typeof body?.maxResults === "number" && body.maxResults >= 5 && body.maxResults <= 1000 ? Math.round(body.maxResults) : source.maxResults;
  const next = { ...source, status, checkIntervalMinutes: interval, name: typeof body?.name === "string" && body.name.trim() ? body.name.trim() : source.name, url: requestedUrl, type: requestedType, keywords, lookbackDays, maxResults };
  return NextResponse.json({ data: saveLocalSource(next) });
}
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id.startsWith("builtin-")) return NextResponse.json({ error: { code: "BUILTIN_SOURCE", message: "Yerleşik kaynak silinemez; devre dışı bırakabilirsiniz." } }, { status: 409 });
  return deleteLocalSource(id) ? NextResponse.json({ data: { id } }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Kaynak bulunamadı." } }, { status: 404 });
}
