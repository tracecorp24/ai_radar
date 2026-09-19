import { setItemState } from "@/lib/local-db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const patch = {
    ...(typeof body.isBookmarked === "boolean" ? { isBookmarked: body.isBookmarked } : {}),
    ...(typeof body.isRead === "boolean" ? { isRead: body.isRead } : {})
  };
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Geçerli bir durum değişikliği gerekli." }, { status: 400 });
  return NextResponse.json({ itemId: id, state: setItemState(id, patch) });
}
