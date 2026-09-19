import { mockModels } from "@/data/mock-models";
import { getStoredModel, listModels, upsertModel } from "@/lib/local-db";
import type { ModelItem } from "@/types";

export interface ModelFilters { source?: ModelItem["source"] | "all"; organization?: string; pipeline?: string; query?: string; }
function ensureDemo() { if (!listModels().length && process.env.SAVVY_DEMO_MODE === "true") mockModels.forEach(upsertModel); }
export async function getTrendingModels() { ensureDemo(); return listModels(); }
export async function getModelById(id: string) { ensureDemo(); return getStoredModel(id); }
export async function getModels(filters: ModelFilters = {}) { ensureDemo(); return listModels().filter((item) => { if (filters.source && filters.source !== "all" && item.source !== filters.source) return false; if (filters.organization && !item.organization.toLowerCase().includes(filters.organization.toLowerCase())) return false; if (filters.pipeline && !item.pipeline?.toLowerCase().includes(filters.pipeline.toLowerCase())) return false; if (filters.query && ![item.name,item.modelId,item.organization,item.description,...item.tags].join(" ").toLowerCase().includes(filters.query.toLowerCase())) return false; return true; }); }
