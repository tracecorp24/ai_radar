import { arxivAdapter } from "@/lib/adapters/arxiv-adapter";
import { arxivQueryFromTopics, searchArxiv } from "@/lib/arxiv/client";
import { scorePapers } from "@/lib/arxiv/trend-scoring";
import { searchGitHubTopicTrends } from "@/lib/github/trend-client";
import { getSources } from "@/lib/services/source-service";
import { matchedTopics, parseTopics } from "@/lib/trends/topic-utils";
import { classifyPaperTrendPhase, trendPhaseReason } from "@/lib/trends/paper-trend-phase";
import { addTrendSnapshot, createIngestionRun, createNotification, enqueuePaperDocumentJob, finishIngestionRun, getPreference, hasActiveIngestionRun, refreshDashboardCache, saveLocalSource, upsertContent, upsertModel } from "@/lib/local-db";
import type { ContentItem, ModelItem, SourceStatus } from "@/types";

type CollectionResult = { content: ContentItem[]; models?: ModelItem[]; cache?: { etag?: string; lastModified?: string; notModified?: boolean } };
type HuggingFacePaperRecord = {
  paper?: {
    id?: string;
    title?: string;
    summary?: string;
    publishedAt?: string;
    authors?: Array<{ name?: string }>;
    upvotes?: number;
    ai_keywords?: string[];
    organization?: { fullname?: string; name?: string };
  };
  title?: string;
  summary?: string;
  publishedAt?: string;
  thumbnail?: string;
  numComments?: number;
  organization?: { fullname?: string; name?: string };
};

