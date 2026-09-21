"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ContentItem } from "@/types";
import { ExternalLink, Search, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

type SearchPayload = { items: ContentItem[]; sources: Array<{ source: "arxiv" | "github"; total: number; error?: string }>; query: string; topics: string[]; periodDays: number };

const FRESHNESS_OPTIONS = [
  { days: 7, label: "Son 1 hafta" },
  { days: 30, label: "Son 1 ay" },
  { days: 90, label: "Son 3 ay" },
  { days: 365, label: "Son 1 yıl" }
];

function freshnessLabel(days: number) {
  return FRESHNESS_OPTIONS.find((option) => option.days === days)?.label ?? `Son ${days} gün`;
}

export function TrendSearchPanel() {
  const [query, setQuery] = useState("RAG, AI agents, MCP");
  const [source, setSource] = useState("all");
  const [periodDays, setPeriodDays] = useState(7);
  const [limit, setLimit] = useState(20);
  const [result, setResult] = useState<SearchPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ query, source, periodDays: String(periodDays), limit: String(limit) });
      const response = await fetch(`/api/trend-search?${params}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message ?? "Trend araması başarısız.");
      setResult(payload.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Trend araması başarısız.");
    } finally { setLoading(false); }
  }

  return <div className="space-y-4">
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5">
      <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Canlı GitHub + arXiv trend araması</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_160px_140px_100px_auto] lg:items-end" onSubmit={submit}>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1"><Label htmlFor="trend-query">Topic’ler</Label><Input id="trend-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="RAG, AI agents, multimodal" required minLength={2} /><p className="text-xs text-muted-foreground">En fazla 5 topic; virgülle ayırın.</p></div>
          <div className="space-y-2"><Label htmlFor="trend-source">Kaynak</Label><Select id="trend-source" value={source} onChange={(event) => setSource(event.target.value)}><option value="all">GitHub + arXiv</option><option value="arxiv">Yalnızca arXiv</option><option value="github">Yalnızca GitHub</option></Select></div>
          <div className="space-y-2"><Label htmlFor="trend-period">Trend dönemi</Label><Select id="trend-period" value={periodDays} onChange={(event) => setPeriodDays(Number(event.target.value))}>{FRESHNESS_OPTIONS.map((option) => <option key={option.days} value={option.days}>{option.label}</option>)}</Select></div>
          <div className="space-y-2"><Label htmlFor="trend-limit">Sonuç</Label><Select id="trend-limit" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>{[10, 20, 30, 50].map((count) => <option key={count} value={count}>{count}</option>)}</Select></div>
          <Button type="submit" disabled={loading || query.trim().length < 2} className="sm:col-span-2 lg:col-span-1"><Search className="h-4 w-4" />{loading ? "Taranıyor..." : "Trendleri bul"}</Button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">GitHub sonuçları yıldız hızı, fork, son push ve sorgu uyumuyla; arXiv sonuçları dönemsel tazelik, konu yoğunluğu ve sorgu uyumuyla sıralanır.</p>
      </CardContent>
    </Card>

    {error ? <p className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">{error}</p> : null}
    {result ? <>
      <div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-medium">{freshnessLabel(result.periodDays)}</span>{result.topics.map((topic) => <Badge key={topic}>{topic}</Badge>)}{result.sources.map((item) => <Badge key={item.source} tone={item.error ? "warning" : "subtle"}>{item.source === "arxiv" ? "arXiv" : "GitHub"}: {item.error ? item.error : `${item.total} eşleşme`}</Badge>)}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        {result.items.map((item, index) => <Card key={`${item.source}-${item.externalId}`} className="overflow-hidden"><CardContent className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><Badge tone={item.source === "arxiv" ? "default" : "subtle"}>{item.source === "arxiv" ? "arXiv" : "GitHub"}</Badge><span className="text-xs text-muted-foreground">#{index + 1}</span></div><div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{item.trendScore ?? 0}</div></div>
          <div><h3 className="font-semibold leading-snug">{item.title}</h3><p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.summary}</p></div>
          <div className="flex flex-wrap gap-1.5">{(item.matchedTopics?.length ? item.matchedTopics : item.tags.slice(0, 3)).map((topic) => <Badge key={topic} tone="subtle">{topic}</Badge>)}</div>
          <div className="flex flex-wrap gap-2">{item.trendReasons?.map((reason) => <span key={reason} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{reason}</span>)}</div>
          <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{new Date(item.publishedAt).toLocaleDateString("tr-TR")} · {item.authors.slice(0, 2).join(", ")}</span><Button asChild size="sm" variant="outline"><a href={item.url}>Aç<ExternalLink className="h-3.5 w-3.5" /></a></Button></div>
        </CardContent></Card>)}
      </div>
      {!result.items.length ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Bu konu ve zaman aralığında sonuç bulunamadı. Dönemi genişletmeyi deneyin.</p> : null}
    </> : null}
  </div>;
}
