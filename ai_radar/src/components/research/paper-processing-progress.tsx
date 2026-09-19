"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, CircleAlert, Clock3, Download, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

type JobStatus = "queued" | "processing" | "ready" | "failed";
type ProgressData = { summary: Array<{ status: JobStatus; count: number }>; jobs: Array<{ paperId: string; title: string; status: JobStatus; attempts: number; createdAt: string; startedAt?: string; finishedAt?: string; error?: string }>; updatedAt: string };

const STATUS_META: Record<JobStatus, { label: string; tone: "default" | "subtle" | "success" | "warning" }> = {
  queued: { label: "Kuyrukta", tone: "subtle" },
  processing: { label: "İndiriliyor ve işleniyor", tone: "default" },
  ready: { label: "Hazır", tone: "success" },
  failed: { label: "Başarısız", tone: "warning" }
};

function countFor(data: ProgressData | null, status: JobStatus) {
  return data?.summary.find((item) => item.status === status)?.count ?? 0;
}

export function PaperProcessingProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/research/papers/processing-status", { cache: "no-store" });
        if (!response.ok) throw new Error("Durum alınamadı");
        const payload = await response.json() as { data: ProgressData };
        if (active) { setData(payload.data); setError(false); }
      } catch { if (active) setError(true); }
    }
    void load();
    const interval = window.setInterval(load, 8_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const queued = countFor(data, "queued");
  const processing = countFor(data, "processing");
  const ready = countFor(data, "ready");
  const failed = countFor(data, "failed");
  const total = queued + processing + ready + failed;
  const progress = total ? Math.round((ready / total) * 100) : 0;

  return <Card className="border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-card to-violet-500/5">
    <CardContent className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="flex items-center gap-2"><Download className="h-4 w-4 text-cyan-400" /><p className="font-semibold">Makale indirme ve işleme kuyruğu</p></div><p className="mt-1 text-sm text-muted-foreground">TeX öncelikli indirme ve yerel belge hazırlığı arka planda devam eder.</p></div>
        <span className="text-xs text-muted-foreground">{data ? `Son kontrol ${new Date(data.updatedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}` : "Bağlanıyor…"}</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <p className="rounded-lg border bg-background/60 p-2 text-sm"><Clock3 className="mr-1 inline h-3.5 w-3.5 text-muted-foreground" />{queued} kuyrukta</p>
        <p className="rounded-lg border bg-background/60 p-2 text-sm"><LoaderCircle className="mr-1 inline h-3.5 w-3.5 animate-spin text-primary" />{processing} işleniyor</p>
        <p className="rounded-lg border bg-background/60 p-2 text-sm"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-400" />{ready} hazır</p>
        <p className="rounded-lg border bg-background/60 p-2 text-sm"><CircleAlert className="mr-1 inline h-3.5 w-3.5 text-amber-400" />{failed} hata</p>
      </div>
      {error ? <p className="mt-3 text-sm text-amber-400">Kuyruk durumu şu anda okunamadı; biraz sonra otomatik yeniden denenecek.</p> : null}
      {data?.jobs.length ? <div className="mt-4 space-y-2">{data.jobs.map((job) => <div key={job.paperId} className="flex items-center justify-between gap-3 rounded-lg border bg-background/40 px-3 py-2 text-sm"><span className="min-w-0 truncate">{job.title}</span><Badge tone={STATUS_META[job.status].tone}>{STATUS_META[job.status].label}</Badge></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Henüz işleme kuyruğunda makale yok.</p>}
    </CardContent>
  </Card>;
}
