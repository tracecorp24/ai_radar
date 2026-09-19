import { listModels, listPeople, searchContent } from "@/lib/local-db";
import { getSources } from "@/lib/services/source-service";

export type SearchCategory = "İçerikler" | "Modeller" | "Kişiler" | "Kaynaklar" | "Etiketler";
export interface SearchItem { id: string; category: SearchCategory; title: string; subtitle: string; href: string; keywords: string[]; }

export async function getSearchIndex(query = "", limit = 40): Promise<SearchItem[]> {
  const needle = query.trim().toLowerCase();
  const matches = (values: string[]) => !needle || values.join(" ").toLowerCase().includes(needle);
  const content = searchContent(query, limit).map<SearchItem>((item) => ({ id: item.id, category: "İçerikler", title: item.title, subtitle: `${item.source} · ${item.type} · ${item.summary}`, href: `/content/${item.id}`, keywords: [item.title,item.summary,...item.tags] }));
  const models = listModels().filter((item) => matches([item.name,item.modelId,item.organization,item.description,...item.tags])).slice(0, limit).map<SearchItem>((item) => ({ id: item.id, category: "Modeller", title: item.name, subtitle: `${item.organization} · ${item.pipeline ?? "pipeline bilinmiyor"}`, href: `/models/${item.id}`, keywords: [item.name,item.modelId,item.organization,...item.tags] }));
  const people = listPeople().filter((item) => matches([item.name,item.role,item.organization ?? "",...item.topics])).slice(0, limit).map<SearchItem>((item) => ({ id: item.id, category: "Kişiler", title: item.name, subtitle: `${item.role} · ${item.organization ?? "Bağımsız"}`, href: `/people/${item.id}`, keywords: [item.name,item.role,...item.topics] }));
  const sources = (await getSources()).filter((item) => matches([item.name,item.type,item.url ?? ""])).slice(0, limit).map<SearchItem>((item) => ({ id: item.id, category: "Kaynaklar", title: item.name, subtitle: `${item.type} · ${item.status}`, href: "/sources", keywords: [item.name,item.type,item.url ?? ""] }));
  const tags = [...new Set(searchContent(query, 100).flatMap((item) => item.tags))].filter((tag) => !needle || tag.toLowerCase().includes(needle)).slice(0, 12).map<SearchItem>((tag) => ({ id: `tag-${tag}`, category: "Etiketler", title: tag, subtitle: "İlgili içerikleri keşfet", href: `/research?tag=${encodeURIComponent(tag)}`, keywords: [tag] }));
  return [...content,...models,...people,...sources,...tags].slice(0, limit);
}
