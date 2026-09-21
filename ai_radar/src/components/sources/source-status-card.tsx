"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/formatters";
import type { SourceStatus } from "@/types";
import { Play, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";

const statusTone = { active: "success", waiting: "warning", running: "warning", degraded: "warning", error: "danger", paused: "subtle", disabled: "subtle" } as const;
type Run = { id: string; status: string; started_at: string; items_created: number; items_updated: number; error?: string };

export function SourceStatusCard({ source }: { source: SourceStatus }) {
  const [current, setCurrent] = useState(source);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [draft, setDraft] = useState({ name: source.name, url: source.url ?? "", type: source.type, checkIntervalMinutes: source.checkIntervalMinutes, keywords: source.keywords?.join(", ") ?? "", lookbackDays: source.lookbackDays ?? 7, maxResults: source.maxResults ?? 30 });
  const isTrendSource = current.type.toLowerCase().includes("arxiv") || current.type.toLowerCase().includes("github");

  async function run() {
    setRunning(true);
    try {
      const response = await fetch(`/api/sources/${current.id}/run`, { method: "POST" });
      const payload = await response.json();
      if (response.ok) setCurrent(payload.data);
      else setCurrent((value) => ({ ...value, status: "error", lastError: payload.error?.message ?? "Kaynak çalıştırılamadı." }));
    } finally { setRunning(false); }
  }

  async function toggleActive() {
    setSaving(true);
    try {
      const response = await fetch(`/api/sources/${current.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: ["disabled", "paused"].includes(current.status) }) });
      const payload = await response.json();
      if (response.ok) setCurrent(payload.data);
    } finally { setSaving(false); }
  }

  async function showSettings() {
    const response = await fetch(`/api/sources/${current.id}/runs`);
    const payload = await response.json();
    setRuns(payload.data ?? []);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/sources/${current.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const payload = await response.json();
      if (response.ok) { setCurrent(payload.data); setOpen(false); }
    } finally { setSaving(false); }
  }

  async function remove() {
    const response = await fetch(`/api/sources/${current.id}`, { method: "DELETE" });
    if (response.ok) { setDeleted(true); setOpen(false); }
  }

  if (deleted) return null;
  const label = current.status === "active" ? "Aktif" : current.status === "waiting" ? "Bekliyor" : current.status === "running" ? "Çalışıyor" : current.status === "degraded" ? "Kısıtlı" : current.status === "error" ? "Hata" : "Devre dışı";

  return <>
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <CardHeader className="space-y-2"><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><CardTitle className="editorial-title truncate">{current.name}</CardTitle><CardDescription className="truncate">{current.type}{current.keywords?.length ? ` · ${current.keywords.join(", ")}` : ""}</CardDescription></div><Badge tone={statusTone[current.status]} className="shrink-0">{label}</Badge></div></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Son kontrol</p><p className="font-medium">{formatDateTime(current.lastCheckedAt)}</p></div>
          <div className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Toplam içerik</p><p className="font-medium">{current.totalItems}</p></div>
          <div className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Trend penceresi</p><p className="font-medium">{current.lookbackDays ?? 7} gün</p></div>
          <div className="rounded-xl border bg-muted/30 p-3"><p className="text-xs text-muted-foreground">Kontrol sıklığı</p><p className="font-medium">{current.checkIntervalMinutes} dk</p></div>
        </div>
        {current.lastError ? <p className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-300">{current.lastError}</p> : null}
        <div className="flex flex-wrap gap-2"><Button size="sm" onClick={run} disabled={running || ["disabled", "paused", "running"].includes(current.status)}><Play className="h-4 w-4" />{running ? "Çalışıyor..." : "Çalıştır"}</Button><Button variant="outline" size="sm" onClick={toggleActive} disabled={saving}>{["disabled", "paused"].includes(current.status) ? "Aktifleştir" : "Durdur"}</Button><Button variant="ghost" size="sm" onClick={showSettings}><Settings2 className="h-4 w-4" />Ayarlar</Button></div>
      </CardContent>
    </Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{current.name} ayarları</DialogTitle></DialogHeader><div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
      <div className="space-y-2"><Label>Ad</Label><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
      <div className="space-y-2"><Label>Tür</Label><Input value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} /></div>
      <div className="space-y-2"><Label>URL</Label><Input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} /></div>
      {isTrendSource ? <>
        <div className="space-y-2"><Label>Anahtar kelimeler</Label><Input value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} placeholder="agents, RAG, multimodal" /><p className="text-xs text-muted-foreground">Virgülle ayırın. Zamanlanmış sorgular bu kelimelerle gönderilir.</p></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Trend penceresi</Label><Select value={draft.lookbackDays} onChange={(event) => setDraft({ ...draft, lookbackDays: Number(event.target.value) })}>{[1, 3, 7, 14, 30, 90].map((days) => <option key={days} value={days}>{days} gün</option>)}</Select></div><div className="space-y-2"><Label>Sonuç sayısı</Label><Input type="number" min={5} max={1000} value={draft.maxResults} onChange={(event) => setDraft({ ...draft, maxResults: Number(event.target.value) })} /></div></div>
      </> : null}
      <div className="space-y-2"><Label>Kontrol aralığı (dakika)</Label><Input type="number" min={current.type.toLowerCase().includes("arxiv") ? 1440 : 5} value={draft.checkIntervalMinutes} onChange={(event) => setDraft({ ...draft, checkIntervalMinutes: Number(event.target.value) })} />{current.type.toLowerCase().includes("arxiv") ? <p className="text-xs text-muted-foreground">arXiv yayın akışı günlük güncellendiği için en düşük güvenli aralık 1440 dakikadır.</p> : null}</div>
      <div className="flex gap-2"><Button onClick={save} disabled={saving}>Kaydet</Button>{!current.id.startsWith("builtin-") ? <Button variant="outline" onClick={remove}><Trash2 className="h-4 w-4" />Sil</Button> : null}</div>
      <div className="space-y-2"><p className="text-sm font-medium">Son çalışmalar</p>{runs.length ? runs.slice(0, 5).map((item) => <div key={item.id} className="rounded-xl border p-3 text-xs"><div className="flex justify-between"><span>{item.status}</span><span className="text-muted-foreground">{formatDateTime(item.started_at)}</span></div><p className="mt-1 text-muted-foreground">{item.items_created} yeni · {item.items_updated} güncel{item.error ? ` · ${item.error}` : ""}</p></div>) : <p className="text-sm text-muted-foreground">Henüz çalışma kaydı yok.</p>}</div>
    </div></DialogContent></Dialog>
  </>;
}
