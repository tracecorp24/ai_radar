import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

const baseUrl = process.env.SAVVY_URL ?? "http://127.0.0.1:3000";
const intervalMs = Math.max(60_000, Number(process.env.SAVVY_SCHEDULER_INTERVAL_MS ?? 60_000));
const dataDir = path.join(process.cwd(), ".data");
const lockFile = path.join(dataDir, "scheduler.lock");
mkdirSync(dataDir, { recursive: true });

if (existsSync(lockFile)) {
  const existingPid = Number(readFileSync(lockFile, "utf8"));
  try { if (existingPid > 0) { process.kill(existingPid, 0); process.stdout.write(`[Savvy scheduler] already running with PID ${existingPid}\n`); process.exit(0); } }
  catch { unlinkSync(lockFile); }
}
writeFileSync(lockFile, String(process.pid));
function cleanup() { try { if (existsSync(lockFile) && Number(readFileSync(lockFile, "utf8")) === process.pid) unlinkSync(lockFile); } catch {} }
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(0); });
process.on("SIGTERM", () => { cleanup(); process.exit(0); });

async function tick() {
  if (tick.running) return;
  tick.running = true;
  try {
    const response = await fetch(`${baseUrl}/api/scheduler/tick`, { method: "POST", headers: { "x-savvy-scheduler-pid": String(process.pid) }, signal: AbortSignal.timeout(120_000) });
    if (!response.ok) process.stderr.write(`[Savvy scheduler] HTTP ${response.status}\n`);
  } catch (error) { process.stderr.write(`[Savvy scheduler] ${error instanceof Error ? error.message : String(error)}\n`); }
  finally { tick.running = false; }
}
await tick();
setInterval(tick, intervalMs);
