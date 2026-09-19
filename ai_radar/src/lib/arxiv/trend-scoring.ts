import type { ContentItem } from "@/types";
import { classifyPaperTrendPhase, trendPhaseReason } from "@/lib/trends/paper-trend-phase";

const TOPIC_TERMS = ["agent", "rag", "retrieval", "reasoning", "multimodal", "vision-language", "alignment", "diffusion", "language model", "robotics", "mcp", "long context", "transformer"];

function recency(publishedAt: string, periodDays: number) {
  const ageHours = Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 3_600_000);
  return Math.max(0, 100 - ageHours / Math.max(24, periodDays * 24) * 100);
}

function topicSignal(paper: ContentItem, corpus: ContentItem[]) {
  const text = `${paper.title} ${paper.summary} ${paper.tags.join(" ")}`.toLowerCase();
  const matches = TOPIC_TERMS.filter((term) => text.includes(term));
  const frequency = corpus.filter((item) => matches.some((term) => `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(term))).length;
  return Math.min(100, matches.length * 12 + frequency * 2);
}

function queryRelevance(paper: ContentItem, topics: string[]) {
  const title = paper.title.toLocaleLowerCase("en");
  const text = `${paper.title} ${paper.summary} ${paper.tags.join(" ")}`.toLocaleLowerCase("en");
  if (!topics.length) return 50;
  return Math.max(...topics.map((topic) => {
    const terms = topic.toLocaleLowerCase("en").split(/\s+/).filter((term) => term.length > 1);
    if (!terms.length) return 0;
    const matches = terms.filter((term) => text.includes(term)).length;
    const titleMatches = terms.filter((term) => title.includes(term)).length;
    return Math.min(100, matches / terms.length * 70 + titleMatches / terms.length * 30);
  }));
}

export function scorePapers(papers: ContentItem[], options: { query?: string; topics?: string[]; periodDays?: number } = {}) {
  const periodDays = options.periodDays ?? 14;
  const topics = options.topics ?? (options.query ? [options.query] : []);
  return papers.map((paper) => {
    const recencyScore = recency(paper.publishedAt, periodDays);
    const topicScore = topicSignal(paper, papers);
    const relevance = topics.length ? queryRelevance(paper, topics) : Math.min(100, paper.relevanceScore || Math.min(100, paper.tags.length * 12 + (paper.summary.length > 500 ? 15 : 0)));
    const novelty = Math.min(100, paper.noveltyScore || Math.max(20, 100 - topicScore / 2));
    const score = Math.round(Math.min(100, recencyScore * 0.35 + topicScore * 0.25 + relevance * 0.3 + novelty * 0.05 + (paper.authors.length > 2 ? 5 : 0)));
    const reasons = [`Anahtar kelime uyumu %${Math.round(relevance)}`, recencyScore > 70 ? "Seçilen dönemin yeni yayını" : "Seçilen dönem içinde", topicScore > 30 ? "Konu yoğunluğu yükseliyor" : "Niş konu", `${paper.authors.length} yazar`];
    const trendPhase = classifyPaperTrendPhase({ publishedAt: paper.publishedAt, trendScore: score, momentumScore: topicScore });
    return { ...paper, relevanceScore: Math.round(relevance), noveltyScore: Math.round(novelty), trendScore: score, trendPhase, trendReasons: trendPhase ? [...reasons, trendPhaseReason(trendPhase)] : reasons, isFeatured: score >= 75 };
  }).sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0));
}
