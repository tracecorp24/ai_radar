import { getModelFavorite, setModelFavorite } from "@/lib/local-db";
import { NextRequest, NextResponse } from "next/server";

export function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => NextResponse.json({ isFavorite: getModelFavorite(id) }));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.isFavorite !== "boolean") return NextResponse.json({ error: "Geçerli favori durumu gerekli." }, { status: 400 });
  return NextResponse.json({ isFavorite: setModelFavorite(id, body.isFavorite) });
}
