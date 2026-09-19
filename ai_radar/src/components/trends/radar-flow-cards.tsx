"use client";

import { SourceBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import type { ContentItem } from "@/types";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  GitFork,
  Github,
  Search,
  Star
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type RadarItem = ContentItem & { displayTopics?: string[] };
type SortKey = "score" | "newest" | "relevance" | "novelty";

function score(item: ContentItem) {
  return item.trendScore ?? Math.round((item.relevanceScore + item.noveltyScore) / 2);
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
      {label} <strong className="font-semibold text-foreground">{value}</strong>
    </span>
  );
}

function RadarCard({ item }: { item: RadarItem }) {
  const topics = item.displayTopics ?? item.matchedTopics ?? item.tags;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="group block h-full w-full text-left">
          <Card className="h-full border-border/80 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-lg">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <SourceBadge source={item.source} />
                <Badge tone="subtle">{item.type}</Badge>
                <span className="ml-auto rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {score(item)} / 100
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 font-semibold leading-6 transition group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {item.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5" aria-label="İçerik puanları">
                <ScorePill label="Radar" value={score(item)} />
                <ScorePill label="Önem" value={item.relevanceScore} />
                <ScorePill label="Yenilik" value={item.noveltyScore} />
              </div>

              {item.github ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-2 font-medium text-amber-300">
                    <Star className="h-3.5 w-3.5" />
                    {formatNumber(item.github.stars)} yıldız
                  </span>
                  <span className="flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-2.5 py-2 font-medium text-cyan-300">
                    <GitFork className="h-3.5 w-3.5" />
                    {formatNumber(item.github.forks)} fork
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="rounded-lg bg-muted/60 px-2.5 py-2">{item.authors.length} yazar</span>
                  <span className="truncate rounded-lg bg-muted/60 px-2.5 py-2">
                    {item.arxiv?.categories[0] ?? "arXiv"}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-1">
                {topics.slice(0, 3).map((topic) => (
                  <Badge key={topic} tone="subtle" className="px-1.5 py-0 text-[10px]">
                    {topic}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                <span>
                  {item.github
                    ? `${item.github.starsPerDay.toFixed(1)} yıldız/gün`
                    : `${item.authors.length} yazar · ${item.arxiv?.categories[0] ?? "arXiv"}`}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {formatDateTime(item.publishedAt)}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </div>
            </CardContent>
          </Card>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <SourceBadge source={item.source} />
            <Badge tone="subtle">{item.type}</Badge>
            <Badge>{score(item)} / 100</Badge>
          </div>
          <DialogTitle className="pr-8 leading-7">{item.title}</DialogTitle>
          <DialogDescription className="leading-6">{item.summary}</DialogDescription>
        </DialogHeader>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          {item.github ? (
            <>
              <Metric label="Yıldız" value={formatNumber(item.github.stars)} />
              <Metric label="Fork" value={formatNumber(item.github.forks)} />
              <Metric label="Yıldız / gün" value={item.github.starsPerDay.toFixed(1)} />
              <Metric label="Açık konu" value={formatNumber(item.github.openIssues)} />
            </>
          ) : (
            <>
              <Metric label="Yazar" value={item.authors.length} />
              <Metric label="Kategori" value={item.arxiv?.categories[0] ?? item.tags[0] ?? "—"} />
              <Metric label="Önem" value={item.relevanceScore} />
              <Metric label="Yenilik" value={item.noveltyScore} />
            </>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {topics.slice(0, 8).map((topic) => (
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

function RadarGroup({
  title,
  description,
  items,
  icon
}: {
  title: string;
  description: string;
  items: RadarItem[];
  icon: React.ReactNode;
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex items-center gap-3 border-b border-border/70 pb-3">
        <span className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</span>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge tone="subtle" className="ml-auto">
          {items.length} sonuç
        </Badge>
      </div>
      {items.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <RadarCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Bu bölümde aramanızla eşleşen sonuç yok.
        </div>
      )}
    </section>
  );
}

export function RadarFlowCards({ items }: { items: RadarItem[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("score");

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
    const result = normalizedQuery
      ? items.filter((item) =>
          [
            item.title,
            item.summary,
            item.organization,
            ...item.authors,
            ...item.tags,
            ...(item.matchedTopics ?? []),
            ...(item.displayTopics ?? [])
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("tr-TR")
            .includes(normalizedQuery)
        )
      : [...items];

    return result.sort((first, second) => {
      if (sort === "newest") {
        return new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime();
      }
      if (sort === "relevance") return second.relevanceScore - first.relevanceScore;
      if (sort === "novelty") return second.noveltyScore - first.noveltyScore;
      return score(second) - score(first);
    });
  }, [items, query, sort]);

  const articles = filteredItems.filter((item) => item.source !== "github");
  const repositories = filteredItems.filter((item) => item.source === "github");

  return (
    <div className="space-y-5">
      <div className="grid gap-2 rounded-2xl border bg-card/60 p-3 sm:grid-cols-[minmax(0,1fr)_190px]">
        <div className="relative">
          <label htmlFor="radar-flow-search" className="sr-only">
            Radar akışında ara
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="radar-flow-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Başlık, konu veya yazar ara..."
            className="pl-9"
          />
        </div>
        <div>
          <label htmlFor="radar-flow-sort" className="sr-only">
            Radar akışını sırala
          </label>
          <Select
            id="radar-flow-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="Radar akışını sırala"
          >
            <option value="score">Radar puanı</option>
            <option value="newest">En yeni</option>
            <option value="relevance">Önem puanı</option>
            <option value="novelty">Yenilik puanı</option>
          </Select>
        </div>
      </div>

      <RadarGroup
        title="Makaleler"
        description="arXiv ve araştırma yayınları"
        items={articles}
        icon={<BookOpen className="h-4 w-4" />}
      />
      <RadarGroup
        title="GitHub projeleri"
        description="Depolar, sürümler ve topluluk sinyalleri"
        items={repositories}
        icon={<Github className="h-4 w-4" />}
      />
    </div>
  );
}
