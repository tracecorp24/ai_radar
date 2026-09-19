import type { ContentItem } from "@/types";

type GitHubRepository = {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  owner?: { login?: string };
  topics?: string[];
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  archived?: boolean;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function daysSince(value: string) {
  return Math.max(0.25, (Date.now() - new Date(value).getTime()) / 86_400_000);
}

function keywordScore(repository: GitHubRepository, query: string) {
  const terms = query.toLocaleLowerCase("en").split(/\s+/).filter((term) => term.length > 1);
  const text = `${repository.full_name} ${repository.description ?? ""} ${(repository.topics ?? []).join(" ")}`.toLocaleLowerCase("en");
  return terms.length ? 100 * terms.filter((term) => text.includes(term)).length / terms.length : 50;
}

export function isGitHubTrendCandidate(item: ContentItem) {
  if (item.source !== "github") return true;
  const stars = item.github?.stars ?? 0;
  const forks = item.github?.forks ?? 0;
  const starsPerDay = item.github?.starsPerDay ?? 0;
  return stars >= 25 && (starsPerDay >= 0.5 || stars >= 200 || forks >= 20);
}

function normalizeRepositories(repositories: GitHubRepository[], query: string, periodDays: number): ContentItem[] {
  const maxStars = Math.max(1, ...repositories.map((repository) => repository.stargazers_count ?? 0));
  const maxForks = Math.max(1, ...repositories.map((repository) => repository.forks_count ?? 0));
  const maxVelocity = Math.max(0.01, ...repositories.map((repository) => (repository.stargazers_count ?? 0) / daysSince(repository.created_at)));

  return repositories.map((repository) => {
    const stars = repository.stargazers_count ?? 0;
    const forks = repository.forks_count ?? 0;
    const ageDays = daysSince(repository.created_at);
    const activityDays = daysSince(repository.pushed_at);
    const starsPerDay = stars / ageDays;
    const popularity = 100 * Math.log1p(stars) / Math.log1p(maxStars);
    const community = 100 * Math.log1p(forks) / Math.log1p(maxForks);
    const velocity = 100 * Math.log1p(starsPerDay) / Math.log1p(maxVelocity);
    const freshness = clamp(100 - activityDays / Math.max(1, periodDays) * 100);
    const relevance = keywordScore(repository, query);
    const trendScore = Math.round(clamp(velocity * 0.4 + popularity * 0.2 + freshness * 0.15 + community * 0.1 + relevance * 0.15));

    return {
      id: `github-${repository.id}`,
      source: "github",
      type: "release",
      externalId: String(repository.id),
      title: repository.full_name,
      summary: repository.description ?? "GitHub projesi",
      url: repository.html_url,
      authors: [repository.owner?.login ?? "GitHub"],
      organization: repository.owner?.login,
      publishedAt: repository.pushed_at || repository.updated_at,
      firstSeenAt: new Date().toISOString(),
      tags: [...(repository.topics ?? []), repository.language].filter((value): value is string => Boolean(value)),
      relevanceScore: Math.round(relevance),
      noveltyScore: Math.round((velocity + freshness) / 2),
      trendScore,
      trendReasons: [
        `${stars.toLocaleString("tr-TR")} yıldız · ${forks.toLocaleString("tr-TR")} fork`,
        `Trend hızının ana sinyali: günde ortalama ${starsPerDay.toFixed(1)} yıldız`,
        `Son push ${Math.round(activityDays)} gün önce`,
        `Anahtar kelime uyumu %${Math.round(relevance)}`
      ],
      matchedTopics: [query],
      github: { stars, forks, openIssues: repository.open_issues_count ?? 0, language: repository.language ?? undefined, createdAt: repository.created_at, pushedAt: repository.pushed_at, starsPerDay },
      isBookmarked: false,
      isRead: false
    } satisfies ContentItem;
  }).sort((a, b) => (b.trendScore ?? 0) - (a.trendScore ?? 0));
}

export async function searchGitHubTrends({ query, periodDays, limit }: { query: string; periodDays: number; limit: number }) {
  const since = new Date(Date.now() - periodDays * 86_400_000).toISOString().slice(0, 10);
  const searchQuery = `${query} in:name,description,topics pushed:>=${since} archived:false fork:false`;
  const headers: HeadersInit = { Accept: "application/vnd.github+json", "User-Agent": "SavvyTrendRadar/0.11", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const requested = Math.min(1000, Math.max(5, limit));
  const repositories: GitHubRepository[] = [];
  let total = 0;
  for (let page = 1; repositories.length < requested && page <= 10; page += 1) {
    const url = new URL("https://api.github.com/search/repositories");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("sort", "stars");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", String(Math.min(100, requested - repositories.length)));
    url.searchParams.set("page", String(page));
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000), cache: "no-store" });
    if (!response.ok) {
      const remaining = response.headers.get("x-ratelimit-remaining");
      if (response.status === 403 || response.status === 429) throw new Error(`GitHub arama kotası dolu${remaining === "0" ? "" : " veya istek sınırlandı"}. 1000 sonuç için GITHUB_TOKEN tanımlamanız önerilir.`);
      throw new Error(`GitHub araması başarısız (${response.status}).`);
    }
    const payload = await response.json() as { items?: GitHubRepository[]; total_count?: number };
    const pageItems = (payload.items ?? []).filter((item) => !item.archived);
    total = payload.total_count ?? total;
    repositories.push(...pageItems);
    if (pageItems.length < Math.min(100, requested - repositories.length + pageItems.length)) break;
  }
  return { items: normalizeRepositories(repositories.slice(0, requested), query, periodDays), total };
}

export async function searchGitHubTopicTrends({ topics, periodDays, limit, eligibleOnly = true }: { topics: string[]; periodDays: number; limit: number; eligibleOnly?: boolean }) {
  const selectedTopics = topics.slice(0, 10);
  const perTopic = Math.min(1000, Math.max(5, Math.ceil(Math.min(1000, limit) / Math.max(1, selectedTopics.length))));
  const results = [];
  for (const topic of selectedTopics) results.push(await searchGitHubTrends({ query: topic, periodDays, limit: perTopic }));
  const merged = new Map<string, ContentItem>();
  for (const result of results) for (const item of result.items) {
    const current = merged.get(item.externalId);
    if (!current) merged.set(item.externalId, item);
    else merged.set(item.externalId, { ...(itemScore(current) >= itemScore(item) ? current : item), matchedTopics: [...new Set([...(current.matchedTopics ?? []), ...(item.matchedTopics ?? [])])] });
  }
  const items = [...merged.values()].filter((item) => !eligibleOnly || isGitHubTrendCandidate(item)).sort((a, b) => itemScore(b) - itemScore(a)).slice(0, Math.min(1000, limit));
  return { items, total: results.reduce((sum, result) => sum + result.total, 0) };
}

function itemScore(item: ContentItem) {
  return item.trendScore ?? 0;
}
