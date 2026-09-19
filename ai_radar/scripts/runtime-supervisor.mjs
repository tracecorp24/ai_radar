import { closeSync, existsSync, mkdirSync, openSync, unlinkSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, ".data");
const runtimeFile = path.join(dataDir, "runtime.json");
const port = process.env.PORT ?? "3000";
const url = `http://127.0.0.1:${port}`;
mkdirSync(dataDir, { recursive: true });
const log = openSync(path.join(dataDir, "runtime.log"), "a");
let nextProcess;
let schedulerProcess;
let stopping = false;
let nextRestartTimer;
let schedulerRestartTimer;

function saveRuntime() {
  writeFileSync(runtimeFile, JSON.stringify({ supervisorPid: process.pid, nextPid: nextProcess?.pid, schedulerPid: schedulerProcess?.pid, root, port: Number(port), startedAt: new Date().toISOString() }, null, 2));
}
function stopChild(child) { if (child && !child.killed) child.kill("SIGTERM"); }
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  clearTimeout(nextRestartTimer);
  clearTimeout(schedulerRestartTimer);
  stopChild(schedulerProcess); stopChild(nextProcess);
  if (existsSync(runtimeFile)) unlinkSync(runtimeFile);
  closeSync(log);
  setTimeout(() => process.exit(code), 500).unref();
}
function restart(delay, start) { return setTimeout(() => { if (!stopping) start(); }, delay); }
function startNext() {
  nextProcess = spawn(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-H", "127.0.0.1", "-p", port], { cwd: root, env: { ...process.env, HOSTNAME: "127.0.0.1", PORT: port }, stdio: ["ignore", log, log], windowsHide: true });
  nextProcess.once("exit", () => { if (!stopping) { writeFileSync(log, `[Savvy runtime] Next.js stopped; retrying in 5 seconds.\n`); nextRestartTimer = restart(5000, startNext); } });
  saveRuntime();
}
function startScheduler() {
  schedulerProcess = spawn(process.execPath, [path.join(root, "scripts", "local-scheduler.mjs")], { cwd: root, env: { ...process.env, SAVVY_URL: url }, stdio: ["ignore", log, log], windowsHide: true });
  schedulerProcess.once("exit", () => { if (!stopping) { writeFileSync(log, `[Savvy runtime] Scheduler stopped; retrying in 5 seconds.\n`); schedulerRestartTimer = restart(5000, startScheduler); } });
  saveRuntime();
}
async function waitUntilReady() {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try { const response = await fetch(url, { signal: AbortSignal.timeout(1500) }); if (response.ok) return true; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

startNext();
if (!await waitUntilReady()) shutdown(1);
else {
  startScheduler();
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", () => shutdown(1));
