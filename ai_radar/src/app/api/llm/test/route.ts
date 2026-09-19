import { requestLlm } from "@/lib/llm/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { prompt?: unknown } | null;
  if (typeof body?.prompt !== "string" || body.prompt.trim().length < 2 || body.prompt.length > 4_000) {
    return NextResponse.json({ error: "2–4.000 karakter arasında bir deneme isteği yazın." }, { status: 400 });
  }
  try {
    const result = await requestLlm(body.prompt.trim(), {
      system: "Sen Savvy AI Radar içindeki Türkçe araştırma asistanısın. Kısa, doğru ve uygulanabilir yanıt ver.",
      maxTokens: 700
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "AI isteği tamamlanamadı." }, { status: 502 });
  }
}
