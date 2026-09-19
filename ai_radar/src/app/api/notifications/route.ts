import { deleteNotification, listNotifications, markNotificationsRead } from "@/lib/local-db";
import { NextRequest, NextResponse } from "next/server";
export function GET() { const data = listNotifications(); return NextResponse.json({ data, meta: { unread: data.filter((item) => !item.isRead).length } }); }
export async function PATCH(request: NextRequest) { const body = await request.json().catch(() => null) as { id?: unknown } | null; markNotificationsRead(typeof body?.id === "string" ? body.id : undefined); return NextResponse.json({ data: listNotifications() }); }
export function DELETE(request: NextRequest) { const id = request.nextUrl.searchParams.get("id"); if (!id) return NextResponse.json({ error: { code: "INVALID_NOTIFICATION", message: "Bildirim kimliği gerekli." } }, { status: 400 }); return deleteNotification(id) ? NextResponse.json({ data: { id } }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Bildirim bulunamadı." } }, { status: 404 }); }
