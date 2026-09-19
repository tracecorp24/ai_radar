import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import type { BookmarkCollection, ContentItem, ModelItem, PersonItem, TrendPoint, TrendTopic } from "@/types";

const DATA_DIR = path.resolve(process.env.SAVVY_DATA_DIR ?? path.join(process.cwd(), ".data"));
const DB_FILE = path.join(DATA_DIR, "savvy.sqlite");
const SCHEMA_VERSION = 3;
let db: DatabaseSync | undefined;

function ensureColumn(database: DatabaseSync, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all().map((row) => String(row.name));
  if (!columns.includes(column)) database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
function textOrNull(value: unknown) { return value === undefined || value === null ? null : String(value); }
function numberOr(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

function backupLegacyDatabase() {
  if (!existsSync(DB_FILE)) return;
  const probe = new DatabaseSync(DB_FILE, { readOnly: true });
  const migrated = probe.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'").get();
  probe.close();
  if (migrated) return;
  const backupDir = path.join(DATA_DIR, "backups");
  mkdirSync(backupDir, { recursive: true });
  copyFileSync(DB_FILE, path.join(backupDir, `savvy-pre-v0.5-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`));
}

export function getLocalDatabase() {
  if (db) return db;
  mkdirSync(DATA_DIR, { recursive: true });
  backupLegacyDatabase();
  db = new DatabaseSync(DB_FILE);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS item_state (item_id TEXT PRIMARY KEY, is_bookmarked INTEGER NOT NULL DEFAULT 0, is_read INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS model_state (model_id TEXT PRIMARY KEY, is_favorite INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS local_sources (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS content_items (
      id TEXT PRIMARY KEY, source TEXT NOT NULL, external_id TEXT NOT NULL, canonical_url TEXT NOT NULL,
      title TEXT NOT NULL, summary TEXT NOT NULL, published_at TEXT NOT NULL, first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL, content_hash TEXT NOT NULL, trend_score REAL NOT NULL DEFAULT 0,
      payload TEXT NOT NULL, UNIQUE(source, external_id)
    );
    CREATE INDEX IF NOT EXISTS idx_content_published ON content_items(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_content_trend ON content_items(trend_score DESC);
    CREATE INDEX IF NOT EXISTS idx_content_url ON content_items(canonical_url);
    CREATE TABLE IF NOT EXISTS content_embeddings (content_id TEXT PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE, model TEXT NOT NULL, vector TEXT NOT NULL, categories TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_content_embeddings_model ON content_embeddings(model);
    CREATE TABLE IF NOT EXISTS models (id TEXT PRIMARY KEY, source TEXT NOT NULL, model_id TEXT NOT NULL, name TEXT NOT NULL, updated_at TEXT NOT NULL, trend_score REAL NOT NULL DEFAULT 0, payload TEXT NOT NULL, UNIQUE(source, model_id));
    CREATE INDEX IF NOT EXISTS idx_models_trend ON models(trend_score DESC);
    CREATE TABLE IF NOT EXISTS people (id TEXT PRIMARY KEY, name TEXT NOT NULL, platform TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS person_sources (person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE, source_id TEXT NOT NULL REFERENCES local_sources(id) ON DELETE CASCADE, PRIMARY KEY(person_id, source_id));
    CREATE TABLE IF NOT EXISTS ingestion_runs (id TEXT PRIMARY KEY, source_id TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, items_found INTEGER NOT NULL DEFAULT 0, items_created INTEGER NOT NULL DEFAULT 0, items_updated INTEGER NOT NULL DEFAULT 0, duration_ms INTEGER, error TEXT);
    CREATE INDEX IF NOT EXISTS idx_runs_source_started ON ingestion_runs(source_id, started_at DESC);
    CREATE TABLE IF NOT EXISTS trend_snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, captured_at TEXT NOT NULL, source_id TEXT NOT NULL, topic TEXT, content_count INTEGER NOT NULL DEFAULT 0, model_downloads INTEGER NOT NULL DEFAULT 0, weekly_articles INTEGER NOT NULL DEFAULT 0, source_health REAL NOT NULL DEFAULT 0, trend_score REAL NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS idx_trends_captured ON trend_snapshots(captured_at DESC);
    CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', system_key TEXT UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS collection_items (collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE, content_id TEXT NOT NULL, added_at TEXT NOT NULL, PRIMARY KEY(collection_id, content_id));
    CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, detail TEXT NOT NULL, href TEXT, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
    CREATE TABLE IF NOT EXISTS scheduler_heartbeat (id INTEGER PRIMARY KEY CHECK(id=1), heartbeat_at TEXT NOT NULL, pid INTEGER);
    CREATE TABLE IF NOT EXISTS dashboard_cache (key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS paper_processing_jobs (paper_id TEXT PRIMARY KEY REFERENCES content_items(id) ON DELETE CASCADE, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, available_at TEXT NOT NULL, started_at TEXT, finished_at TEXT, error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_paper_processing_jobs_queue ON paper_processing_jobs(status, available_at, created_at);
    CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(title, summary, tags, content='content_items', content_rowid='rowid');
    CREATE TRIGGER IF NOT EXISTS content_ai AFTER INSERT ON content_items BEGIN INSERT INTO content_fts(rowid,title,summary,tags) VALUES(new.rowid,new.title,new.summary,json_extract(new.payload,'$.tags')); END;
    CREATE TRIGGER IF NOT EXISTS content_ad AFTER DELETE ON content_items BEGIN INSERT INTO content_fts(content_fts,rowid,title,summary,tags) VALUES('delete',old.rowid,old.title,old.summary,json_extract(old.payload,'$.tags')); END;
    CREATE TRIGGER IF NOT EXISTS content_au AFTER UPDATE ON content_items BEGIN INSERT INTO content_fts(content_fts,rowid,title,summary,tags) VALUES('delete',old.rowid,old.title,old.summary,json_extract(old.payload,'$.tags')); INSERT INTO content_fts(rowid,title,summary,tags) VALUES(new.rowid,new.title,new.summary,json_extract(new.payload,'$.tags')); END;
  `);
  ensureColumn(db, "local_sources", "name", "TEXT");
  ensureColumn(db, "local_sources", "type", "TEXT");
  ensureColumn(db, "local_sources", "url", "TEXT");
  ensureColumn(db, "local_sources", "status", "TEXT NOT NULL DEFAULT 'waiting'");
  ensureColumn(db, "local_sources", "last_checked_at", "TEXT");
  ensureColumn(db, "local_sources", "last_successful_run_at", "TEXT");
  ensureColumn(db, "local_sources", "total_items", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "local_sources", "new_items", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "local_sources", "last_error", "TEXT");
  ensureColumn(db, "local_sources", "check_interval_minutes", "INTEGER NOT NULL DEFAULT 60");
  ensureColumn(db, "local_sources", "etag", "TEXT");
  ensureColumn(db, "local_sources", "last_modified", "TEXT");
  const sourceRows = db.prepare("SELECT id,payload FROM local_sources WHERE name IS NULL").all();
  const migrateSource = db.prepare("UPDATE local_sources SET name=?,type=?,url=?,status=?,last_checked_at=?,last_successful_run_at=?,total_items=?,new_items=?,last_error=?,check_interval_minutes=?,etag=?,last_modified=? WHERE id=?");
  sourceRows.forEach((row) => {
    const source = JSON.parse(String(row.payload)) as Record<string, unknown>;
    migrateSource.run(textOrNull(source.name), textOrNull(source.type), textOrNull(source.url), textOrNull(source.status) ?? "waiting", textOrNull(source.lastCheckedAt), textOrNull(source.lastSuccessfulRunAt), numberOr(source.totalItems, 0), numberOr(source.newItems, 0), textOrNull(source.lastError), numberOr(source.checkIntervalMinutes, 60), textOrNull(source.etag), textOrNull(source.lastModified), String(row.id));
  });
  db.prepare("INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?)").run(SCHEMA_VERSION, new Date().toISOString());
  const now = new Date().toISOString();
  db.prepare("INSERT OR IGNORE INTO collections(id,name,description,system_key,created_at,updated_at) VALUES ('later','Daha sonra oku','Hızlı takip etmek istediğiniz içerikler','later',?,?)").run(now, now);
  return db;
}
export function closeLocalDatabase() { db?.close(); db = undefined; }

export type ItemState = { isBookmarked: boolean; isRead: boolean };
export function getItemStates() { return getLocalDatabase().prepare("SELECT item_id, is_bookmarked, is_read FROM item_state").all().map((row) => ({ id: String(row.item_id), isBookmarked: Boolean(row.is_bookmarked), isRead: Boolean(row.is_read) })); }
export function setItemState(id: string, patch: Partial<ItemState>) {
  const current = getLocalDatabase().prepare("SELECT is_bookmarked, is_read FROM item_state WHERE item_id=?").get(id) as { is_bookmarked: number; is_read: number } | undefined;
  const state = { isBookmarked: patch.isBookmarked ?? Boolean(current?.is_bookmarked), isRead: patch.isRead ?? Boolean(current?.is_read) };
  getLocalDatabase().prepare("INSERT INTO item_state(item_id,is_bookmarked,is_read,updated_at) VALUES(?,?,?,?) ON CONFLICT(item_id) DO UPDATE SET is_bookmarked=excluded.is_bookmarked,is_read=excluded.is_read,updated_at=excluded.updated_at").run(id, state.isBookmarked ? 1 : 0, state.isRead ? 1 : 0, new Date().toISOString());
  if (state.isBookmarked) addCollectionItem("later", id); else removeCollectionItem("later", id);
  refreshDashboardCache();
  return state;
}
export function getModelFavorite(id: string) { const row = getLocalDatabase().prepare("SELECT is_favorite FROM model_state WHERE model_id=?").get(id) as { is_favorite: number } | undefined; return Boolean(row?.is_favorite); }
export function setModelFavorite(id: string, value: boolean) { getLocalDatabase().prepare("INSERT INTO model_state(model_id,is_favorite,updated_at) VALUES(?,?,?) ON CONFLICT(model_id) DO UPDATE SET is_favorite=excluded.is_favorite,updated_at=excluded.updated_at").run(id, value ? 1 : 0, new Date().toISOString()); return value; }

function hashText(value: string) { let hash = 2166136261; for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619); return (hash >>> 0).toString(16); }
function canonicalUrl(url: string) { try { const parsed = new URL(url); parsed.hash = ""; ["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].forEach((key) => parsed.searchParams.delete(key)); return parsed.toString(); } catch { return url; } }
function mergeState(item: ContentItem): ContentItem { const row = getLocalDatabase().prepare("SELECT is_bookmarked,is_read FROM item_state WHERE item_id=?").get(item.id) as { is_bookmarked: number; is_read: number } | undefined; return row ? { ...item, isBookmarked: Boolean(row.is_bookmarked), isRead: Boolean(row.is_read) } : item; }
export function upsertContent(item: ContentItem) {
  const existing = getLocalDatabase().prepare("SELECT id,content_hash,payload FROM content_items WHERE source=? AND external_id=?").get(item.source, item.externalId) as { id: string; content_hash: string; payload: string } | undefined;
  const existingItem = existing ? JSON.parse(existing.payload) as ContentItem : undefined;
  const normalized = { ...item, paperDocument: item.paperDocument ?? existingItem?.paperDocument, id: existing?.id ?? item.id, url: canonicalUrl(item.url), firstSeenAt: existing ? (getLocalDatabase().prepare("SELECT first_seen_at FROM content_items WHERE id=?").get(existing.id) as { first_seen_at: string }).first_seen_at : item.firstSeenAt };
  const contentHash = hashText(`${normalized.title}\n${normalized.summary}\n${normalized.url}`);
  const now = new Date().toISOString();
  getLocalDatabase().prepare("INSERT INTO content_items(id,source,external_id,canonical_url,title,summary,published_at,first_seen_at,last_seen_at,content_hash,trend_score,payload) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(source,external_id) DO UPDATE SET canonical_url=excluded.canonical_url,title=excluded.title,summary=excluded.summary,published_at=excluded.published_at,last_seen_at=excluded.last_seen_at,content_hash=excluded.content_hash,trend_score=excluded.trend_score,payload=excluded.payload").run(normalized.id, normalized.source, normalized.externalId, normalized.url, normalized.title, normalized.summary, normalized.publishedAt, normalized.firstSeenAt, now, contentHash, normalized.trendScore ?? normalized.relevanceScore, JSON.stringify(normalized));
  if (existing && existing.content_hash !== contentHash) getLocalDatabase().prepare("DELETE FROM content_embeddings WHERE content_id=?").run(normalized.id);
  return { item: normalized, created: !existing, changed: !existing || existing.content_hash !== contentHash };
}
export function listContent(options: { source?: string; type?: string; bookmarked?: boolean; limit?: number } = {}) {
  const rows = getLocalDatabase().prepare("SELECT payload FROM content_items ORDER BY trend_score DESC,published_at DESC LIMIT ?").all(Math.min(options.limit ?? 200, 5000));
  return rows.map((row) => mergeState(JSON.parse(String(row.payload)) as ContentItem)).filter((item) => (!options.source || options.source === "all" || item.source === options.source) && (!options.type || options.type === "all" || item.type === options.type) && (options.bookmarked === undefined || item.isBookmarked === options.bookmarked));
}
export function getContent(id: string) { const row = getLocalDatabase().prepare("SELECT payload FROM content_items WHERE id=?").get(id) as { payload: string } | undefined; return row ? mergeState(JSON.parse(row.payload) as ContentItem) : undefined; }
export type PaperDocumentJobStatus = "queued" | "processing" | "ready" | "failed";
export function enqueuePaperDocumentJob(paperId: string) {
  const database = getLocalDatabase();
  const paper = getContent(paperId);
  if (!paper || paper.source !== "arxiv" || paper.type !== "paper" || paper.paperDocument?.status === "ready") return false;
  const now = new Date().toISOString();
  database.prepare("INSERT INTO paper_processing_jobs(paper_id,status,attempts,available_at,created_at,updated_at) VALUES(?, 'queued', 0, ?, ?, ?) ON CONFLICT(paper_id) DO UPDATE SET status=CASE WHEN paper_processing_jobs.status IN ('failed','ready') THEN 'queued' ELSE paper_processing_jobs.status END, available_at=CASE WHEN paper_processing_jobs.status IN ('failed','ready') THEN excluded.available_at ELSE paper_processing_jobs.available_at END, error=CASE WHEN paper_processing_jobs.status IN ('failed','ready') THEN NULL ELSE paper_processing_jobs.error END, updated_at=excluded.updated_at").run(paperId, now, now, now);
  const current = getContent(paperId);
  if (current && current.paperDocument?.status !== "processing" && current.paperDocument?.status !== "ready") database.prepare("UPDATE content_items SET payload=? WHERE id=?").run(JSON.stringify({ ...current, paperDocument: { ...current.paperDocument, status: "queued", parsedAt: now, error: undefined } }), paperId);
  return true;
}
export function claimPaperDocumentJob() {
  const database = getLocalDatabase();
  database.exec("BEGIN IMMEDIATE");
  try {
    const job = database.prepare("SELECT paper_id,attempts FROM paper_processing_jobs WHERE status='queued' AND available_at<=? ORDER BY created_at LIMIT 1").get(new Date().toISOString()) as { paper_id: string; attempts: number } | undefined;
    if (!job) { database.exec("COMMIT"); return undefined; }
    const now = new Date().toISOString();
    database.prepare("UPDATE paper_processing_jobs SET status='processing',attempts=?,started_at=?,updated_at=?,error=NULL WHERE paper_id=?").run(job.attempts + 1, now, now, job.paper_id);
    const paper = getContent(job.paper_id);
    if (paper) database.prepare("UPDATE content_items SET payload=? WHERE id=?").run(JSON.stringify({ ...paper, paperDocument: { ...paper.paperDocument, status: "processing", parsedAt: now, error: undefined } }), job.paper_id);
    database.exec("COMMIT");
    return paper;
  } catch (error) { database.exec("ROLLBACK"); throw error; }
}
export function finishPaperDocumentJob(paperId: string, document: ContentItem["paperDocument"]) {
  const database = getLocalDatabase();
  const now = new Date().toISOString();
  const ready = document?.status === "ready";
  database.prepare("UPDATE paper_processing_jobs SET status=?,finished_at=?,error=?,updated_at=? WHERE paper_id=?").run(ready ? "ready" : "failed", now, ready ? null : document?.error ?? "Belge işlenemedi.", now, paperId);
  const paper = getContent(paperId);
  if (paper) database.prepare("UPDATE content_items SET payload=? WHERE id=?").run(JSON.stringify({ ...paper, paperDocument: document }), paperId);
}
export function recoverStalledPaperDocumentJobs(maxAgeMs = 20 * 60_000) {
  const database = getLocalDatabase();
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
  const stalled = database.prepare("SELECT paper_id FROM paper_processing_jobs WHERE status='processing' AND started_at<?").all(cutoff) as Array<{ paper_id: string }>;
  if (!stalled.length) return 0;
  const now = new Date().toISOString();
  database.prepare("UPDATE paper_processing_jobs SET status='queued',available_at=?,started_at=NULL,error=?,updated_at=? WHERE status='processing' AND started_at<?").run(now, "Önceki scheduler çalışması kesildi; iş yeniden kuyruğa alındı.", now, cutoff);
  for (const job of stalled) {
    const paper = getContent(job.paper_id);
    if (paper) database.prepare("UPDATE content_items SET payload=? WHERE id=?").run(JSON.stringify({ ...paper, paperDocument: { ...paper.paperDocument, status: "queued", parsedAt: now, error: undefined } }), job.paper_id);
  }
  return stalled.length;
}
export function getPaperProcessingSummary() { return getLocalDatabase().prepare("SELECT status,COUNT(*) count FROM paper_processing_jobs GROUP BY status").all() as Array<{ status: PaperDocumentJobStatus; count: number }>; }
export function getPaperProcessingProgress() {
  const database = getLocalDatabase();
  const summary = getPaperProcessingSummary();
  const jobs = database.prepare("SELECT j.paper_id,j.status,j.attempts,j.created_at,j.started_at,j.finished_at,j.error,c.title FROM paper_processing_jobs j JOIN content_items c ON c.id=j.paper_id ORDER BY CASE j.status WHEN 'processing' THEN 0 WHEN 'queued' THEN 1 WHEN 'failed' THEN 2 ELSE 3 END, j.updated_at DESC LIMIT 6").all() as Array<{ paper_id: string; status: PaperDocumentJobStatus; attempts: number; created_at: string; started_at?: string; finished_at?: string; error?: string; title: string }>;
  return { summary, jobs: jobs.map((job) => ({ paperId: job.paper_id, status: job.status, attempts: job.attempts, createdAt: job.created_at, startedAt: job.started_at, finishedAt: job.finished_at, error: job.error, title: job.title })), updatedAt: new Date().toISOString() };
}
export function searchContent(query: string, limit = 30) { if (!query.trim()) return listContent({ limit }); const safe = query.trim().split(/\s+/).map((part) => `"${part.replaceAll('"','')}"*`).join(" AND "); try { return getLocalDatabase().prepare("SELECT c.payload FROM content_fts f JOIN content_items c ON c.rowid=f.rowid WHERE content_fts MATCH ? ORDER BY rank LIMIT ?").all(safe, limit).map((row) => mergeState(JSON.parse(String(row.payload)) as ContentItem)); } catch { return []; } }

export type StoredContentEmbedding = { contentId: string; model: string; vector: number[]; categories: string[]; updatedAt: string };
export function upsertContentEmbedding(contentId: string, model: string, vector: number[], categories: string[]) {
  const updatedAt = new Date().toISOString();
  getLocalDatabase().prepare("INSERT INTO content_embeddings(content_id,model,vector,categories,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(content_id) DO UPDATE SET model=excluded.model,vector=excluded.vector,categories=excluded.categories,updated_at=excluded.updated_at").run(contentId, model, JSON.stringify(vector), JSON.stringify(categories), updatedAt);
  return { contentId, model, vector, categories, updatedAt } satisfies StoredContentEmbedding;
}
export function listContentEmbeddings() {
  return (getLocalDatabase().prepare("SELECT content_id,model,vector,categories,updated_at FROM content_embeddings").all() as Array<Record<string, unknown>>).map((row) => ({ contentId: String(row.content_id), model: String(row.model), vector: JSON.parse(String(row.vector)) as number[], categories: JSON.parse(String(row.categories)) as string[], updatedAt: String(row.updated_at) } satisfies StoredContentEmbedding));
}

export function upsertModel(model: ModelItem) { getLocalDatabase().prepare("INSERT INTO models(id,source,model_id,name,updated_at,trend_score,payload) VALUES(?,?,?,?,?,?,?) ON CONFLICT(source,model_id) DO UPDATE SET name=excluded.name,updated_at=excluded.updated_at,trend_score=excluded.trend_score,payload=excluded.payload").run(model.id, model.source, model.modelId, model.name, model.updatedAt, model.trendScore, JSON.stringify(model)); return model; }
export function listModels() { return getLocalDatabase().prepare("SELECT payload FROM models ORDER BY trend_score DESC,updated_at DESC").all().map((row) => JSON.parse(String(row.payload)) as ModelItem); }
export function getStoredModel(id: string) { const row = getLocalDatabase().prepare("SELECT payload FROM models WHERE id=?").get(id) as { payload: string } | undefined; return row ? JSON.parse(row.payload) as ModelItem : undefined; }

export function upsertPerson(person: PersonItem) { getLocalDatabase().prepare("INSERT INTO people(id,name,platform,is_active,payload,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,platform=excluded.platform,is_active=excluded.is_active,payload=excluded.payload,updated_at=excluded.updated_at").run(person.id, person.name, person.platform, person.isActive ? 1 : 0, JSON.stringify(person), new Date().toISOString()); return person; }
export function getPersonSourceIds(id: string) { return getLocalDatabase().prepare("SELECT source_id FROM person_sources WHERE person_id=? ORDER BY source_id").all(id).map((row)=>String(row.source_id)); }
export function setPersonSources(personId: string, sourceIds: string[]) { const database=getLocalDatabase(); database.exec("BEGIN IMMEDIATE"); try { database.prepare("DELETE FROM person_sources WHERE person_id=?").run(personId); const insert=database.prepare("INSERT OR IGNORE INTO person_sources(person_id,source_id) VALUES(?,?)"); sourceIds.forEach((sourceId)=>insert.run(personId,sourceId)); database.exec("COMMIT"); } catch(error) { database.exec("ROLLBACK"); throw error; } return getPersonSourceIds(personId); }
export function listPeople() { return getLocalDatabase().prepare("SELECT id,payload FROM people ORDER BY name").all().map((row) => ({ ...(JSON.parse(String(row.payload)) as PersonItem),sourceIds:getPersonSourceIds(String(row.id)) })); }
export function getStoredPerson(id: string) { const row = getLocalDatabase().prepare("SELECT payload FROM people WHERE id=?").get(id) as { payload: string } | undefined; return row ? { ...(JSON.parse(row.payload) as PersonItem),sourceIds:getPersonSourceIds(id) } : undefined; }
export function deletePerson(id: string) { return getLocalDatabase().prepare("DELETE FROM people WHERE id=?").run(id).changes > 0; }

export function getLocalSources() { return getLocalDatabase().prepare("SELECT payload FROM local_sources ORDER BY updated_at DESC").all().map((row) => JSON.parse(String(row.payload)) as Record<string, unknown>); }
export function getLocalSource(id: string) { const row = getLocalDatabase().prepare("SELECT payload FROM local_sources WHERE id=?").get(id) as { payload: string } | undefined; return row ? JSON.parse(row.payload) as Record<string, unknown> : undefined; }
export function saveLocalSource(source: Record<string, unknown>) {
  getLocalDatabase().prepare("INSERT INTO local_sources(id,payload,updated_at,name,type,url,status,last_checked_at,last_successful_run_at,total_items,new_items,last_error,check_interval_minutes,etag,last_modified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at,name=excluded.name,type=excluded.type,url=excluded.url,status=excluded.status,last_checked_at=excluded.last_checked_at,last_successful_run_at=excluded.last_successful_run_at,total_items=excluded.total_items,new_items=excluded.new_items,last_error=excluded.last_error,check_interval_minutes=excluded.check_interval_minutes,etag=excluded.etag,last_modified=excluded.last_modified").run(String(source.id), JSON.stringify(source), new Date().toISOString(), textOrNull(source.name), textOrNull(source.type), textOrNull(source.url), textOrNull(source.status) ?? "waiting", textOrNull(source.lastCheckedAt), textOrNull(source.lastSuccessfulRunAt), numberOr(source.totalItems, 0), numberOr(source.newItems, 0), textOrNull(source.lastError), numberOr(source.checkIntervalMinutes, 60), textOrNull(source.etag), textOrNull(source.lastModified));
  return source;
}
export function deleteLocalSource(id: string) { return getLocalDatabase().prepare("DELETE FROM local_sources WHERE id=?").run(id).changes > 0; }

export function createIngestionRun(sourceId: string) { const run = { id: `run-${crypto.randomUUID()}`, sourceId, status: "running", startedAt: new Date().toISOString() }; getLocalDatabase().prepare("INSERT INTO ingestion_runs(id,source_id,status,started_at) VALUES(?,?,?,?)").run(run.id, sourceId, run.status, run.startedAt); return run; }
export function hasActiveIngestionRun(sourceId: string) { return Boolean(getLocalDatabase().prepare("SELECT id FROM ingestion_runs WHERE source_id=? AND status='running' AND started_at>=datetime('now','-30 minutes') LIMIT 1").get(sourceId)); }
export function finishIngestionRun(id: string, result: { status: "succeeded" | "failed"; itemsFound?: number; itemsCreated?: number; itemsUpdated?: number; error?: string }) { const row = getLocalDatabase().prepare("SELECT started_at FROM ingestion_runs WHERE id=?").get(id) as { started_at: string }; const finishedAt = new Date().toISOString(); getLocalDatabase().prepare("UPDATE ingestion_runs SET status=?,finished_at=?,items_found=?,items_created=?,items_updated=?,duration_ms=?,error=? WHERE id=?").run(result.status, finishedAt, result.itemsFound ?? 0, result.itemsCreated ?? 0, result.itemsUpdated ?? 0, Date.now() - new Date(row.started_at).getTime(), result.error ?? null, id); }
export function listIngestionRuns(sourceId?: string, limit = 30) { return sourceId ? getLocalDatabase().prepare("SELECT * FROM ingestion_runs WHERE source_id=? ORDER BY started_at DESC LIMIT ?").all(sourceId, limit) : getLocalDatabase().prepare("SELECT * FROM ingestion_runs ORDER BY started_at DESC LIMIT ?").all(limit); }

export function addTrendSnapshot(input: { sourceId: string; topic?: string; contentCount: number; modelDownloads?: number; weeklyArticles?: number; sourceHealth: number; trendScore?: number }) { getLocalDatabase().prepare("INSERT INTO trend_snapshots(captured_at,source_id,topic,content_count,model_downloads,weekly_articles,source_health,trend_score) VALUES(?,?,?,?,?,?,?,?)").run(new Date().toISOString(), input.sourceId, input.topic ?? null, input.contentCount, input.modelDownloads ?? 0, input.weeklyArticles ?? 0, input.sourceHealth, input.trendScore ?? 0); }
export function getTrendData(days = 14): { points: TrendPoint[]; topics: TrendTopic[] } { const since = new Date(Date.now() - days * 86400000).toISOString(); const daily = getLocalDatabase().prepare("SELECT substr(captured_at,1,10) date,SUM(content_count) contentCount,SUM(model_downloads) modelDownloads,SUM(weekly_articles) weeklyArticles,AVG(source_health) sourceHealth FROM trend_snapshots WHERE captured_at>=? GROUP BY substr(captured_at,1,10) ORDER BY date").all(since) as Array<Record<string, unknown>>; const topics = getLocalDatabase().prepare("SELECT topic name,SUM(content_count) count,AVG(trend_score) growth FROM trend_snapshots WHERE captured_at>=? AND topic IS NOT NULL GROUP BY topic ORDER BY growth DESC LIMIT 12").all(since) as Array<Record<string, unknown>>; return { points: daily.map((row) => ({ date: String(row.date), contentCount: Number(row.contentCount), modelDownloads: Number(row.modelDownloads), weeklyArticles: Number(row.weeklyArticles), sourceHealth: Number(row.sourceHealth) })), topics: topics.map((row) => ({ name: String(row.name), count: Number(row.count), growth: Number(row.growth) })) }; }

export function listCollections(): BookmarkCollection[] { const collections = getLocalDatabase().prepare("SELECT id,name,description FROM collections ORDER BY CASE WHEN system_key='later' THEN 0 ELSE 1 END,created_at").all() as Array<Record<string, unknown>>; const items = getLocalDatabase().prepare("SELECT collection_id,content_id FROM collection_items").all() as Array<Record<string, unknown>>; return collections.map((collection) => ({ id: String(collection.id), name: String(collection.name), description: String(collection.description), itemIds: items.filter((item) => item.collection_id === collection.id).map((item) => String(item.content_id)) })); }
export function saveCollection(input: { id?: string; name: string; description?: string }) { const id = input.id ?? `collection-${crypto.randomUUID()}`; const now = new Date().toISOString(); getLocalDatabase().prepare("INSERT INTO collections(id,name,description,created_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,updated_at=excluded.updated_at").run(id, input.name, input.description ?? "", now, now); return listCollections().find((item) => item.id === id)!; }
export function deleteCollection(id: string) { return getLocalDatabase().prepare("DELETE FROM collections WHERE id=? AND system_key IS NULL").run(id).changes > 0; }
export function addCollectionItem(collectionId: string, contentId: string) { getLocalDatabase().prepare("INSERT OR IGNORE INTO collection_items(collection_id,content_id,added_at) VALUES(?,?,?)").run(collectionId, contentId, new Date().toISOString()); }
export function removeCollectionItem(collectionId: string, contentId: string) { getLocalDatabase().prepare("DELETE FROM collection_items WHERE collection_id=? AND content_id=?").run(collectionId, contentId); }

export function createNotification(input: { type: string; title: string; detail: string; href?: string }) { const record = { id: `notification-${crypto.randomUUID()}`, ...input, isRead: false, createdAt: new Date().toISOString() }; getLocalDatabase().prepare("INSERT INTO notifications(id,type,title,detail,href,is_read,created_at) VALUES(?,?,?,?,?,?,?)").run(record.id, record.type, record.title, record.detail, record.href ?? null, 0, record.createdAt); return record; }
export function listNotifications(limit = 30) { return (getLocalDatabase().prepare("SELECT id,type,title,detail,href,is_read,created_at FROM notifications ORDER BY created_at DESC LIMIT ?").all(limit) as Array<Record<string, unknown>>).map((row) => ({ id: String(row.id), type: String(row.type), title: String(row.title), detail: String(row.detail), href: row.href ? String(row.href) : undefined, isRead: Boolean(row.is_read), createdAt: String(row.created_at) })); }
export function markNotificationsRead(id?: string) { if (id) getLocalDatabase().prepare("UPDATE notifications SET is_read=1 WHERE id=?").run(id); else getLocalDatabase().exec("UPDATE notifications SET is_read=1"); }
export function deleteNotification(id: string) { return getLocalDatabase().prepare("DELETE FROM notifications WHERE id=?").run(id).changes > 0; }
export function setSchedulerHeartbeat(pid?: number) { getLocalDatabase().prepare("INSERT INTO scheduler_heartbeat(id,heartbeat_at,pid) VALUES(1,?,?) ON CONFLICT(id) DO UPDATE SET heartbeat_at=excluded.heartbeat_at,pid=excluded.pid").run(new Date().toISOString(), pid ?? null); }
export function getSchedulerHeartbeat() { return getLocalDatabase().prepare("SELECT heartbeat_at,pid FROM scheduler_heartbeat WHERE id=1").get() as { heartbeat_at: string; pid?: number } | undefined; }
export function getPreference<T>(key: string, fallback: T): T { const row = getLocalDatabase().prepare("SELECT value FROM preferences WHERE key=?").get(key) as { value: string } | undefined; if (!row) return fallback; try { return JSON.parse(row.value) as T; } catch { return fallback; } }
export function setPreference<T>(key: string, value: T) { getLocalDatabase().prepare("INSERT INTO preferences(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(key, JSON.stringify(value), new Date().toISOString()); return value; }
export function getLocalReadiness() {
  const database = getLocalDatabase();
  const heartbeat = getSchedulerHeartbeat();
  const lastRun = database.prepare("SELECT source_id,status,started_at,finished_at,duration_ms,error FROM ingestion_runs ORDER BY started_at DESC LIMIT 1").get();
  const migrations = database.prepare("SELECT version,applied_at FROM schema_migrations ORDER BY version").all();
  const sourceHealth = database.prepare("SELECT id,name,type,status,last_checked_at,last_successful_run_at,last_error,total_items,new_items FROM local_sources WHERE id NOT GLOB 'source-0[1-8]' ORDER BY name").all();
  const backupDir = path.join(DATA_DIR, "backups");
  const backups = existsSync(backupDir) ? readdirSync(backupDir).filter((name) => name.endsWith(".sqlite")).map((name) => ({ name, sizeBytes: statSync(path.join(backupDir, name)).size, updatedAt: statSync(path.join(backupDir, name)).mtime.toISOString() })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  const sourceFreshness = sourceHealth.map((source) => {
    const intervalMs = Math.max(1, Number(source.check_interval_minutes ?? 60)) * 60_000;
    const lastSuccessfulAt = source.last_successful_run_at ? new Date(String(source.last_successful_run_at)).getTime() : 0;
    return { ...source, freshness: lastSuccessfulAt && Date.now() - lastSuccessfulAt <= intervalMs * 1.5 ? "fresh" : "stale" };
  });
  return {
    storage: "sqlite-local", databasePath: DB_FILE, databaseSizeBytes: existsSync(DB_FILE) ? statSync(DB_FILE).size : 0,
    schemaVersion: SCHEMA_VERSION, migrations,
    contentCount: Number((database.prepare("SELECT COUNT(*) count FROM content_items").get() as { count: number }).count),
    modelCount: Number((database.prepare("SELECT COUNT(*) count FROM models").get() as { count: number }).count),
    sourceCount: Number((database.prepare("SELECT COUNT(*) count FROM local_sources WHERE id NOT GLOB 'source-0[1-8]'").get() as { count: number }).count),
    scheduler: heartbeat ? { ...heartbeat, healthy: Date.now() - new Date(heartbeat.heartbeat_at).getTime() < 120000 } : { healthy: false },
    lastRun, lastBackup: getPreference<string | null>("maintenance.lastBackup", null), backups, sourceHealth: sourceFreshness
  } as const;
}
export function refreshDashboardCache() { const database=getLocalDatabase(); const payload={ contentCount:Number((database.prepare("SELECT COUNT(*) count FROM content_items").get() as {count:number}).count), unreadCount:Number((database.prepare("SELECT COUNT(*) count FROM content_items c LEFT JOIN item_state s ON s.item_id=c.id WHERE COALESCE(s.is_read,0)=0").get() as {count:number}).count), bookmarkedCount:Number((database.prepare("SELECT COUNT(*) count FROM item_state WHERE is_bookmarked=1").get() as {count:number}).count), modelCount:Number((database.prepare("SELECT COUNT(*) count FROM models").get() as {count:number}).count), activeSourceCount:Number((database.prepare("SELECT COUNT(*) count FROM local_sources WHERE status='active'").get() as {count:number}).count), sourceCount:Number((database.prepare("SELECT COUNT(*) count FROM local_sources WHERE id NOT GLOB 'source-0[1-8]'").get() as {count:number}).count), updatedAt:new Date().toISOString() }; database.prepare("INSERT INTO dashboard_cache(key,payload,updated_at) VALUES('summary',?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at").run(JSON.stringify(payload),payload.updatedAt); return payload; }
export function getDashboardCache() { const row=getLocalDatabase().prepare("SELECT payload FROM dashboard_cache WHERE key='summary'").get() as {payload:string}|undefined; return row ? JSON.parse(row.payload) as ReturnType<typeof refreshDashboardCache> : refreshDashboardCache(); }
export function backupLocalDatabase(force = false, reason: "daily" | "manual" | "pre-restore" = force ? "manual" : "daily") {
  const last = getPreference<string | null>("maintenance.lastBackup", null);
  if (!force && last && Date.now() - new Date(last).getTime() < 86400000) return last;
  const backupDir = path.join(DATA_DIR, "backups"); mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString();
  const suffix = reason === "daily" ? stamp.slice(0, 10) : `${reason}-${stamp.replace(/[:.]/g, "-")}`;
  const target = path.join(backupDir, `savvy-${suffix}.sqlite`);
  if (!existsSync(target)) getLocalDatabase().exec(`VACUUM INTO '${target.replaceAll("'", "''")}'`);
  const sorted = (pattern: RegExp) => readdirSync(backupDir).filter((name) => pattern.test(name)).map((name) => ({ path: path.join(backupDir, name), time: statSync(path.join(backupDir, name)).mtimeMs })).sort((a, b) => b.time - a.time);
  sorted(/^savvy-\d{4}-\d{2}-\d{2}\.sqlite$/).slice(7).forEach((file) => unlinkSync(file.path));
  sorted(/^savvy-(?:manual|pre-restore)-.+\.sqlite$/).slice(20).forEach((file) => unlinkSync(file.path));
  setPreference("maintenance.lastBackup", stamp);
  return stamp;
}
