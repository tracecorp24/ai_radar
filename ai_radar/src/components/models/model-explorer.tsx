"use client";

import { ModelCard } from "@/components/models/model-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ViewToggle, type ViewMode } from "@/components/shared/view-toggle";
import type { ModelItem } from "@/types";
import { useMemo, useState } from "react";

export function ModelExplorer({ models, initialCompareIds = [] }: { models: ModelItem[]; initialCompareIds?: string[] }) {
  const [source, setSource] = useState<ModelItem["source"] | "all">("all");
  const [pipeline, setPipeline] = useState("");
  const [organization, setOrganization] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<ViewMode>("grid");
  const [compareIds, setCompareIds] = useState<string[]>(initialCompareIds.filter((id) => models.some((model) => model.id === id)).slice(0, 3));

  const filtered = useMemo(
    () =>
      models.filter((item) => {
        if (source !== "all" && item.source !== source) return false;
        if (pipeline && !item.pipeline?.toLowerCase().includes(pipeline.toLowerCase())) return false;
        if (organization && !item.organization.toLowerCase().includes(organization.toLowerCase())) return false;
        if (query) {
          const haystack = [item.name, item.modelId, item.organization, item.description, ...(item.tags ?? [])].join(" ").toLowerCase();
          if (!haystack.includes(query.toLowerCase())) return false;
        }
        return true;
      }),
    [models, organization, pipeline, query, source]
  );

  const toggleCompare = (id: string) => {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Kaynak</Label>
            <Select value={source} onChange={(event) => setSource(event.target.value as ModelItem["source"] | "all")}>
              <option value="all">Tümü</option>
              <option value="huggingface">Hugging Face</option>
              <option value="ollama">Ollama</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Organizasyon</Label>
            <Input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Meta, Mistral..." />
          </div>
          <div className="space-y-2">
            <Label>Pipeline</Label>
            <Input value={pipeline} onChange={(event) => setPipeline(event.target.value)} placeholder="text-generation..." />
          </div>
          <div className="space-y-2">
            <Label>Ara</Label>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="model adı..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge tone="subtle">{filtered.length} model</Badge>
          <span>·</span>
          <span>{compareIds.length}/3 karşılaştırma</span>
        </div>
        <ViewToggle value={mode} onChange={setMode} />
      </div>

      {compareIds.length ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              {compareIds.map((id) => (
                <Badge key={id} tone="subtle">
                  {models.find((model) => model.id === id)?.name ?? id}
                </Badge>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCompareIds([])}>
              Karşılaştırmayı temizle
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {compareIds.length >= 2 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">Model karşılaştırması</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-3 pr-4 font-medium">Ölçüt</th>{compareIds.map((id) => <th key={id} className="px-3 py-3 font-medium">{models.find((model) => model.id === id)?.name ?? id}</th>)}</tr></thead>
              <tbody>{[
                ["Organizasyon", (model: ModelItem) => model.organization], ["Pipeline", (model: ModelItem) => model.pipeline ?? "—"], ["Parametre", (model: ModelItem) => model.parameterSize ?? "—"], ["Kontekst", (model: ModelItem) => model.contextLength ? `${model.contextLength.toLocaleString("tr-TR")} token` : "—"], ["Lisans", (model: ModelItem) => model.license ?? "—"], ["İndirme", (model: ModelItem) => model.downloads.toLocaleString("tr-TR")], ["Haftalık büyüme", (model: ModelItem) => `%${model.weeklyGrowth.toFixed(1)}`], ["Trend skoru", (model: ModelItem) => model.trendScore.toFixed(1)]
              ].map(([label, value]) => <tr key={String(label)} className="border-b border-border/60 last:border-0"><th className="py-3 pr-4 text-left font-medium text-muted-foreground">{String(label)}</th>{compareIds.map((id) => { const model = models.find((item) => item.id === id); return <td key={id} className="px-3 py-3">{model ? String((value as (item: ModelItem) => string)(model)) : "—"}</td>; })}</tr>)}</tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      <div
        className={
          mode === "grid"
            ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            : mode === "list"
              ? "grid gap-4"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        }
      >
        {filtered.map((model) => (
          <div key={model.id} className="space-y-3">
            <ModelCard model={model} />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={compareIds.includes(model.id)} onChange={() => toggleCompare(model.id)} />
              Karşılaştırmaya ekle
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