function decodeXml(value: string) { return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim(); }
function xmlTag(block: string, names: string[]) { for (const name of names) { const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i")); if (match) return decodeXml(match[1]); } return ""; }
function xmlLink(block: string) { const href = block.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1]; return href ?? xmlTag(block, ["link", "guid"]); }
function idFor(source: string, externalId: string) { return `${source}-${externalId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(-100)}`; }
function scoreContent(item: ContentItem) { const settings = getPreference("settings", { freshnessDays:14,interests:["Agentic AI","RAG","MCP","Multimodal","Local LLM"],weights:{ research:55,novelty:60,trust:70,interest:65,community:45 } }); const ageDays = Math.max(0,(Date.now()-new Date(item.publishedAt).getTime())/86400000); const freshness = Math.max(0,100-(ageDays/settings.freshnessDays)*100); const interest = item.tags.some((tag) => settings.interests.some((topic) => tag.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(tag.toLowerCase()))) ? 100 : 35; const research = Math.min(100,20+item.summary.length/8); const trust = item.source === "arxiv" ? 95 : item.source === "github" || item.source === "huggingface" ? 80 : 65; const community = item.source === "github" || item.source === "huggingface" ? 70 : 45; const weights = settings.weights; const weightTotal = weights.research+weights.novelty+weights.trust+weights.interest+weights.community; const total = Math.round((research*weights.research+freshness*weights.novelty+trust*weights.trust+interest*weights.interest+community*weights.community)/Math.max(1,weightTotal)); return { ...item,relevanceScore:total,noveltyScore:Math.round((freshness+interest+research)/3),trendScore:total,trendReasons:[`Tazelik ${Math.round(freshness)}`,`İlgi uyumu ${interest}`,`Kaynak güveni ${trust}`] }; }

async function fetchWithRetry(url: string, init: RequestInit = {}, source?: SourceStatus) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const headers = new Headers(init.headers);
      headers.set("User-Agent", "SavvyLocal/0.8");
      headers.set("Accept", "application/json, application/atom+xml, application/rss+xml, text/xml");
      if (source?.etag) headers.set("If-None-Match", source.etag);
      if (source?.lastModified) headers.set("If-Modified-Since", source.lastModified);
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(15000), headers, cache: "no-store" });
      if (response.status === 304) return response;
      if (response.status === 429 || response.status >= 500) throw new Error(`HTTP ${response.status}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, [1000, 3000][attempt]));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Kaynak isteği başarısız.");
}
function responseCache(response: Response) { return { etag: response.headers.get("etag") ?? undefined, lastModified: response.headers.get("last-modified") ?? undefined, notModified: response.status === 304 }; }

async function collectRss(source: SourceStatus): Promise<CollectionResult> {
  const response = await fetchWithRetry(source.url!, {}, source);
  const cache = responseCache(response);
  if (cache.notModified) return { content: [], cache };
  const xml = await response.text();
  const blocks = [...xml.matchAll(/<(?:item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/(?:item|entry)>/gi)].map((match) => match[1]).slice(0, 50);
  const content = blocks.map((block, index) => {
    const url = xmlLink(block);
    const externalId = xmlTag(block, ["guid", "id"]) || url || `${source.id}-${index}`;
    const declaredDate = xmlTag(block, ["pubDate", "published", "updated"]);
    const tags = [...block.matchAll(/<(?:category|dc:subject)(?:\s[^>]*)?>([\s\S]*?)<\/(?:category|dc:subject)>/gi)].map((match) => decodeXml(match[1])).filter(Boolean);
    const publishedAt = declaredDate && !Number.isNaN(new Date(declaredDate).getTime()) ? new Date(declaredDate).toISOString() : new Date().toISOString();
    return scoreContent({ id: idFor("rss", externalId), source: "rss", type: "article", externalId, title: xmlTag(block, ["title"]) || "Başlıksız içerik", summary: xmlTag(block, ["description", "summary", "content", "content:encoded"]) || "Özet bulunamadı.", url: url || source.url!, authors: [xmlTag(block, ["author", "dc:creator"])].filter(Boolean), publishedAt, firstSeenAt: new Date().toISOString(), tags: declaredDate ? tags : [...tags, "Tarih belirtilmemiş"], relevanceScore: 0, noveltyScore: 0, isBookmarked: false, isRead: false });
  });
  return { content, cache };
}
async function collectGithub(source: SourceStatus): Promise<CollectionResult> {
  const hasToken = Boolean(process.env.GITHUB_TOKEN);
  const topics = parseTopics(source.keywords?.length ? source.keywords : ["artificial intelligence"], hasToken ? 10 : 5);
  const limit = hasToken ? source.maxResults ?? 1000 : Math.min(source.maxResults ?? 1000, 50);
  const result = await searchGitHubTopicTrends({ topics, periodDays: source.lookbackDays ?? 7, limit, eligibleOnly: false });
  return { content: result.items };
}
function huggingFaceModelUrl(source: SourceStatus, limit: number) {
  const url = new URL(source.url?.includes("/api/models") ? source.url : "https://huggingface.co/api/models");
  url.searchParams.set("sort", "trendingScore");
  url.searchParams.set("direction", "-1");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("full", "true");
  return url.toString();
}
async function fetchHuggingFacePapers(limit: number) {
  const pageSize = Math.min(100, limit);
  const pageCount = Math.ceil(limit / pageSize);
  const pages = await Promise.all(Array.from({ length: pageCount }, async (_, page) => {
    const url = new URL("https://huggingface.co/api/daily_papers");
    url.searchParams.set("sort", "trending");
    url.searchParams.set("limit", String(Math.min(pageSize, limit - page * pageSize)));
    url.searchParams.set("p", String(page));
    const response = await fetchWithRetry(url.toString());
    return response.json() as Promise<HuggingFacePaperRecord[]>;
  }));
  return pages.flat().slice(0, limit);
}
function normalizeHuggingFacePaper(record: HuggingFacePaperRecord): ContentItem | undefined {
  const paper = record.paper ?? {};
  const paperId = String(paper.id ?? "").trim();
  if (!paperId) return undefined;
  const publishedAt = String(record.publishedAt ?? paper.publishedAt ?? new Date().toISOString());
  const summary = String(record.summary ?? paper.summary ?? "Hugging Face Daily Papers özeti bulunamadı.");
  const organization = record.organization?.fullname ?? record.organization?.name ?? paper.organization?.fullname ?? paper.organization?.name;
  const upvotes = Number(paper.upvotes ?? 0);
  const comments = Number(record.numComments ?? 0);
  const scored = scoreContent({
    id: idFor("huggingface-paper", paperId),
    source: "huggingface",
    type: "paper",
    externalId: paperId,
    title: String(record.title ?? paper.title ?? paperId),
    summary,
    url: `https://huggingface.co/papers/${paperId}`,
    imageUrl: record.thumbnail,
    authors: (paper.authors ?? []).map((author) => String(author.name ?? "")).filter(Boolean),
    organization,
    publishedAt,
    firstSeenAt: new Date().toISOString(),
    tags: Array.isArray(paper.ai_keywords) ? paper.ai_keywords.map(String).slice(0, 20) : [],
    relevanceScore: 0,
    noveltyScore: 0,
    isBookmarked: false,
    isRead: false,
    arxiv: {
      absUrl: `https://arxiv.org/abs/${paperId}`,
      pdfUrl: `https://arxiv.org/pdf/${paperId}`,
      texUrl: `https://export.arxiv.org/e-print/${paperId}`,
      categories: []
    }
  });
  const communityTrend = Math.min(100, Math.round(35 + Math.log10(upvotes + 1) * 24 + Math.log10(comments + 1) * 8));
  const trendScore = Math.max(scored.trendScore ?? 0, communityTrend);
  const trendPhase = classifyPaperTrendPhase({ publishedAt, trendScore, momentumScore: communityTrend, engagementScore: communityTrend });
  return {
    ...scored,
    trendScore,
    trendPhase,
    trendReasons: [...(scored.trendReasons ?? []), `Hugging Face ${upvotes} oy · ${comments} yorum`, ...(trendPhase ? [trendPhaseReason(trendPhase)] : [])],
    isFeatured: trendScore >= 75
  };
}
async function collectHuggingFace(source: SourceStatus): Promise<CollectionResult> {
  const maxResults = Math.max(2, Math.min(1000, source.maxResults ?? 1000));
  const modelLimit = Math.ceil(maxResults / 2);
  const paperLimit = Math.floor(maxResults / 2);
  const [response, paperRecords] = await Promise.all([
    fetchWithRetry(huggingFaceModelUrl(source, modelLimit)),
    fetchHuggingFacePapers(paperLimit)
  ]);
  const data = await response.json() as Array<Record<string, unknown>>;
  const models = data.map((record) => { const modelId = String(record.modelId ?? record.id); const organization = modelId.includes("/") ? modelId.split("/")[0] : "Community"; const downloads = Number(record.downloads ?? 0); const likes = Number(record.likes ?? 0); return { id: idFor("huggingface", modelId), source: "huggingface" as const, modelId, name: modelId.split("/").at(-1) ?? modelId, organization, description: String(record.description ?? `${modelId} model kartı`), url: `https://huggingface.co/${modelId}`, pipeline: typeof record.pipeline_tag === "string" ? record.pipeline_tag : undefined, license: Array.isArray(record.tags) ? record.tags.map(String).find((tag) => tag.startsWith("license:"))?.replace("license:", "") : undefined, downloads, likes, dailyGrowth: 0, weeklyGrowth: 0, trendScore: Math.min(100, Math.round(Math.log10(downloads + 1) * 13 + Math.log10(likes + 1) * 8)), updatedAt: String(record.lastModified ?? new Date().toISOString()), tags: Array.isArray(record.tags) ? record.tags.map(String).slice(0, 20) : [] } satisfies ModelItem; });
  const modelContent = models.map((model) => scoreContent({ id: model.id, source: "huggingface", type: "model", externalId: model.modelId, title: model.name, summary: model.description, url: model.url, authors: [model.organization], organization: model.organization, publishedAt: model.updatedAt, firstSeenAt: new Date().toISOString(), tags: model.tags, relevanceScore: model.trendScore, noveltyScore: model.trendScore, trendScore: model.trendScore, isBookmarked: false, isRead: false }));
  const paperContent = paperRecords.map(normalizeHuggingFacePaper).filter((item): item is ContentItem => Boolean(item));
  return { content: [...paperContent, ...modelContent], models };
}

