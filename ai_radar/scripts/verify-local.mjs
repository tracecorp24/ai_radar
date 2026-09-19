import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const databasePath = path.join(process.cwd(), ".data", "savvy.sqlite");
if (!existsSync(databasePath)) throw new Error("Local SQLite bulunamadı; önce uygulamayı bir kez çalıştırın.");
const database = new DatabaseSync(databasePath, { readOnly: true });
const requiredTables = ["schema_migrations", "content_items", "content_fts", "local_sources", "ingestion_runs", "trend_snapshots", "collections", "people", "person_sources", "dashboard_cache"];
const tables = new Set(database.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view')").all().map((row) => String(row.name)));
const missing = requiredTables.filter((table) => !tables.has(table));
if (missing.length) throw new Error(`Eksik tablo: ${missing.join(", ")}`);
const schemaVersion = Number(database.prepare("SELECT MAX(version) version FROM schema_migrations").get().version);
if (schemaVersion < 2) throw new Error(`Şema güncel değil: ${schemaVersion}`);
const duplicates = Number(database.prepare("SELECT COUNT(*) count FROM (SELECT source,external_id FROM content_items GROUP BY source,external_id HAVING COUNT(*)>1)").get().count);
if (duplicates) throw new Error(`${duplicates} duplicate içerik grubu bulundu.`);
database.prepare("SELECT rowid FROM content_fts WHERE content_fts MATCH 'agent*' LIMIT 1").all();
const timings = [];
for (let index = 0; index < 100; index += 1) { const start = performance.now(); database.prepare("SELECT id,title,published_at FROM content_items ORDER BY trend_score DESC,published_at DESC LIMIT 24").all(); timings.push(performance.now() - start); }
timings.sort((a, b) => a - b);
const p95 = timings[Math.ceil(timings.length * 0.95) - 1];
if (p95 >= 50) throw new Error(`SQLite sorgu p95 bütçeyi aştı: ${p95.toFixed(2)}ms`);
const counts = database.prepare("SELECT (SELECT COUNT(*) FROM content_items) content,(SELECT COUNT(*) FROM models) models,(SELECT COUNT(*) FROM local_sources WHERE id NOT GLOB 'source-0[1-8]') sources").get();
database.close();
console.log(JSON.stringify({ ok: true, schemaVersion, duplicates, queryP95Ms: Number(p95.toFixed(2)), counts }, null, 2));
