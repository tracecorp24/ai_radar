"use client";

import { ContentCard } from "@/components/content/content-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ViewToggle, type ViewMode } from "@/components/shared/view-toggle";
import type { ContentItem, SemanticSearchResult } from "@/types";
import { BrainCircuit, RefreshCw, Search, Tags } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function ResearchExplorer({ items, initialTag = "" }: { items: ContentItem[]; initialTag?: string }) {
  const router = useRouter();
  const [currentItems, setCurrentItems] = useState(items);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [source, setSource] = useState<ContentItem["source"] | "all">("all");
  const [type, setType] = useState<ContentItem["type"] | "all">("all");
  const [tag, setTag] = useState(initialTag);
  const [mode, setMode] = useState<ViewMode>("grid");
  const [read, setRead] = useState<"all" | "read" | "unread">("all");
  const [bookmarked, setBookmarked] = useState<"all" | "yes" | "no">("all");
  const [trendPhase, setTrendPhase] = useState<ContentItem["trendPhase"] | "all">("all");
  const [visibleCount, setVisibleCount] = useState(24);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [semanticMeta, setSemanticMeta] = useState<Record<string, { similarity?: number; categories: string[] }>>({});
  const [semanticCategory, setSemanticCategory] = useState("all");

  const filtered = useMemo(
    () =>
      currentItems.filter((item) => {
        if (source !== "all" && item.source !== source) return false;
        if (type !== "all" && item.type !== type) return false;
        if (tag && !item.tags.some((value) => value.toLowerCase().includes(tag.toLowerCase()))) return false;
        if (read === "read" && !item.isRead) return false;
        if (read === "unread" && item.isRead) return false;
        if (bookmarked === "yes" && !item.isBookmarked) return false;
        if (bookmarked === "no" && item.isBookmarked) return false;
        if (trendPhase !== "all" && item.trendPhase !== trendPhase) return false;
        if (semanticCategory !== "all" && !semanticMeta[item.id]?.categories.includes(semanticCategory)) return false;
        return true;
      }),
    [bookmarked, currentItems, read, semanticCategory, semanticMeta, source, tag, trendPhase, type]
  );
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  useEffect(() => { setVisibleCount(24); setSelectedIndex(0); }, [bookmarked, read, source, tag, trendPhase, type]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input,textarea,select,button,[contenteditable=true]")) return;
      if (event.key === "j" || event.key === "ArrowDown") { event.preventDefault(); setSelectedIndex((value) => Math.max(0, Math.min(visible.length - 1, value + 1))); }
      if (event.key === "k" || event.key === "ArrowUp") { event.preventDefault(); setSelectedIndex((value) => Math.max(0, value - 1)); }
      if (event.key === "Enter" && visible[selectedIndex]) router.push(`/content/${visible[selectedIndex].id}`);
      if (event.key.toLowerCase() === "b" && visible[selectedIndex]) {
        const item=visible[selectedIndex];
        fetch(`/api/content/${item.id}/state`, { method:"PATCH",headers:{ "content-type":"application/json" },body:JSON.stringify({ isBookmarked:!item.isBookmarked }) });
        setCurrentItems((values) => values.map((entry) => entry.id === item.id ? { ...entry,isBookmarked:!entry.isBookmarked } : entry));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [router, selectedIndex, visible]);
  useEffect(() => { document.querySelector(`[data-research-index="${selectedIndex}"]`)?.scrollIntoView({ block:"nearest",behavior:"smooth" }); }, [selectedIndex]);

  async function runSearch() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/research/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "ArXiv araması başarısız.");
      setCurrentItems(data.items);
      setMessage(`${data.items.length} arXiv sonucu getirildi.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Arama başarısız."); }
    finally { setLoading(false); }
  }

  async function runSemanticSearch() {
    if (query.trim().length < 2) { setMessage("Semantik arama için en az 2 karakter yazın."); return; }
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/research/semantic-search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, limit: 48 }) });
      const data = await response.json() as { results?: SemanticSearchResult[]; indexed?: number; remaining?: number; model?: string; error?: string };
      if (!response.ok || !data.results) throw new Error(data.error ?? "Semantik arama tamamlanamadı.");
      setCurrentItems(data.results.map((result) => result.item));
      setSemanticMeta(Object.fromEntries(data.results.map((result) => [result.item.id, { similarity: result.similarity, categories: result.categories }])));
      setSemanticCategory("all");
      setMessage(`${data.results.length} semantik sonuç · ${data.indexed ?? 0} yeni makale vektörlendi · ${data.model}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Semantik arama tamamlanamadı."); }
    finally { setLoading(false); }
  }

  async function categorizeCatalog() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/research/semantic-index", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ limit: 100 }) });
      const data = await response.json() as { indexed?: number; total?: number; remaining?: number; categories?: Record<string, string[]>; model?: string; error?: string };
      if (!response.ok || !data.categories) throw new Error(data.error ?? "Katalog kategorize edilemedi.");
      setSemanticMeta((current) => ({ ...current, ...Object.fromEntries(Object.entries(data.categories!).map(([id, categories]) => [id, { ...current[id], categories }])) }));
      setMessage(`${data.indexed ?? 0} yeni makale kategorize edildi · toplam ${data.total ?? 0} · kalan ${data.remaining ?? 0}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Katalog kategorize edilemedi."); }
    finally { setLoading(false); }
  }

  async function syncResearch() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/research/sync", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Senkronizasyon başarısız.");
      setCurrentItems(data.items);
      setMessage(`${data.count} yeni/güncel makale işlendi.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Senkronizasyon başarısız."); }
    finally { setLoading(false); }
  }

  async function markVisibleRead() {
    const unread = visible.filter((item) => !item.isRead);
    if (!unread.length) return;
    setLoading(true);
    try {
      await Promise.all(unread.map((item) => fetch(`/api/content/${item.id}/state`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isRead: true }) })));
      const ids = new Set(unread.map((item) => item.id));
      setCurrentItems((values) => values.map((item) => ids.has(item.id) ? { ...item, isRead: true } : item));
      setMessage(`${unread.length} içerik okundu olarak işaretlendi.`);
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runSearch()} placeholder="arXiv'de ara: RAG, agents, multimodal..." />
          </div>
          <Button onClick={runSearch} disabled={loading}>arXiv ara</Button>
          <Button variant="secondary" onClick={runSemanticSearch} disabled={loading}><BrainCircuit className="h-4 w-4" /> Semantik ara</Button>
          <Button variant="outline" onClick={syncResearch} disabled={loading}><RefreshCw className="h-4 w-4" /> Güncelle</Button>
          <Button variant="outline" onClick={categorizeCatalog} disabled={loading}><Tags className="h-4 w-4" /> Kategorize et</Button>
        </CardContent>
        {message ? <CardContent className="pt-0 text-sm text-muted-foreground">{message}</CardContent> : null}
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <div className="space-y-2">
            <Label>Kaynak</Label>
            <Select value={source} onChange={(event) => setSource(event.target.value as ContentItem["source"] | "all")}>
              <option value="all">Tümü</option>
              <option value="arxiv">arXiv</option>
              <option value="huggingface">Hugging Face</option>
              <option value="ollama">Ollama</option>
              <option value="alphasignal">AlphaSignal</option>
              <option value="linkedin">LinkedIn</option>
              <option value="github">GitHub</option>
              <option value="rss">RSS</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={type} onChange={(event) => setType(event.target.value as ContentItem["type"] | "all")}>
              <option value="all">Tümü</option>
              <option value="paper">Paper</option>
              <option value="model">Model</option>
              <option value="article">Article</option>
              <option value="post">Post</option>
              <option value="release">Release</option>
              <option value="newsletter">Newsletter</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Etiket</Label>
            <Input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="RAG, MCP, Memory..." />
          </div>
          <div className="space-y-2">
            <Label>Okundu durumu</Label>
            <Select value={read} onChange={(event) => setRead(event.target.value as typeof read)}>
              <option value="all">Tümü</option>
              <option value="read">Okundu</option>
              <option value="unread">Okunmadı</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Favori</Label>
            <Select value={bookmarked} onChange={(event) => setBookmarked(event.target.value as typeof bookmarked)}>
              <option value="all">Tümü</option>
              <option value="yes">Evet</option>
              <option value="no">Hayır</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>AI kategorisi</Label>
            <Select value={semanticCategory} onChange={(event) => setSemanticCategory(event.target.value)}>
              <option value="all">Tümü</option>
              {[...new Set(Object.values(semanticMeta).flatMap((entry) => entry.categories))].sort().map((category) => <option key={category} value={category}>{category}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Trend durumu</Label>
            <Select value={trendPhase} onChange={(event) => setTrendPhase(event.target.value as typeof trendPhase)}>
              <option value="all">Tümü</option>
              <option value="hot">Hot · yükseliyor</option>
              <option value="trending">Trend · yerleşmiş</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge tone="subtle">{filtered.length} sonuç</Badge>
          <span>·</span>
          <span>Görünüm</span>
          <Button variant="ghost" size="sm" onClick={markVisibleRead} disabled={loading || !filtered.some((item) => !item.isRead)}>Görünenleri okundu yap</Button>
        </div>
        <ViewToggle value={mode} onChange={setMode} />
      </div>

      <div
        className={
          mode === "grid"
            ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            : mode === "list"
              ? "grid gap-4"
              : "grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        }
      >
        {visible.map((item,index) => (
          <div key={item.id} data-research-index={index} className={index === selectedIndex ? "rounded-2xl ring-2 ring-primary/40" : "rounded-2xl"}>{semanticMeta[item.id] ? <div className="mb-2 flex flex-wrap items-center gap-1.5">{semanticMeta[item.id].similarity !== undefined ? <Badge tone="success">Semantik %{Math.round(semanticMeta[item.id].similarity! * 100)}</Badge> : null}{semanticMeta[item.id].categories.map((category) => <Badge key={category} tone="subtle">{category}</Badge>)}</div> : null}<ContentCard content={item} variant={mode === "compact" ? "compact" : mode === "list" ? "list" : "default"} /></div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span>Kısayollar: J/K gezin · Enter aç · B kaydet</span>{visible.length < filtered.length ? <Button variant="outline" onClick={() => setVisibleCount((value) => value + 24)}>Daha fazla göster ({filtered.length-visible.length} kaldı)</Button> : null}</div>
    </div>
  );
}
