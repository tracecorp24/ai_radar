import { saveLocalSource } from "@/lib/local-db";
import { sourceFormSchema } from "@/lib/schemas";
import { getSources } from "@/lib/services/source-service";
import { NextRequest, NextResponse } from "next/server";
import { isSafeSourceUrl } from "@/lib/source-security";

export async function GET() { return NextResponse.json({ data: await getSources() }); }
export async function POST(request: NextRequest) {
  const parsed = sourceFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: { code: "INVALID_SOURCE", message: "Kaynak alanlarını kontrol edin." } }, { status: 400 });
  if (!isSafeSourceUrl(parsed.data.type, parsed.data.url)) return NextResponse.json({ error: { code: "UNSAFE_URL", message: "Yalnızca güvenli HTTP(S) adresleri kabul edilir; local adresler için tür adında 'local' kullanın." } }, { status: 400 });
  const source = { id: `local-${crypto.randomUUID()}`, name: parsed.data.name, type: parsed.data.type, url: parsed.data.url, status: parsed.data.isActive ? "waiting" : "disabled", totalItems: 0, newItems: 0, checkIntervalMinutes: parsed.data.checkIntervalMinutes };
  return NextResponse.json({ data: saveLocalSource(source) }, { status: 201 });
}
