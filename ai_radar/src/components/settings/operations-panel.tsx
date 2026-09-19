"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, Save, ServerCog } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Readiness = {
  databasePath?: string; databaseSizeBytes?: number; schemaVersion?: number; contentCount?: number; modelCount?: number; sourceCount?: number; lastBackup?: string | null;
  scheduler?: { healthy?: boolean; heartbeat_at?: string; pid?: number };
  lastRun?: { source_id?: string; status?: string; started_at?: string; duration_ms?: number; error?: string };
  migrations?: Array<{ version: number; applied_at: string }>;
  backups?: Array<{ name: string; sizeBytes: number; updatedAt: string }>;
  sourceHealth?: Array<{ id: string; name: string; type: string; status: string; freshness?: "fresh" | "stale"; last_successful_run_at?: string; last_error?: string; total_items: number; new_items: number }>;
};
const formatBytes = (bytes = 0) => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";

export function OperationsPanel() {
  const [data, setData] = useState<Readiness>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => { const response = await fetch("/api/system/readiness", { cache: "no-store" }); const payload = await response.json(); if (response.ok) setData(payload.data); }, []);
  useEffect(() => { refresh().catch(() => undefined); }, [refresh]);
  async function action(url: string, success: string) { setBusy(true); setMessage(""); try { const response = await fetch(url, { method: "POST" }); if (!response.ok) throw new Error("İşlem tamamlanamadı."); setMessage(success); await refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı."); } finally { setBusy(false); } }

  return <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle className="flex items-center gap-2 text-base"><ServerCog className="h-4 w-4" />Local operasyon ve readiness</CardTitle><p className="mt-1 text-sm text-muted-foreground">Veritabanı, scheduler, migration, yedek ve kaynak sağlığı tek yerden izlenir.</p></div><Button size="sm" variant="outline" onClick={() => refresh()} disabled={busy}><RefreshCw className="h-4 w-4" />Yenile</Button></CardHeader><CardContent className="space-y-5">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl border p-4"><Database className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">SQLite</p><p className="font-medium">{formatBytes(data.databaseSizeBytes)}</p><p className="truncate text-xs text-muted-foreground" title={data.databasePath}>{data.databasePath ?? "—"}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Şema</p><p className="font-medium">v{data.schemaVersion ?? "—"}</p><p className="text-xs text-muted-foreground">{data.migrations?.length ?? 0} migration kaydı</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Scheduler</p><p className="font-medium">{data.scheduler?.healthy ? "Sağlıklı" : "Heartbeat bekleniyor"}</p><p className="text-xs text-muted-foreground">{formatDate(data.scheduler?.heartbeat_at)}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Son ingest</p><p className="font-medium">{data.lastRun?.status ?? "—"}</p><p className="text-xs text-muted-foreground">{data.lastRun?.source_id ?? "Henüz çalışma yok"}</p></div></div>
    <div className="flex flex-wrap items-center gap-2"><Button size="sm" onClick={() => action("/api/system/backup", "Yeni SQLite yedeği oluşturuldu.")} disabled={busy}><Save className="h-4 w-4" />Şimdi yedekle</Button><Button size="sm" variant="outline" onClick={() => action("/api/scheduler/tick", "Scheduler taraması tamamlandı.")} disabled={busy}>Scheduler tick çalıştır</Button><span className="text-sm text-muted-foreground">Son yedek: {formatDate(data.lastBackup)}</span>{message ? <Badge tone="subtle">{message}</Badge> : null}</div>
    <div className="space-y-2"><p className="text-sm font-medium">Kaynak readiness</p>{data.sourceHealth?.length ? <div className="grid gap-2 md:grid-cols-2">{data.sourceHealth.map((source) => <div key={source.id} className="rounded-xl border p-3 text-sm"><div className="flex items-center justify-between gap-2"><span className="font-medium">{source.name}</span><Badge tone={source.status === "active" ? "success" : source.status === "error" ? "danger" : "subtle"}>{source.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{source.type} · {source.total_items} toplam · {source.new_items} yeni · {formatDate(source.last_successful_run_at)}</p>{source.last_error ? <p className="mt-1 text-xs text-destructive">{source.last_error}</p> : null}</div>)}</div> : <p className="text-sm text-muted-foreground">Henüz kaynak yok.</p>}</div>
    <div className="space-y-2"><p className="text-sm font-medium">Yedekler ({data.backups?.length ?? 0})</p><div className="flex flex-wrap gap-2">{data.backups?.slice(0, 7).map((backup) => <Badge key={backup.name} tone="subtle">{formatDate(backup.updatedAt)} · {formatBytes(backup.sizeBytes)}</Badge>)}</div></div>
  </CardContent></Card>;
}
