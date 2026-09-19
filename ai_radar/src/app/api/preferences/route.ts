import { getPreference, setPreference } from "@/lib/local-db";
import { NextRequest, NextResponse } from "next/server";

const DEFAULTS = { language: "tr", view: "grid", notifications: true, interests: ["Agentic AI", "RAG", "MCP", "Multimodal", "Local LLM"] };

export function GET() {
  return NextResponse.json(getPreference("settings", DEFAULTS));
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Geçersiz ayar verisi." }, { status: 400 });
  return NextResponse.json(setPreference("settings", { ...DEFAULTS, ...body }));
}
