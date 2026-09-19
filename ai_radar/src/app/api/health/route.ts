import { getLocalReadiness } from "@/lib/local-db";
import { NextResponse } from "next/server";
export function GET() { const readiness = getLocalReadiness(); return NextResponse.json({ status: "ok", storage: "sqlite-local", schemaVersion: readiness.schemaVersion, schedulerHealthy: readiness.scheduler.healthy, timestamp: new Date().toISOString() }); }
