import { backupLocalDatabase, getLocalReadiness } from "@/lib/local-db";
import { NextResponse } from "next/server";

export function POST() {
  const createdAt = backupLocalDatabase(true, "manual");
  return NextResponse.json({ data: { createdAt, readiness: getLocalReadiness() } }, { status: 201 });
}
