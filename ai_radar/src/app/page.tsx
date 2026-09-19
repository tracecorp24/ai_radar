import { HuggingFaceModelsPanel } from "@/components/models/hugging-face-models-panel";
import { SourceBadge } from "@/components/shared/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HomeTrendActions } from "@/components/trends/home-trend-actions";
import { HomeFreshnessFilter } from "@/components/trends/home-freshness-filter";
import { PaperProcessingProgress } from "@/components/research/paper-processing-progress";
import { RadarFlowCards } from "@/components/trends/radar-flow-cards";
import {
  RisingTopicsPanel,
  type RisingCategory,
  type RisingTopicView
} from "@/components/trends/rising-topics-panel";
import { SidebarTrendTabs } from "@/components/trends/sidebar-trend-list";
import { getDashboardCache } from "@/lib/local-db";
import { formatDateTime, formatNumber } from "@/lib/formatters";
import { isGitHubTrendCandidate } from "@/lib/github/trend-client";
import {
  classifyContentTopics,
  TREND_TOPIC_CATALOG
} from "@/lib/services/autonomous-trend-analysis-service";
import {
  getFeaturedContent,
  getLatestContent,
  getResearchContent
} from "@/lib/services/content-service";
import { getSources } from "@/lib/services/source-service";
import { getTrendingModels } from "@/lib/services/model-service";
import { getTrendAnalysisStatus, getTrendTopics } from "@/lib/services/trend-service";
import type { ContentItem, TrendTopic } from "@/types";
import {
  AlertCircle,
  ArrowRight,
  Clock3,
  Cpu,
  ExternalLink,
  Flame,
  Radar,
  Search,
  Sparkles,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function itemScore(item: ContentItem) {
  return item.trendScore ?? Math.round((item.relevanceScore + item.noveltyScore) / 2);
}

function periodAwareScore(item: ContentItem, freshnessDays: number) {
  const ageDays = Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 86_400_000);
  const freshness = Math.max(0, 100 - (ageDays / freshnessDays) * 100);
  return itemScore(item) * 0.72 + freshness * 0.28;
}

