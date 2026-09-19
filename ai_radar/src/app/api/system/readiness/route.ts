import { getLocalReadiness } from "@/lib/local-db";
import { NextResponse } from "next/server";
export function GET() { return NextResponse.json({ data: getLocalReadiness() }); }