async function collectOllama(source: SourceStatus): Promise<CollectionResult> { const response = await fetchWithRetry(source.url ?? "http://127.0.0.1:11434/api/tags", {}, source); const cache=responseCache(response); if(cache.notModified)return {content:[],models:[],cache}; const data = await response.json() as { models?: Array<Record<string, unknown>> }; const models = (data.models ?? []).map((record) => ({ id: idFor("ollama", String(record.name)), source: "ollama" as const, modelId: String(record.name), name: String(record.name), organization: "Local Ollama", description: "Bu cihazdaki Ollama model envanteri.", url: "http://127.0.0.1:11434", parameterSize: String((record.details as Record<string, unknown> | undefined)?.parameter_size ?? ""), quantization: String((record.details as Record<string, unknown> | undefined)?.quantization_level ?? ""), downloads: 0, likes: 0, dailyGrowth: 0, weeklyGrowth: 0, trendScore: 50, updatedAt: String(record.modified_at ?? new Date().toISOString()), tags: [String((record.details as Record<string, unknown> | undefined)?.family ?? "local")].filter(Boolean) } satisfies ModelItem)); return { models, content: models.map((model) => scoreContent({ id: model.id, source: "ollama", type: "model", externalId: model.modelId, title: model.name, summary: model.description, url: model.url, authors: [model.organization], publishedAt: model.updatedAt, firstSeenAt: new Date().toISOString(), tags: model.tags, relevanceScore: 50, noveltyScore: 40, isBookmarked: false, isRead: false })),cache };
}

