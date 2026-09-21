"use client";

import { SourceStatusCard } from "@/components/sources/source-status-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { sourceFormSchema, type SourceFormValues } from "@/lib/schemas";
import type { SourceStatus } from "@/types";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

const emptyForm: SourceFormValues = {
  name: "",
  type: "",
  url: "",
  checkIntervalMinutes: 60,
  tags: "",
  isActive: true
};

export function SourceManager({ sources }: { sources: SourceStatus[] }) {
  const [items, setItems] = useState(sources);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SourceFormValues>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const totalNew = useMemo(() => items.reduce((sum, item) => sum + item.newItems, 0), [items]);

  const submit = async () => {
    const parsed = sourceFormSchema.safeParse(form);
    if (!parsed.success) {
      setError("Form alanlarını kontrol edin.");
      return;
    }
    setError(null);
    const response = await fetch("/api/sources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(parsed.data) });
    const created = await response.json();
    if (!response.ok) { setError(created.error?.message ?? "Kaynak kaydedilemedi."); return; }
    setItems((current) => [created.data, ...current]);
    setOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Kaynak özeti</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{totalNew} yeni içerik</span>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Yeni kaynak ekle
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((source) => (
          <SourceStatusCard key={source.id} source={source} />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni kaynak ekle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Kaynak adı</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Kaynak türü</Label>
              <Input value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Kontrol sıklığı (dakika)</Label>
              <Input
                type="number"
                value={form.checkIntervalMinutes}
                onChange={(event) => setForm({ ...form, checkIntervalMinutes: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Etiketler</Label>
              <Textarea value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} />
            </div>
            <label className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
              Aktif
              <Switch checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            </label>
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
            <div className="flex gap-2">
              <Button onClick={submit}>Kaydet</Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
