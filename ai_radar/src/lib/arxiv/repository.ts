import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { getContent, listContent, upsertContent } from "@/lib/local-db";
import type { ContentItem } from "@/types";

let legacyChecked = false;
function importLegacyDatabase() { if (legacyChecked) return; legacyChecked = true; if (listContent({ source: "arxiv", limit: 1 }).length) return; const legacyFile = path.join(process.cwd(), ".data", "research.sqlite"); if (!existsSync(legacyFile)) return; const legacy = new DatabaseSync(legacyFile, { readOnly: true }); try { const table = legacy.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='papers'").get(); if (!table) return; legacy.prepare("SELECT payload FROM papers").all().forEach((row) => upsertContent(JSON.parse(String(row.payload)) as ContentItem)); } finally { legacy.close(); } }
export async function listStoredPapers() { importLegacyDatabase(); return listContent({ source: "arxiv", limit: 500 }); }
export async function upsertPapers(papers: ContentItem[]) { papers.forEach(upsertContent); return listStoredPapers(); }
export async function updateStoredPaper(id: string, patch: Partial<ContentItem>) { const current = getContent(id); if (!current) return undefined; const updated = { ...current,...patch,updatedAt:new Date().toISOString() }; upsertContent(updated); return updated; }
