import type { ArxivPaper } from "@/lib/adapters/arxiv-adapter";

const API_URL = "https://export.arxiv.org/api/query";

function decodeXml(value: string) {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}(?: [^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return match ? decodeXml(match[1]) : "";
}

function parseEntry(block: string): ArxivPaper | null {
  const id = tag(block, "id");
  if (!id) return null;
  const absUrl = id.replace("http://", "https://");
  const version = absUrl.match(/v(\d+)$/)?.[1];
  const cleanId = absUrl.replace(/v\d+$/, "");
  const arxivId = cleanId.split("/abs/")[1] ?? cleanId;
  const htmlUrl = cleanId.replace("https://arxiv.org/abs/", "https://arxiv.org/html/");
  return {
    id: arxivId,
    title: tag(block, "title").replace(/\s+/g, " "),
    abstract: tag(block, "summary").replace(/\s+/g, " "),
    url: cleanId,
    authors: [...block.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi)].map((match) => decodeXml(match[1])),
    publishedAt: tag(block, "published"),
    categories: [...block.matchAll(/<category[^>]*term="([^"]+)"/gi)].map((match) => match[1]),
    pdfUrl: `https://arxiv.org/pdf/${cleanId.split("/abs/")[1]}.pdf`,
    htmlUrl,
    texUrl: `https://arxiv.org/e-print/${cleanId.split("/abs/")[1]}`,
    version
  };
}

export async function searchArxiv({ query = "cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:stat.ML", start = 0, max = 1000 }: { query?: string; start?: number; max?: number } = {}) {
  const url = new URL(API_URL);
  url.searchParams.set("search_query", query);
  url.searchParams.set("start", String(start));
  url.searchParams.set("max_results", String(Math.min(max, 1000)));
  url.searchParams.set("sortBy", "submittedDate");
  url.searchParams.set("sortOrder", "descending");
  const response = await fetch(url, { headers: { Accept: "application/atom+xml", "User-Agent": "SavvyResearchDashboard/0.11" }, signal: AbortSignal.timeout(60_000), next: { revalidate: 900 } });
  if (!response.ok) throw new Error(`arXiv API ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => parseEntry(match[1])).filter((paper): paper is ArxivPaper => Boolean(paper));
}

export function arxivQueryFromText(query: string, periodDays?: number) {
  const value = query.trim();
  const topic = value ? `all:"${value.replace(/"/g, "")}"` : "(cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:stat.ML)";
  if (!periodDays) return value ? `${topic} AND (cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:stat.ML)` : topic;
  const from = new Date(Date.now() - periodDays * 86_400_000).toISOString().replace(/[-:T]/g, "").slice(0, 12);
  const to = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
  return `${topic} AND submittedDate:[${from} TO ${to}]`;
}

export function arxivQueryFromTopics(topics: string[], periodDays: number) {
  const cleaned = topics.map((topic) => topic.replace(/"/g, "").trim()).filter(Boolean).slice(0, 5);
  const topicQuery = cleaned.length ? `(${cleaned.map((topic) => `all:"${topic}"`).join(" OR ")})` : "(cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.CV OR cat:stat.ML)";
  const from = new Date(Date.now() - periodDays * 86_400_000).toISOString().replace(/[-:T]/g, "").slice(0, 12);
  const to = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
  return `${topicQuery} AND submittedDate:[${from} TO ${to}]`;
}
