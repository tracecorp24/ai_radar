import { addCollectionItem, backupLocalDatabase, saveCollection, saveLocalSource, setPreference, upsertContent, upsertModel, upsertPerson } from "@/lib/local-db";
import type { BookmarkCollection, ContentItem, ModelItem, PersonItem, SourceStatus } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > 50_000_000) return NextResponse.json({ error: { code: "INVALID_BACKUP", message: "50 MB’den küçük bir Savvy JSON yedeği gerekli." } }, { status: 400 });
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(await file.text()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: { code: "INVALID_JSON", message: "Yedek dosyası geçerli JSON değil." } }, { status: 400 }); }
  if (payload.version !== 1 || !Array.isArray(payload.content)) return NextResponse.json({ error: { code: "UNSUPPORTED_BACKUP", message: "Desteklenmeyen Savvy yedek formatı." } }, { status: 400 });
  backupLocalDatabase(true, "pre-restore");
  (payload.content as ContentItem[]).forEach(upsertContent);
  if (Array.isArray(payload.models)) (payload.models as ModelItem[]).forEach(upsertModel);
  if (Array.isArray(payload.people)) (payload.people as PersonItem[]).forEach(upsertPerson);
  if (Array.isArray(payload.sources)) (payload.sources as SourceStatus[]).forEach((source) => saveLocalSource(source as unknown as Record<string, unknown>));
  if (Array.isArray(payload.collections)) (payload.collections as BookmarkCollection[]).forEach((collection) => { saveCollection(collection); collection.itemIds.forEach((contentId) => addCollectionItem(collection.id, contentId)); });
  if (payload.settings && typeof payload.settings === "object") setPreference("settings", payload.settings);
  return NextResponse.json({ data: { content: payload.content.length, models: Array.isArray(payload.models) ? payload.models.length : 0, people: Array.isArray(payload.people) ? payload.people.length : 0 } });
}
