import { mockContent } from "@/data/mock-content";
import { getContent, getPreference, listContent, upsertContent } from "@/lib/local-db";
import { listStoredPapers } from "@/lib/arxiv/repository";
import type { ContentItem } from "@/types";

export interface ContentFilters { source?: ContentItem["source"] | "all"; type?: ContentItem["type"] | "all"; tag?: string; bookmarked?: boolean | "all"; read?: boolean | "all"; includeStale?: boolean; }
let legacyImported = false;
function balanceSources(items: ContentItem[]) { const selected: ContentItem[] = []; const deferred: ContentItem[] = []; const counts = new Map<string,number>(); for (const item of items) { const count = counts.get(item.source) ?? 0; if (selected.length < 12 && count < 3) { selected.push(item); counts.set(item.source,count + 1); } else deferred.push(item); } return [...selected,...deferred]; }
function freshItems(items: ContentItem[]) { const { freshnessDays } = getPreference("settings", { freshnessDays: 14 }); const cutoff=Date.now()-Math.max(1,Number(freshnessDays))*86400000; return items.filter((item) => new Date(item.publishedAt).getTime() >= cutoff || item.isBookmarked); }
async function ensureLegacyData() { if (legacyImported || listContent({ limit: 1 }).length) return; legacyImported = true; const legacy = await listStoredPapers().catch(() => []); legacy.forEach((item) => upsertContent(item)); if (process.env.SAVVY_DEMO_MODE === "true" && !legacy.length) mockContent.forEach((item) => upsertContent(item)); }
export async function getFeaturedContent(): Promise<ContentItem | undefined> { await ensureLegacyData(); const items = listContent({ limit: 50 }); return items.find((item) => item.isFeatured) ?? items[0]; }
export async function getLatestContent(): Promise<ContentItem[]> { await ensureLegacyData(); return balanceSources(freshItems(listContent({ limit: 200 })).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())); }
export async function getResearchContent(filters: ContentFilters = {}): Promise<ContentItem[]> { await ensureLegacyData(); const items=listContent({ source: filters.source, type: filters.type, bookmarked: typeof filters.bookmarked === "boolean" ? filters.bookmarked : undefined, limit: 3000 }).filter((item) => (!filters.tag || item.tags.some((tag) => tag.toLowerCase().includes(filters.tag!.toLowerCase()))) && (typeof filters.read !== "boolean" || item.isRead === filters.read)); return balanceSources(filters.includeStale ? items : freshItems(items)); }
export async function getContentById(id: string) { await ensureLegacyData(); return getContent(id); }
export async function getSimilarContent(id: string) { const current = await getContentById(id); if (!current) return []; return listContent({ limit: 200 }).filter((item) => item.id !== id && (item.source === current.source || item.tags.some((tag) => current.tags.includes(tag)))).slice(0, 4); }
export async function getLatestPeoplePosts() { await ensureLegacyData(); return listContent({ limit: 200 }).filter((item) => item.type === "post").slice(0, 20); }
export async function getBookmarks() { await ensureLegacyData(); return listContent({ bookmarked: true, limit: 500 }); }