function compareForPeriod(a: ContentItem, b: ContentItem, freshnessDays: number) {
  return (
    periodAwareScore(b, freshnessDays) - periodAwareScore(a, freshnessDays) ||
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function itemTopics(item: ContentItem, limit = 3) {
  return (
    item.matchedTopics?.length ? item.matchedTopics : classifyContentTopics(item, limit)
  ).slice(0, limit);
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const parsedPeriod = Number(period);
  const freshnessDays = [7, 30, 90, 365].includes(parsedPeriod) ? parsedPeriod : 7;
  const dashboard = getDashboardCache();
  const [featured, latest, allContent, trendTopics, sources, trendAnalysis, models] = await Promise.all([
    getFeaturedContent(),
    getLatestContent(),
    getResearchContent({ includeStale: true }),
    getTrendTopics(),
    getSources(),
    getTrendAnalysisStatus(),
    getTrendingModels()
  ]);
  const freshnessCutoff = Date.now() - freshnessDays * 24 * 60 * 60 * 1000;
  const homepage6mCutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;

  const isHomepageGitHubCandidate = (item: ContentItem) => {
    if (item.source !== "github") return true;
    const createdAt = item.github?.createdAt ? new Date(item.github.createdAt).getTime() : 0;
    const publishedAt = new Date(item.publishedAt).getTime();
    const isRecent = publishedAt >= homepage6mCutoff || (createdAt > 0 && createdAt >= homepage6mCutoff);
    return isRecent && isGitHubTrendCandidate(item);
  };

  const freshContent = allContent.filter(
    (item) => new Date(item.publishedAt).getTime() >= freshnessCutoff
  );
  const ranked = freshContent
    .filter(isHomepageGitHubCandidate)
    .sort((a, b) => compareForPeriod(a, b, freshnessDays));
  const editorialRanked = freshContent
    .filter((item) => item.source === "arxiv" || item.source === "github")
    .filter(isHomepageGitHubCandidate)
    .sort((a, b) => compareForPeriod(a, b, freshnessDays));
  const dailySignal = editorialRanked[0] ?? featured;
  const githubTrends = ranked.filter((item) => item.source === "github");
  const arxivTrends = ranked.filter((item) => item.source === "arxiv");
  const huggingFaceTrends = ranked.filter((item) => item.source === "huggingface");
  const mainTrendCandidates = editorialRanked.filter((item) => item.id !== dailySignal?.id);
  const mainTrends = [
    ...mainTrendCandidates.filter((item) => item.source !== "github").slice(0, 4),
    ...mainTrendCandidates.filter((item) => item.source === "github").slice(0, 4)
  ];
  const radarItems = mainTrends.map((item) => ({ ...item, displayTopics: itemTopics(item) }));
  const topics: TrendTopic[] = trendTopics.length
    ? trendTopics
    : [...new Set(latest.flatMap((item) => item.tags))]
        .slice(0, 10)
        .map((name) => ({
          name,
          growth: 0,
          count: latest.filter((item) => item.tags.includes(name)).length
        }));
  const contentById = new Map(allContent.map((item) => [item.id, item]));
  const categoryFor = (item: ContentItem): RisingCategory | null =>
    item.source === "linkedin" || item.type === "post"
      ? "linkedin"
      : item.source === "arxiv" || item.type === "paper"
        ? "paper"
        : null;
  const topicViews: RisingTopicView[] = topics.map((topic) => {
    const recentItems = (topic.itemIds ?? [])
      .map((id) => contentById.get(id))
      .filter((item): item is ContentItem => Boolean(item));
    const previousItems = (topic.previousItemIds ?? [])
      .map((id) => contentById.get(id))
      .filter((item): item is ContentItem => Boolean(item));
    const categories = Object.fromEntries(
      (["paper", "linkedin"] as RisingCategory[]).map((category) => {
        const contributions = recentItems.filter((item) => categoryFor(item) === category);
        const counts = topic.categoryCounts?.[category];
        return [
          category,
          {
            count: counts?.count ?? contributions.length,
            previousCount:
              counts?.previousCount ??
              previousItems.filter((item) => categoryFor(item) === category).length,
            contributions: contributions.map((item) => ({
              id: item.id,
              title: item.title,
              summary: item.summary,
              source: item.source,
              publishedAt: item.publishedAt,
              score: itemScore(item)
            }))
          }
        ];
      })
    ) as RisingTopicView["categories"];
    return { ...topic, categories };
  });
  const activeSources = sources.filter((source) => source.status === "active").length;
  const githubUpdatedAt = sources.find(
    (source) => source.id === "builtin-github"
  )?.lastSuccessfulRunAt;
  const arxivUpdatedAt = sources.find(
    (source) => source.id === "builtin-arxiv"
  )?.lastSuccessfulRunAt;
  const huggingFaceUpdatedAt = sources.find(
    (source) => source.id === "builtin-huggingface"
  )?.lastSuccessfulRunAt;
  const lastUpdatedAt = trendAnalysis.analyzedAt;
  const huggingFaceModels = models.filter((model) => model.source === "huggingface");

  if (!dailySignal)
    return (
      <div className="page-grid">
        <Card className="mx-auto max-w-2xl border-dashed">
          <CardContent className="space-y-5 p-10 text-center">
            <Radar className="mx-auto h-9 w-9 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">Trend radarını başlatın</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                GitHub ve arXiv kaynaklarını çalıştırdığınızda ana sayfa gerçek trendlerle dolacak.
              </p>
            </div>
            <Button asChild>
              <Link href="/sources">
                Kaynakları aç
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="page-grid space-y-6">
      <section className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Catch the Latest AI Trends
          </h1>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <HomeFreshnessFilter value={freshnessDays} resultCount={freshContent.length} />
          <HomeTrendActions />
          <Button asChild>
            <Link href="/trends">
              <Search className="h-4 w-4" />
              Canlı trend ara
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <TrendingUp className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xl font-semibold">{formatNumber(dashboard.contentCount)}</p>
              <p className="text-xs text-muted-foreground">izlenen sinyal</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="rounded-xl bg-orange-500/10 p-2 text-orange-400">
              <Flame className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{topics[0]?.name ?? "RAG"}</p>
              <p className="text-xs text-muted-foreground">haftanın konusu</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <span className="rounded-xl bg-violet-500/10 p-2 text-violet-400">
              <Cpu className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold leading-snug break-words [word-break:break-word] [overflow-wrap:anywhere]" title={models[0]?.name ?? "Huihui-Qwen3.8-27B-abliterated-GGUF"}>
                {models[0]?.name ?? "Huihui-Qwen3.8-27B-abliterated-GGUF"}
              </p>
              <p className="text-xs text-muted-foreground">en aktif model</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
                <Clock3 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "Henüz edilmedi"}
                </p>
                <p className="text-xs text-muted-foreground">son analiz saati</p>
              </div>
            </div>
            {activeSources < sources.length ? (
              <span
                title={`${sources.length - activeSources} kaynak devre dışı veya uyarı durumunda`}
                className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {sources.length - activeSources} pasif
              </span>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid items-start gap-5 xl:grid-cols-[240px_minmax(0,1fr)_300px]">
        <aside className="space-y-4 xl:sticky xl:top-20">
          <RisingTopicsPanel
            topics={topicViews}
            analysis={{
              catalog: TREND_TOPIC_CATALOG.map((topic) => topic.name),
              catalogSize: trendAnalysis.catalogSize,
              githubCount: trendAnalysis.sources.github,
              arxivCount: trendAnalysis.sources.arxiv
            }}
          />
          <HuggingFaceModelsPanel models={huggingFaceModels} />
        </aside>

        <div className="min-w-0 space-y-5">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
            <CardContent className="relative space-y-6 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Günün sinyali</Badge>
                <SourceBadge source={dailySignal.source} />
                <Badge tone="subtle">{dailySignal.type}</Badge>
                <span className="ml-auto rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {itemScore(dailySignal)} / 100
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                  {dailySignal.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                  {dailySignal.summary}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Neden günün sinyali?
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {(dailySignal.trendReasons?.length
                      ? dailySignal.trendReasons
                      : [
                          `Yüksek trend puanı: ${itemScore(dailySignal)}`,
                          `Önem skoru: ${dailySignal.relevanceScore}`,
                          `Yenilik skoru: ${dailySignal.noveltyScore}`
                        ]
                    )
                      .slice(0, 4)
                      .map((reason) => (
                        <p key={reason} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{reason}</span>
                        </p>
                      ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {dailySignal.github ? (
                    <>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Yıldız</p>
                        <p className="mt-1 font-semibold">
                          {formatNumber(dailySignal.github.stars)}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Fork</p>
                        <p className="mt-1 font-semibold">
                          {formatNumber(dailySignal.github.forks)}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Yıldız / gün</p>
                        <p className="mt-1 font-semibold">
                          {dailySignal.github.starsPerDay.toFixed(1)}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Dil</p>
                        <p className="mt-1 truncate font-semibold">
                          {dailySignal.github.language ?? "—"}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Yazar</p>
                        <p className="mt-1 font-semibold">{dailySignal.authors.length}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Kategori</p>
                        <p className="mt-1 truncate font-semibold">
                          {dailySignal.arxiv?.categories[0] ?? dailySignal.tags[0] ?? "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Önem</p>
                        <p className="mt-1 font-semibold">{dailySignal.relevanceScore}</p>
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Yenilik</p>
                        <p className="mt-1 font-semibold">{dailySignal.noveltyScore}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {dailySignal.tags.slice(0, 6).map((tag) => (
                  <Badge key={tag} tone="subtle">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                <span className="text-xs text-muted-foreground">
                  {dailySignal.authors.slice(0, 3).join(", ")} ·{" "}
                  {formatDateTime(dailySignal.publishedAt)}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <a href={dailySignal.url} target="_blank" rel="noreferrer">
                      Orijinal kaynak
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild>
                    <Link href={`/content/${dailySignal.id}`}>
                      Detaylı incele
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Radar akışı</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  GitHub ve arXiv’den öne çıkan güncel sinyaller
                </p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link href="/research">
                  Tümünü gör
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <RadarFlowCards items={radarItems} />
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20">
          <SidebarTrendTabs
            githubItems={githubTrends}
            arxivItems={arxivTrends}
            huggingFaceItems={huggingFaceTrends}
            githubUpdatedAt={githubUpdatedAt}
            arxivUpdatedAt={arxivUpdatedAt}
            huggingFaceUpdatedAt={huggingFaceUpdatedAt}
          />
          <Card className="border-dashed">
            <CardContent className="p-4 text-sm">
              <p className="font-medium">Kendi konunu izle</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Anahtar kelime ve dönem seçerek GitHub ile arXiv’i canlı tara.
              </p>
              <Button asChild size="sm" className="mt-3 w-full">
                <Link href="/trends">Trend motorunu aç</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
