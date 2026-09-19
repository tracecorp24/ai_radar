import { addCollectionItem, removeCollectionItem } from "@/lib/local-db";
import { NextResponse } from "next/server";
type Context = { params: Promise<{ id: string; contentId: string }> };
export async function POST(_request: Request, { params }: Context) { const { id, contentId } = await params; addCollectionItem(id, contentId); return NextResponse.json({ data: { collectionId: id, contentId } }); }
export async function DELETE(_request: Request, { params }: Context) { const { id, contentId } = await params; removeCollectionItem(id, contentId); return NextResponse.json({ data: { collectionId: id, contentId } }); }
