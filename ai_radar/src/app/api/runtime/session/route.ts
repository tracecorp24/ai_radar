import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const sessions = new Map<string, number>();
const SESSION_TTL_MS = 35_000;
const SHUTDOWN_DELAY_MS = 2_500;
let shutdownTimer: ReturnType<typeof setTimeout> | undefined;

function activeSessionCount() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, seenAt] of sessions) if (seenAt < cutoff) sessions.delete(id);
  return sessions.size;
}

function stopRuntimeIfIdle() {
  if (activeSessionCount()) return;
  const runtimeFile = path.join(process.cwd(), ".data", "runtime.json");
  if (!existsSync(runtimeFile)) return;
  try {
    const runtime = JSON.parse(readFileSync(runtimeFile, "utf8")) as { supervisorPid?: number };
    if (runtime.supervisorPid && runtime.supervisorPid !== process.pid) process.kill(runtime.supervisorPid, "SIGTERM");
  } catch { /* Runtime may already have stopped. */ }
}

function scheduleIdleCheck(delay = SESSION_TTL_MS + 500) {
  if (shutdownTimer) clearTimeout(shutdownTimer);
  shutdownTimer = setTimeout(stopRuntimeIfIdle, delay);
  shutdownTimer.unref();
}

async function payload(request: NextRequest) {
  try { return JSON.parse(await request.text()) as { id?: unknown; close?: unknown }; } catch { return {}; }
}

export async function POST(request: NextRequest) {
  const body = await payload(request);
  if (typeof body.id !== "string" || !/^[a-f0-9-]{20,}$/i.test(body.id)) return NextResponse.json({ error: "Geçersiz oturum." }, { status: 400 });
  if (body.close) { sessions.delete(body.id); scheduleIdleCheck(SHUTDOWN_DELAY_MS); }
  else { sessions.set(body.id, Date.now()); scheduleIdleCheck(); }
  return NextResponse.json({ activeSessions: activeSessionCount() });
}
