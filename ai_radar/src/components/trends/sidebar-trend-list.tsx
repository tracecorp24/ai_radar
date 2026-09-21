"use client";

import { SourceBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import type { ContentItem, PaperCitationAnalysis, PaperLinkedResource } from "@/types";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Github,
  Library,
  LoaderCircle,
  Paperclip,
  Search,
  SlidersHorizontal
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PaperProcessingProgress } from "@/components/research/paper-processing-progress";

type TrendSource = "github" | "arxiv" | "huggingface";
type SortKey = "trend" | "relevance" | "novelty" | "freshness" | "momentum" | "originality" | "depth" | "newest" | "starsPerDay" | "stars" | "forks";
type PaperScoreKey = "freshness" | "momentum" | "originality" | "depth";
type PaperScores = Record<PaperScoreKey, number>;
type PaperScoreContext = { frequencies: Map<string, number>; maxFrequency: number };

const PAPER_SCORE_LABELS: Record<PaperScoreKey, string> = {
  freshness: "Güncellik",
  momentum: "Konu ivmesi",
  originality: "Özgünlük",
  depth: "Kapsam"
};

function clampScore(value: number) {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function paperSignals(item: ContentItem) {
  return [...new Set([
    ...(item.matchedTopics?.length ? item.matchedTopics : item.tags),
    ...(item.arxiv?.categories ?? [])
  ].map((value) => value.trim().toLocaleLowerCase("tr")).filter(Boolean))];
}

function paperScoreContext(items: ContentItem[]): PaperScoreContext {
  const frequencies = new Map<string, number>();
  items.forEach((item) => paperSignals(item).forEach((signal) => frequencies.set(signal, (frequencies.get(signal) ?? 0) + 1)));
  return { frequencies, maxFrequency: Math.max(1, ...frequencies.values()) };
}

function paperScores(item: ContentItem, context: PaperScoreContext): PaperScores {
  const ageDays = Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 86_400_000);
  const freshness = clampScore(100 - ageDays / 14 * 100);
  const signals = paperSignals(item);
  const normalizedFrequencies = signals.map((signal) => (context.frequencies.get(signal) ?? 1) / context.maxFrequency);
  const averageFrequency = normalizedFrequencies.length ? normalizedFrequencies.reduce((sum, value) => sum + value, 0) / normalizedFrequencies.length : 0;
  const momentum = clampScore(25 + averageFrequency * 75);
  const rarity = normalizedFrequencies.length ? normalizedFrequencies.reduce((sum, value) => sum + (1 - value), 0) / normalizedFrequencies.length : 0;
  const categoryBreadth = Math.min(1, (item.arxiv?.categories.length ?? item.tags.length) / 4);
  const originality = clampScore(25 + rarity * 60 + categoryBreadth * 15);
  const wordCount = item.summary.trim().split(/\s+/).filter(Boolean).length;
  const abstractCoverage = Math.min(1, wordCount / 300);
  const authorBreadth = Math.min(1, item.authors.length / 6);
  const depth = clampScore(abstractCoverage * 60 + authorBreadth * 20 + categoryBreadth * 20);
  return { freshness, momentum, originality, depth };
}

function trendScore(item: ContentItem) {
  return item.trendScore ?? Math.round((item.relevanceScore + item.noveltyScore) / 2);
}

function sortValue(item: ContentItem, sort: SortKey, scores?: PaperScores) {
  if (sort === "freshness" || sort === "momentum" || sort === "originality" || sort === "depth") return scores?.[sort] ?? 0;
  if (sort === "relevance") return item.relevanceScore;
  if (sort === "novelty") return item.noveltyScore;
  if (sort === "newest") return new Date(item.publishedAt).getTime();
  if (sort === "starsPerDay") return item.github?.starsPerDay ?? 0;
  if (sort === "stars") return item.github?.stars ?? 0;
  if (sort === "forks") return item.github?.forks ?? 0;
  return trendScore(item);
}

function Score({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5">
      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </span>
  );
}

