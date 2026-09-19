import { arxivAdapter } from "@/lib/adapters/arxiv-adapter";
import { arxivQueryFromTopics, searchArxiv } from "@/lib/arxiv/client";
import { scorePapers } from "@/lib/arxiv/trend-scoring";
import { searchGitHubTopicTrends } from "@/lib/github/trend-client";
import { matchedTopics, parseTopics } from "@/lib/trends/topic-utils";
import type { TrendSearchValues } from "@/lib/schemas";
import type { ContentItem } from "@/types";

export async function searchTrends({ query, source, periodDays, limit }: TrendSearchValues) {
  const topics = parseTopics(query);
  const jobs: Array<Promise<{ source: "arxiv" | "github"; items: ContentItem[]; total: number; error?: string }>> = [];
  if (source === "all" || source === "arxiv") {
    jobs.push((async () => {
      try {
        const papers = await searchArxiv({ query: arxivQueryFromTopics(topics, periodDays), max: limit });
        const items = scorePapers(papers.map(arxivAdapter.normalize), { topics, periodDays }).map((item) => ({ ...item, matchedTopics: matchedTopics(item, topics) }));
        return { source: "arxiv" as const, items, total: items.length };
      } catch (error) {
        return { source: "arxiv" as const, items: [], total: 0, error: error instanceof Error ? error.message : "arXiv araması başarısız." };
      }
    })());
  }
  if (source === "all" || source === "github") {
    jobs.push((async () => {
      try {
        const result = await searchGitHubTopicTrends({ topics, periodDays, limit });
        return { source: "github" as const, ...result };
      } catch (error) {
        return { source: "github" as const, items: [], total: 0, error: error instanceof Error ? error.message : "GitHub araması başarısız." };
      }
    })());
  }
  const results = await Promise.all(jobs);
  const items = results.flatMap((result) => result.items).sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0)).slice(0, limit);
  if (!items.length && results.every((result) => result.error)) throw new Error(results.map((result) => `${result.source}: ${result.error}`).join(" · "));
  return { items, sources: results.map(({ source: resultSource, total, error }) => ({ source: resultSource, total, error })), query, topics, periodDays };
}