async function collect(source: SourceStatus): Promise<CollectionResult> { const type = source.type.toLowerCase(); if (type.includes("arxiv") || source.id === "builtin-arxiv") { const topics = parseTopics(source.keywords ?? []); const periodDays = source.lookbackDays ?? 7; const queryTopics = source.id === "builtin-arxiv" ? [] : topics; const papers = await searchArxiv({ query: arxivQueryFromTopics(queryTopics, periodDays), max: source.maxResults ?? 1000 }); const items = scorePapers(papers.map(arxivAdapter.normalize), { topics, periodDays }).map((item) => ({ ...item, matchedTopics: matchedTopics(item, topics) })); return { content: items }; } if (type.includes("github")) return collectGithub(source); if (type.includes("hugging") || source.id === "builtin-huggingface") return collectHuggingFace(source); if (type.includes("ollama")) return collectOllama(source); if (type.includes("rss") || type.includes("atom") || source.url?.includes("rss")) return collectRss(source); throw new Error(`Desteklenmeyen kaynak türü: ${source.type}`); }

export async function runSourceIngestion(sourceId: string) {
  const source = (await getSources()).find((item) => item.id === sourceId);
  if (!source) throw new Error("Kaynak bulunamadı.");
  if (source.status === "disabled" || source.status === "paused") throw new Error("Kaynak devre dışı.");
  if (hasActiveIngestionRun(sourceId)) throw new Error("Bu kaynak için başka bir çalışma devam ediyor.");
  const run = createIngestionRun(sourceId);
  const now = new Date().toISOString();
  saveLocalSource({ ...source, status: "running", lastCheckedAt: now, lastError: undefined });
  try {
    const result = await collect(source);
    let created = 0;
    let updated = 0;
    for (const item of result.content) {
      const outcome = upsertContent({ ...item, originSourceId: sourceId });
      if (outcome.created) created += 1;
      else if (outcome.changed) updated += 1;
      if (outcome.item.arxiv && outcome.item.type === "paper" && !outcome.item.paperDocument) enqueuePaperDocumentJob(outcome.item.id);
    }
    for (const model of result.models ?? []) upsertModel(model);
    const totalItems = Number(source.totalItems ?? 0) + created;
    const top = [...result.content].sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0))[0];
    addTrendSnapshot({ sourceId, topic: top?.tags[0], contentCount: created, modelDownloads: (result.models ?? []).reduce((sum, model) => sum + model.downloads, 0), weeklyArticles: result.content.filter((item) => item.type === "article" || item.type === "paper").length, sourceHealth: 100, trendScore: top?.trendScore ?? 0 });
    if (top && (top.trendScore ?? 0) >= 75 && created > 0) createNotification({ type: "trend", title: "Yeni yüksek skorlu sinyal", detail: top.title, href: `/content/${top.id}` });
    const updatedSource: SourceStatus = { ...source, status: "active", lastCheckedAt: now, lastSuccessfulRunAt: now, totalItems, newItems: created, lastError: undefined, etag: result.cache?.etag ?? source.etag, lastModified: result.cache?.lastModified ?? source.lastModified };
    saveLocalSource(updatedSource as unknown as Record<string, unknown>);
    refreshDashboardCache();
    finishIngestionRun(run.id, { status: "succeeded", itemsFound: result.content.length, itemsCreated: created, itemsUpdated: updated });
    return { source: updatedSource, count: result.content.length, created, updated, items: result.content, notModified: result.cache?.notModified ?? false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kaynak çalıştırılamadı.";
    const updatedSource: SourceStatus = { ...source, status: "error", lastCheckedAt: now, lastError: message };
    saveLocalSource(updatedSource as unknown as Record<string, unknown>);
    refreshDashboardCache();
    finishIngestionRun(run.id, { status: "failed", error: message });
    createNotification({ type: "source-error", title: `${source.name} çalıştırılamadı`, detail: message, href: "/sources" });
    throw error;
  }
}