function TrendDetail({ item }: { item: ContentItem }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-muted/60"
        >
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-sm font-medium leading-5 group-hover:text-primary">
              {item.title}
            </span>
            <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{trendScore(item)} puan</span>
              <span>·</span>
              <span>{formatDateTime(item.publishedAt)}</span>
            </span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SourceBadge source={item.source} />
            <Badge tone="subtle">{item.type}</Badge>
            <Badge>{trendScore(item)} / 100</Badge>
          </div>
          <DialogTitle className="pr-8 leading-7">{item.title}</DialogTitle>
          <DialogDescription className="leading-6">{item.summary}</DialogDescription>
        </DialogHeader>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          {item.github ? (
            <>
              <Score label="Yıldız" value={formatNumber(item.github.stars)} />
              <Score label="Yıldız / gün" value={item.github.starsPerDay.toFixed(1)} />
              <Score label="Fork" value={formatNumber(item.github.forks)} />
              <Score label="Açık konu" value={formatNumber(item.github.openIssues)} />
            </>
          ) : (
            <>
              <Score label="Yazar" value={item.authors.length} />
              <Score label="Kategori" value={item.arxiv?.categories[0] ?? item.tags[0] ?? "—"} />
              <Score label="Önem" value={item.relevanceScore} />
              <Score label="Yenilik" value={item.noveltyScore} />
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {(item.matchedTopics?.length ? item.matchedTopics : item.tags)
            .slice(0, 6)
            .map((topic) => (
              <Badge key={topic} tone="subtle">
                {topic}
              </Badge>
            ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
          <Button asChild variant="outline">
            <a href={item.url} target="_blank" rel="noreferrer">
              Orijinal kaynak
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild>
            <Link href={`/content/${item.id}`}>
              Detaylı incele
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResourceLinks({
  resources,
  emptyText
}: {
  resources: PaperLinkedResource[];
  emptyText: string;
}) {
  return resources.length ? (
    <div className="space-y-2">
      {resources.map((resource, index) => (
        <a
          key={`${resource.title}-${index}`}
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-2 rounded-xl border border-border/70 bg-background/50 p-3 text-xs transition hover:border-primary/30 hover:bg-primary/5"
        >
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 font-medium leading-5 group-hover:text-primary">
              {resource.title}
            </span>
            {resource.detail ? (
              <span className="mt-1 block text-muted-foreground">{resource.detail}</span>
            ) : null}
          </span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </a>
      ))}
    </div>
  ) : (
    <p className="rounded-xl border border-dashed p-3 text-xs leading-5 text-muted-foreground">
      {emptyText}
    </p>
  );
}

function PaperRowDetails({ item, candidates }: { item: ContentItem; candidates: ContentItem[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PaperCitationAnalysis>();
  const [error, setError] = useState("");

  const related = useMemo(() => {
    if (!open) return [];
    const itemTopics = new Set(
      [...(item.matchedTopics ?? []), ...item.tags].map((value) => value.toLocaleLowerCase("tr"))
    );
    return candidates
      .filter((candidate) => candidate.id !== item.id && candidate.source === "arxiv")
      .map((candidate) => ({
        item: candidate,
        overlap: [...(candidate.matchedTopics ?? []), ...candidate.tags].filter((value) =>
          itemTopics.has(value.toLocaleLowerCase("tr"))
        ).length
      }))
      .filter((candidate) => candidate.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || trendScore(b.item) - trendScore(a.item))
      .slice(0, 4)
      .map(({ item: relatedItem }) => relatedItem);
  }, [candidates, item, open]);

  async function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen || analysis || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/research/papers/${encodeURIComponent(item.id)}/analysis`);
      const payload = (await response.json()) as {
        analysis?: PaperCitationAnalysis;
        error?: string;
      };
      if (!response.ok || !payload.analysis)
        throw new Error(payload.error ?? "Makale bağlantıları alınamadı.");
      setAnalysis(payload.analysis);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Makale bağlantıları alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  const citationResources: PaperLinkedResource[] = (analysis?.citations ?? []).map((citation) => ({
    title: citation.title,
    url:
      citation.url ??
      `https://www.semanticscholar.org/search?q=${encodeURIComponent(citation.title)}`,
    detail:
      [citation.authors.slice(0, 2).join(", "), citation.year].filter(Boolean).join(" · ") ||
      citation.citationReason
  }));
  const appendixFallback = item.paperDocument?.appendixCount
    ? [
        {
          title: `${item.paperDocument.appendixCount} appendix/ek bölümü`,
          url: item.arxiv?.pdfUrl ?? item.url,
          detail: "PDF içinde aç"
        }
      ]
    : [];
  const appendices = analysis?.appendices?.length ? analysis.appendices : appendixFallback;

  return (
    <div className="mt-3 border-t border-border/70 pt-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-between text-xs"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          Makale detayları, bağlantılar ve kaynakça
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {open ? (
        <div className="mt-3 space-y-4 rounded-xl bg-muted/20 p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Yazarlar</p>
              <p className="mt-1 text-sm">{item.authors.join(", ") || "Belirtilmemiş"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Yayın ve kategori</p>
              <p className="mt-1 text-sm">
                {formatDateTime(item.publishedAt)} ·{" "}
                {item.arxiv?.categories.join(", ") || item.tags[0] || "—"}
              </p>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {item.originalContent ?? item.summary}
          </p>
          <div className="flex flex-wrap gap-2">
            {item.trendReasons?.map((reason) => (
              <Badge key={reason} tone="subtle">
                {reason}
              </Badge>
            ))}
          </div>

          {loading ? (
            <p className="flex items-center gap-2 rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Kaynakça ve appendix bilgileri hazırlanıyor…
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-primary" />
                Bağlantılı makaleler
              </h4>
              <div className="space-y-2">
                {related.map((relatedItem) => (
                  <Link
                    key={relatedItem.id}
                    href={`/content/${relatedItem.id}`}
                    className="group flex items-start gap-2 rounded-xl border border-border/70 bg-background/50 p-3 text-xs transition hover:border-primary/30"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-medium leading-5 group-hover:text-primary">
                        {relatedItem.title}
                      </span>
                      <span className="mt-1 block text-muted-foreground">
                        {trendScore(relatedItem)} trend puanı
                      </span>
                    </span>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  </Link>
                ))}
                <ResourceLinks
                  resources={citationResources}
                  emptyText={
                    related.length
                      ? "Atıf ağından ek makale bulunamadı."
                      : "Bağlantılı makale bulunamadı."
                  }
                />
              </div>
            </section>
            <section className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Library className="h-4 w-4 text-primary" />
                Kaynakça
              </h4>
              <ResourceLinks
                resources={analysis?.bibliography ?? []}
                emptyText={
                  loading ? "Kaynakça aranıyor…" : "Erişilebilir kaynakça kaydı bulunamadı."
                }
              />
            </section>
            <section className="space-y-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                <Paperclip className="h-4 w-4 text-primary" />
                Appendix / Ekler
              </h4>
              <ResourceLinks
                resources={appendices}
                emptyText={
                  item.paperDocument?.status === "ready"
                    ? "PDF içinde appendix bölümü bulunamadı."
                    : "Appendix taraması için önce makalenin derin incelemesini çalıştırın."
                }
              />
              {item.paperDocument?.status !== "ready" ? (
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link href={`/content/${item.id}?deepDive=1`}>
                    Derin incelemeyi aç
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
            </section>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button asChild size="sm" variant="outline">
              <a href={item.arxiv?.pdfUrl ?? item.url} target="_blank" rel="noreferrer">
                PDF’i aç
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
            <Button asChild size="sm">
              <Link href={`/content/${item.id}`}>
                Tam detay
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AllTrendsDialog({
  source,
  items,
  title,
  icon
}: {
  source: TrendSource;
  items: ContentItem[];
  title: string;
  icon: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("trend");
  const [minimumScore, setMinimumScore] = useState("all");
  const [topic, setTopic] = useState("all");
  const [timeRange, setTimeRange] = useState<"180d" | "365d" | "all">("180d");

  const topics = useMemo(
    () =>
      [
        ...new Set(
          items.flatMap((item) => (item.matchedTopics?.length ? item.matchedTopics : item.tags))
        )
      ].sort((a, b) => a.localeCompare(b, "tr")),
    [items]
  );
  const scoreContext = useMemo(() => paperScoreContext(items), [items]);
  const paperScoresById = useMemo(() => new Map(items.map((item) => [item.id, paperScores(item, scoreContext)])), [items, scoreContext]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr");
    const cutoff = timeRange === "180d" ? Date.now() - 180 * 86_400_000 : timeRange === "365d" ? Date.now() - 365 * 86_400_000 : 0;
    return items
      .filter((item) => {
        if (!cutoff) return true;
        const createdAt = item.github?.createdAt ? new Date(item.github.createdAt).getTime() : 0;
        const effectiveDate = createdAt > 0 ? createdAt : new Date(item.publishedAt).getTime();
        return effectiveDate >= cutoff;
      })
      .filter(
        (item) =>
          !normalizedQuery ||
          `${item.title} ${item.summary} ${item.authors.join(" ")} ${item.tags.join(" ")}`
            .toLocaleLowerCase("tr")
            .includes(normalizedQuery)
      )
      .filter((item) => minimumScore === "all" || (source === "arxiv" && sort !== "newest" ? sortValue(item, sort, paperScoresById.get(item.id)) : trendScore(item)) >= Number(minimumScore))
      .filter(
        (item) =>
          topic === "all" ||
          (item.matchedTopics?.length ? item.matchedTopics : item.tags).includes(topic)
      )
      .sort((a, b) => sortValue(b, sort, paperScoresById.get(b.id)) - sortValue(a, sort, paperScoresById.get(a.id)) || trendScore(b) - trendScore(a));
  }, [items, minimumScore, paperScoresById, query, sort, source, timeRange, topic]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
          Tümü
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden p-0 sm:p-0">
        <DialogHeader className="border-b border-border/70 p-5 pr-12 sm:p-6 sm:pr-14">
          <div className="flex items-center gap-2 text-primary">
            {icon}
            <span className="text-xs font-medium uppercase tracking-[0.16em]">Tüm trendler</span>
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {source === "github"
              ? "GitHub projelerini tüm puan, yenilik ivmesi ve topluluk sinyalleriyle karşılaştırın."
              : "Makaleleri güncellik, konu ivmesi, özgünlük sinyali ve araştırma kapsamına göre karşılaştırın."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 border-b border-border/70 bg-muted/20 p-3 text-xs sm:gap-3 sm:p-4 sm:text-sm grid-cols-1 sm:grid-cols-2 md:grid-cols-5 sm:px-6">
          <label className="relative">
            <span className="sr-only">Trendlerde ara</span>
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder="Başlık, özet, yazar veya etiket ara"
            />
          </label>
          <label>
            <span className="sr-only">Zaman aralığı</span>
            <Select
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value as "180d" | "365d" | "all")}
              aria-label="Zaman aralığı"
            >
              <option value="180d">Son 6 Ay (Önerilen)</option>
              <option value="365d">Son 1 Yıl</option>
              <option value="all">Tüm Zamanlar</option>
            </Select>
          </label>
          <label>
            <span className="sr-only">Sıralama türü</span>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Sıralama türü"
            >
              <option value="trend">Trend puanı</option>
              {source === "arxiv" ? (
                <>
                  <option value="freshness">Güncellik puanı</option>
                  <option value="momentum">Konu ivmesi</option>
                  <option value="originality">Özgünlük sinyali</option>
                  <option value="depth">Araştırma kapsamı</option>
                </>
              ) : (
                <>
                  <option value="novelty">Yenilik puanı</option>
                  <option value="relevance">Önem puanı</option>
                </>
              )}
              <option value="newest">En yeni</option>
              {source === "github" ? (
                <>
                  <option value="starsPerDay">Yıldız / gün</option>
                  <option value="stars">Toplam yıldız</option>
                  <option value="forks">Fork sayısı</option>
                </>
              ) : null}
            </Select>
          </label>
          <label>
            <span className="sr-only">Minimum puan</span>
            <Select
              value={minimumScore}
              onChange={(event) => setMinimumScore(event.target.value)}
              aria-label="Minimum puan"
            >
              <option value="all">Tüm puanlar</option>
              <option value="80">80 ve üzeri</option>
              <option value="60">60 ve üzeri</option>
              <option value="40">40 ve üzeri</option>
            </Select>
          </label>
          <label>
            <span className="sr-only">Konu filtresi</span>
            <Select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              aria-label="Konu filtresi"
            >
              <option value="all">Tüm konular</option>
              {topics.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3 text-xs text-muted-foreground sm:px-6">
          <span>
            {filteredItems.length} / {items.length} sonuç
          </span>
          <span className="flex items-center gap-1">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Sıra, seçili ölçüte göre yeniden hesaplanır
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredItems.length ? (
            <div className="space-y-3">
              {filteredItems.map((item, index) => (
                <article key={item.id} className="rounded-2xl border border-border/80 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <SourceBadge source={item.source} />
                        <Badge tone="subtle">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.publishedAt)}
                        </span>
                      </div>
                      <Link
                        href={`/content/${item.id}`}
                        className="mt-2 block line-clamp-2 font-medium leading-6 hover:text-primary"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 pl-11">
                    <Score label="Trend" value={`${trendScore(item)} / 100`} />
                    {item.github ? (
                      <>
                        <Score label="Önem" value={`${item.relevanceScore} / 100`} />
                        <Score label="Yenilik" value={`${item.noveltyScore} / 100`} />
                        <Score label="Yıldız / gün" value={item.github.starsPerDay.toFixed(1)} />
                        <Score label="Yıldız" value={formatNumber(item.github.stars)} />
                        <Score label="Fork" value={formatNumber(item.github.forks)} />
                      </>
                    ) : (
                      <>
                        {(Object.entries(PAPER_SCORE_LABELS) as Array<[PaperScoreKey, string]>).map(([key, label]) => <Score key={key} label={label} value={`${paperScoresById.get(item.id)?.[key] ?? 0} / 100`} />)}
                      </>
                    )}
                  </div>
                  {source === "arxiv" ? <PaperRowDetails item={item} candidates={items} /> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Arama ve filtrelerle eşleşen trend bulunamadı.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SidebarTrendList({
  source,
  items,
  emptyText,
  updatedAt
}: {
  source: TrendSource;
  items: ContentItem[];
  emptyText: string;
  updatedAt?: string;
}) {
  return (
    <Card>
      <TrendCardContent source={source} items={items} emptyText={emptyText} updatedAt={updatedAt} />
    </Card>
  );
}

function sourceTitle(source: TrendSource) {
  if (source === "github") return "GitHub trendleri";
  if (source === "huggingface") return "Hugging Face trendleri";
  return "arXiv trendleri";
}

function sourceIcon(source: TrendSource) {
  if (source === "github") return <Github className="h-4 w-4" />;
  if (source === "huggingface") return <Library className="h-4 w-4 text-violet-400" />;
  return <BookOpen className="h-4 w-4 text-cyan-400" />;
}

function TrendCardContent({
  source,
  items,
  emptyText,
  updatedAt
}: {
  source: TrendSource;
  items: ContentItem[];
  emptyText: string;
  updatedAt?: string;
}) {
  const title = sourceTitle(source);
  const icon = sourceIcon(source);

  return (
    <>
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            {icon}
            {title}
          </CardTitle>
          <AllTrendsDialog source={source} items={items} title={title} icon={icon} />
        </div>
        <p className="text-xs text-muted-foreground">
          Son güncelleme: {updatedAt ? formatDateTime(updatedAt) : "Henüz güncellenmedi"}
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        <TrendItems items={items} emptyText={emptyText} />
      </CardContent>
    </>
  );
}

function TrendItems({ items, emptyText }: { items: ContentItem[]; emptyText: string }) {
  return items.length ? (
    <>
      {items.slice(0, 5).map((item, index) => (
        <div key={item.id} className="flex items-start gap-1">
          <span className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <TrendDetail item={item} />
          </div>
        </div>
      ))}
    </>
  ) : (
    <p className="py-5 text-sm text-muted-foreground">{emptyText}</p>
  );
}

export function SidebarTrendTabs({
  githubItems,
  arxivItems,
  huggingFaceItems,
  githubUpdatedAt,
  arxivUpdatedAt,
  huggingFaceUpdatedAt
}: {
  githubItems?: ContentItem[];
  arxivItems: ContentItem[];
  huggingFaceItems: ContentItem[];
  githubUpdatedAt?: string;
  arxivUpdatedAt?: string;
  huggingFaceUpdatedAt?: string;
}) {
  const [activeSource, setActiveSource] = useState<"github" | "arxiv" | "huggingface" | "queue">("github");
  const activeItems = activeSource === "github" ? (githubItems ?? []) : activeSource === "arxiv" ? arxivItems : huggingFaceItems;
  const activeUpdatedAt = activeSource === "github" ? githubUpdatedAt : activeSource === "arxiv" ? arxivUpdatedAt : huggingFaceUpdatedAt;
  const activeEmptyText =
    activeSource === "github"
      ? "Henüz GitHub trendi yok."
      : activeSource === "arxiv"
        ? "Henüz arXiv trendi yok."
        : "Henüz Hugging Face trendi yok.";
  const activeTitle = activeSource === "queue" ? "Makale İndirme ve İşleme Kuyruğu" : sourceTitle(activeSource);

  return (
    <Card>
      <div
        role="tablist"
        aria-label="Trend kaynağı"
        className="grid grid-cols-4 gap-1 border-b border-border/70 p-1 sm:p-1.5"
      >
        {(["github", "arxiv", "huggingface", "queue"] as const).map((source) => {
          const isActive = activeSource === source;
          return (
            <button
              key={source}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${source}-trend-panel`}
              onClick={() => setActiveSource(source)}
              className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[10px] sm:text-[11px] font-medium transition ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {source === "queue" ? <Download className="h-3.5 w-3.5 shrink-0 text-cyan-400" /> : sourceIcon(source)}
              <span className="truncate">{source === "github" ? "GitHub" : source === "arxiv" ? "arXiv" : source === "huggingface" ? "HF" : "Kuyruk"}</span>
            </button>
          );
        })}
      </div>
      <div id={`${activeSource}-trend-panel`} role="tabpanel" aria-label={activeTitle}>
        {activeSource === "queue" ? (
          <div className="p-2">
            <PaperProcessingProgress />
          </div>
        ) : (
          <TrendCardContent
            source={activeSource}
            items={activeItems}
            emptyText={activeEmptyText}
            updatedAt={activeUpdatedAt}
          />
        )}
      </div>
    </Card>
  );
}
