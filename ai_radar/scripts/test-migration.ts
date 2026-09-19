import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";

const testBase = path.join(process.cwd(), ".data", "test-tmp");
mkdirSync(testBase, { recursive: true });
const temporaryRoot = mkdtempSync(path.join(testBase, "savvy-migration-"));
process.env.SAVVY_DATA_DIR = temporaryRoot;
let closeDatabase: (() => void) | undefined;
try {
  const modulePath = "../src/lib/local-db.ts";
  const { closeLocalDatabase, getLocalDatabase, getLocalReadiness, saveLocalSource, upsertContent } = await import(modulePath);
  closeDatabase = closeLocalDatabase;
  const database = getLocalDatabase();
  assert.equal(getLocalReadiness().schemaVersion, 3);
  const columns = new Set(database.prepare("PRAGMA table_info(local_sources)").all().map((row) => String(row.name)));
  for (const column of ["name", "type", "status", "etag", "last_modified"]) assert.ok(columns.has(column), `missing ${column}`);
  assert.ok(database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='content_embeddings'").get(), "missing content_embeddings table");
  saveLocalSource({ id: "migration-source", name: "Migration", type: "rss", status: "waiting", totalItems: 0, newItems: 0, checkIntervalMinutes: 60 });
  const item = { id: "migration-item", source: "rss" as const, type: "article" as const, externalId: "same-id", title: "Migration test", summary: "Deterministic migration test record", url: "https://example.com/item?utm_source=test", authors: ["Test"], publishedAt: new Date().toISOString(), firstSeenAt: new Date().toISOString(), tags: ["migration"], relevanceScore: 50, noveltyScore: 50, isBookmarked: false, isRead: false };
  assert.equal(upsertContent(item).created, true);
  assert.equal(upsertContent({ ...item, title: "Migration test updated" }).created, false);
  assert.equal(Number(database.prepare("SELECT COUNT(*) count FROM content_items").get()!.count), 1);
  assert.equal(database.prepare("SELECT rowid FROM content_fts WHERE content_fts MATCH 'Migration*'").all().length, 1);
  closeLocalDatabase();
  closeDatabase = undefined;
  assert.ok(existsSync(path.join(temporaryRoot, "savvy.sqlite")));
  console.log("migration-test-ok");
} finally {
  closeDatabase?.();
  const resolved = path.resolve(temporaryRoot);
  const allowedPrefix = path.resolve(testBase) + path.sep;
  if (!resolved.startsWith(allowedPrefix) || !path.basename(resolved).startsWith("savvy-migration-")) throw new Error("Unsafe migration temp path");
  rmSync(resolved, { recursive: true, force: false, maxRetries: 5, retryDelay: 100 });
}
