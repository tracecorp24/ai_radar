import { runSourceIngestion } from "@/lib/ingestion/pipeline";
import { backupLocalDatabase, recoverStalledPaperDocumentJobs, setSchedulerHeartbeat } from "@/lib/local-db";
import { getSources } from "@/lib/services/source-service";
import { analyzeStoredTrends } from "@/lib/services/autonomous-trend-analysis-service";
import { processQueuedPaperDocuments } from "@/lib/services/paper-processing-service";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const schedulerPid = Number(request.headers.get("x-savvy-scheduler-pid"));
  setSchedulerHeartbeat(Number.isInteger(schedulerPid) && schedulerPid > 0 ? schedulerPid : undefined);
  backupLocalDatabase();
  const recoveredDocuments = recoverStalledPaperDocumentJobs();
  const now = Date.now();
  const sources = (await getSources()).filter((source) => !["disabled", "paused", "running"].includes(source.status) && (!source.lastCheckedAt || now - new Date(source.lastCheckedAt).getTime() >= source.checkIntervalMinutes * 60000));
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const source of sources) {
    try { await runSourceIngestion(source.id); results.push({ id: source.id, ok: true }); }
    catch (error) { results.push({ id: source.id, ok: false, error: error instanceof Error ? error.message : "Bilinmeyen hata" }); }
  }
  const analysis = analyzeStoredTrends();
  const documents = await processQueuedPaperDocuments(1);
  return NextResponse.json({ data: results, meta: { checked: sources.length, analyzedAt: analysis.analyzedAt, analysisIntervalMinutes: 10, recoveredDocuments, documents } });
}
