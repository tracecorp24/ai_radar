import { mockSources } from "@/data/mock-sources";
import { getLocalSources, saveLocalSource } from "@/lib/local-db";
import type { SourceStatus } from "@/types";

const DEFAULT_AI_SEARCH_TOPICS = ["AI agent", "large language model", "RAG", "fine tuning", "reinforcement learning", "multimodal AI", "AI coding", "diffusion model", "robotics", "AI safety"];
const LEGACY_AI_SEARCH_TOPICS = ["ai agent", "large language model", "machine learning", "computer vision", "robotics"];

const BUILT_INS: SourceStatus[] = [
  { id: "builtin-arxiv", name: "arXiv", type: "arxiv", url: "https://export.arxiv.org/api/query", status: "waiting", totalItems: 0, newItems: 0, checkIntervalMinutes: 360, keywords: DEFAULT_AI_SEARCH_TOPICS, lookbackDays: 7, maxResults: 1000 },
  { id: "builtin-huggingface", name: "Hugging Face", type: "huggingface", url: "https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=500&full=true", status: "waiting", totalItems: 0, newItems: 0, checkIntervalMinutes: 90, maxResults: 1000 },
  { id: "builtin-github", name: "GitHub AI Radar", type: "github", url: "https://api.github.com/search/repositories", status: "waiting", totalItems: 0, newItems: 0, checkIntervalMinutes: 120, keywords: DEFAULT_AI_SEARCH_TOPICS, lookbackDays: 7, maxResults: 1000 },
  { id: "builtin-ollama", name: "Local Ollama", type: "ollama-local", url: "http://127.0.0.1:11434/api/tags", status: "disabled", totalItems: 0, newItems: 0, checkIntervalMinutes: 180 }
];

function ensureSources() {
  const local = getLocalSources() as unknown as SourceStatus[];
  const visibleLocal = process.env.SAVVY_DEMO_MODE === "true" ? local : local.filter((source) => !/^source-0[1-8]$/.test(source.id));
  const seeds = process.env.SAVVY_DEMO_MODE === "true" ? mockSources : BUILT_INS;
  const ids = new Set(visibleLocal.map((source) => source.id));
  const missing = seeds.filter((source) => !ids.has(source.id));
  missing.forEach((source) => saveLocalSource(source as unknown as Record<string, unknown>));
  const defaults = new Map(BUILT_INS.map((source) => [source.id, source]));
  return [...visibleLocal, ...missing].map((source) => {
    const fallback = defaults.get(source.id);
    if (!fallback) return source;
    const checkIntervalMinutes = fallback.type === "arxiv" && source.checkIntervalMinutes === 1440 ? fallback.checkIntervalMinutes : source.checkIntervalMinutes;
    const hasLegacyDefault = source.keywords?.length === 1 && source.keywords[0].toLocaleLowerCase("en") === "artificial intelligence";
    const hasLegacyTopicSet = source.keywords?.map((topic) => topic.toLocaleLowerCase("en")).join("|") === LEGACY_AI_SEARCH_TOPICS.join("|");
    const hasLegacyLimit = ((source.id === "builtin-arxiv" || source.id === "builtin-github") && (source.maxResults ?? 0) <= 50)
      || (source.id === "builtin-huggingface" && (source.maxResults ?? 0) <= 30);
    return { ...fallback, ...source, checkIntervalMinutes, keywords: hasLegacyDefault || hasLegacyTopicSet ? fallback.keywords : source.keywords ?? fallback.keywords, lookbackDays: source.lookbackDays ?? fallback.lookbackDays, maxResults: hasLegacyDefault || hasLegacyLimit ? fallback.maxResults : source.maxResults ?? fallback.maxResults };
  });
}

export async function getSources(): Promise<SourceStatus[]> { return ensureSources(); }
export async function getSourceHealthHistory(): Promise<SourceStatus[]> { return ensureSources(); }
