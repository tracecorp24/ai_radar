"use client";

import { SourceBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/formatters";
import type { ContentSource, TrendTopic } from "@/types";
import { ArrowRight, BookOpen, CircleHelp, Flame, Github, Linkedin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export type RisingCategory = "paper" | "linkedin";
type Contribution = { id: string; title: string; summary: string; source: ContentSource; publishedAt: string; score: number };
type CategoryView = { count: number; previousCount: number; contributions: Contribution[] };

export interface RisingTopicView extends TrendTopic {
  categories: Record<RisingCategory, CategoryView>;
}

const CATEGORY_META = {
  paper: { label: "Makaleler", icon: BookOpen },
  linkedin: { label: "LinkedIn", icon: Linkedin }
} as const;

function changeLabel(count: number, previousCount: number) {
  const difference = count - previousCount;
  if (previousCount === 0 && count > 0) return `Yeni · +${count}`;
  const growth = previousCount ? (difference / previousCount) * 100 : 0;
  return `${growth > 0 ? "+" : ""}${growth.toFixed(0)}% · ${difference > 0 ? "+" : ""}${difference}`;
}

type RisingTopicsAnalysis = { catalog: string[]; catalogSize: number; githubCount: number; arxivCount: number };

function TopicContributionsDialog({ topic, initialCategory, rank }: { topic: RisingTopicView; initialCategory: RisingCategory; rank: number }) {
  const [selectedCategory, setSelectedCategory] = useState<RisingCategory>(initialCategory);
  const view = topic.categories[selectedCategory];

  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="group flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left transition hover:bg-muted/60">
        <span className="w-5 text-xs text-muted-foreground">{String(rank).padStart(2, "0")}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-primary">{topic.name}</span>
        <span className="shrink-0 text-[11px] font-medium text-emerald-400">{changeLabel(topic.categories[initialCategory].count, topic.categories[initialCategory].previousCount)}</span>
      </button>
    </DialogTrigger>
    <DialogContent className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2 pr-8"><Badge>{topic.name}</Badge><Badge tone="subtle">Son 24 saat: {view.count}</Badge><Badge tone="subtle">Önceki 24 saat: {view.previousCount}</Badge></div>
        <DialogTitle>Artışa katkı sağlayan içerikler</DialogTitle>
        <DialogDescription>Bu konu için kaynak türleri arasında geçiş yapabilirsiniz.</DialogDescription>
      </DialogHeader>
      <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1" role="tablist" aria-label={`${topic.name} içerik kategorileri`}>
        {(Object.entries(CATEGORY_META) as Array<[RisingCategory, (typeof CATEGORY_META)[RisingCategory]]>).map(([key, meta]) => {
          const Icon = meta.icon;
          const categoryView = topic.categories[key];
          return <button key={key} type="button" role="tab" aria-selected={selectedCategory === key} onClick={() => setSelectedCategory(key)} className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition ${selectedCategory === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{meta.label}</span><span className="text-[10px]">({categoryView.count})</span></button>;
        })}
      </div>
      <div className="mt-4 divide-y divide-border/70">
        {view.contributions.length ? view.contributions.map((item) => <Link key={item.id} href={`/content/${item.id}`} className="group grid gap-2 py-4 first:pt-0"><span className="flex items-center gap-2"><SourceBadge source={item.source} /><span className="text-xs text-muted-foreground">{formatDateTime(item.publishedAt)} · {item.score} puan</span></span><span className="flex items-start gap-2"><span className="min-w-0 flex-1"><span className="line-clamp-2 text-sm font-medium group-hover:text-primary">{item.title}</span><span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</span></span><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></span></Link>) : <p className="rounded-xl border border-dashed px-3 py-5 text-center text-xs leading-5 text-muted-foreground">Bu konu için {CATEGORY_META[selectedCategory].label.toLocaleLowerCase("tr")} tarafında henüz eşleşen içerik yok.</p>}
      </div>
    </DialogContent>
  </Dialog>;
}

export function RisingTopicsPanel({ topics, analysis }: { topics: RisingTopicView[]; analysis: RisingTopicsAnalysis }) {
  const [category, setCategory] = useState<RisingCategory>("paper");
  const visibleTopics = topics.filter((topic) => topic.categories[category].count > 0 || topic.categories[category].previousCount > 0);

  return <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-sm"><Flame className="h-4 w-4 text-orange-400" />Yükselenler
        <Dialog>
          <DialogTrigger asChild><button type="button" className="ml-0.5 rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Yükselen konuların kaynağını açıkla"><CircleHelp className="h-4 w-4" /></button></DialogTrigger>
          <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Yükselen konular nereden geliyor?</DialogTitle><DialogDescription>Trend listesinin nasıl oluşturulduğuna dair güncel analiz özeti.</DialogDescription></DialogHeader><div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground"><p>GitHub depo adı, açıklaması ve topic etiketleri ile arXiv makale başlığı, özeti ve kategorileri taranır.</p><p>Son 24 saatteki konu hacmi önceki 24 saatle karşılaştırılır. Sıralama puanının %65’i eşleşen içeriklerin ortalama trend puanından, %20’si içerik hacminden, %15’i büyüme momentumundan gelir.</p><p>Her turda {analysis.catalogSize} kavramın tamamı taranır. Son analizde {analysis.githubCount} GitHub ve {analysis.arxivCount} arXiv kaydı değerlendirildi.</p><div className="flex flex-wrap gap-1">{analysis.catalog.map((topic) => <Badge key={topic} tone="subtle" className="px-1.5 py-0 text-[10px]">{topic}</Badge>)}</div></div></DialogContent>
        </Dialog>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1" role="tablist" aria-label="Yükselen içerik kategorileri">
        {(Object.entries(CATEGORY_META) as Array<[RisingCategory, (typeof CATEGORY_META)[RisingCategory]]>).map(([key, meta]) => { const Icon = meta.icon; return <button key={key} type="button" role="tab" aria-selected={category === key} onClick={() => setCategory(key)} className={`flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition ${category === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="h-3.5 w-3.5" /><span className="truncate">{meta.label}</span></button>; })}
      </div>
      <div className="space-y-1">{visibleTopics.length ? visibleTopics.slice(0, 12).map((topic, index) => <TopicContributionsDialog key={`${category}-${topic.name}`} topic={topic} initialCategory={category} rank={index + 1} />) : <p className="rounded-xl border border-dashed px-3 py-5 text-center text-xs leading-5 text-muted-foreground">Son iki 24 saatlik dönemde bu kategoride eşleşen içerik bulunamadı.</p>}</div>
    </CardContent>
  </Card>;
}
