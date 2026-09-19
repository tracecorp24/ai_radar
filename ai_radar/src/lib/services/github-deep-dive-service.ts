import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ContentItem, RelatedRepository, RepositoryDocument } from "@/types";

type GithubRepository = { full_name?: string; description?: string; html_url?: string; stargazers_count?: number; topics?: string[]; language?: string; license?: { spdx_id?: string }; default_branch?: string };

function repositoryPath(url: string) {
  const match = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)\/?$/i);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

async function githubJson<T>(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json", "User-Agent": "SavvyResearchDashboard" }, signal: AbortSignal.timeout(20000), next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(response.status === 403 ? "GitHub arama kotası dolu; birkaç dakika sonra tekrar deneyin." : `GitHub isteği başarısız (${response.status}).`);
  return response.json() as Promise<T>;
}

function relatedReason(repo: GithubRepository, selected: ContentItem) {
  const shared = (repo.topics ?? []).filter((topic) => selected.tags.map((tag) => tag.toLowerCase()).includes(topic.toLowerCase()));
  return shared.length ? `Ortak konular: ${shared.slice(0, 3).join(", ")}` : "Aynı teknoloji alanındaki GitHub arama sonucu.";
}

export async function createGithubDeepDive(item: ContentItem): Promise<RepositoryDocument> {
  const repo = repositoryPath(item.url);
  if (!repo || item.source !== "github") throw new Error("GitHub Deep Dive yalnızca geçerli GitHub depo bağlantıları için kullanılabilir.");
  const [metadata, readmeResponse] = await Promise.all([
    githubJson<GithubRepository>(`https://api.github.com/repos/${repo}`),
    fetch(`https://api.github.com/repos/${repo}/readme`, { headers: { Accept: "application/vnd.github.raw+json", "User-Agent": "SavvyResearchDashboard" }, signal: AbortSignal.timeout(20000), next: { revalidate: 3600 } })
  ]);
  const readme = readmeResponse.ok ? await readmeResponse.text() : `# ${metadata.full_name ?? item.title}\n\n${metadata.description ?? item.summary}\n`;
  const keywords = [...item.tags, ...item.title.split(/[\s/_-]+/)].filter((value) => value.length > 2).slice(0, 4);
  const search = await githubJson<{ items?: GithubRepository[] }>(`https://api.github.com/search/repositories?q=${encodeURIComponent(keywords.join(" ") || "artificial intelligence")}+in:name,description,topics&sort=stars&order=desc&per_page=8`);
  const relatedRepositories: RelatedRepository[] = (search.items ?? []).filter((candidate) => candidate.full_name && candidate.full_name.toLowerCase() !== repo.toLowerCase() && candidate.html_url).slice(0, 5).map((candidate) => ({ fullName: candidate.full_name!, description: candidate.description, url: candidate.html_url!, stars: candidate.stargazers_count ?? 0, topics: candidate.topics ?? [], reason: relatedReason(candidate, item) }));
  const dir = path.join(process.cwd(), ".data", "repositories", encodeURIComponent(item.id));
  await mkdir(dir, { recursive: true });
  const readmePath = path.join(dir, "README.md");
  await writeFile(readmePath, readme, "utf8");
  return { status: "ready", readmePath, parsedAt: new Date().toISOString(), language: metadata.language, stars: metadata.stargazers_count, license: metadata.license?.spdx_id, relatedRepositories };
}
