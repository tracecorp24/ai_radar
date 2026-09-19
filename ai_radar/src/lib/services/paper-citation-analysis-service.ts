import type { CitationTreeNode, ContentItem, PaperCitationAnalysis, PaperLinkedResource, PaperQuestionAnswer } from "@/types";
import { getLlmConfig, requestLlm } from "@/lib/llm/client";
import { getPreference, setPreference } from "@/lib/local-db";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

type SemanticPaper = {
  paperId?: string;
  title?: string;
  abstract?: string;
  year?: number;
  url?: string;
  externalIds?: Record<string, string>;
  authors?: Array<{ name?: string }>;
  references?: Array<{ paperId?: string; title?: string; abstract?: string; year?: number; url?: string; authors?: Array<{ name?: string }>; contexts?: string[]; intents?: string[] }>;
};

const fields = "title,abstract,year,url,externalIds,authors,references.paperId,references.title,references.abstract,references.year,references.url,references.authors,references.contexts,references.intents";
const stopWords = new Set(["and", "the", "for", "with", "from", "that", "this", "into", "using", "based", "are", "was", "your", "bir", "ile", "için", "olarak", "üzerine", "ve", "bu", "the"]);

function shortText(value?: string, limit = 230) {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";
  return normalized.length > limit ? `${normalized.slice(0, limit).trimEnd()}…` : normalized;
}

function keywordsFor(item: Pick<ContentItem, "title" | "summary" | "tags">) {
  const words = `${item.title} ${item.summary}`.toLocaleLowerCase("tr-TR").match(/[\p{L}\p{N}+-]{4,}/gu) ?? [];
  const ranked = [...item.tags, ...words].filter((word, index, values) => !stopWords.has(word.toLowerCase()) && values.findIndex((value) => value.toLowerCase() === word.toLowerCase()) === index);
  return ranked.slice(0, 8);
}

function technologiesFor(item: Pick<ContentItem, "title" | "summary" | "tags">, keywords: string[]) {
  const corpus = `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLowerCase();
  const known = ["LLM", "RAG", "Transformer", "MCP", "API", "Vector database", "Retrieval", "Agent", "Multimodal", "Fine-tuning", "Benchmark"].filter((technology) => corpus.includes(technology.toLowerCase()));
  return [...new Set([...known, ...keywords.filter((word) => /ai|llm|rag|model|agent|memory|retrieval/i.test(word))])].slice(0, 6);
}

function evidence(text: string | undefined, terms: string[], fallback: string) {
  const normalized = text?.replace(/\s+/g, " ").trim() ?? "";
  const sentence = normalized.split(/(?<=[.!?])\s+/).find((value) => terms.some((term) => value.toLowerCase().includes(term)) && value.length > 60);
  return shortText(sentence ?? fallback, 430);
}

async function localMarkdown(item: ContentItem) {
  const markdownPath = item.paperDocument?.markdownPath;
  if (item.paperDocument?.status !== "ready" || !markdownPath) return undefined;
  const papersDir = path.resolve(process.cwd(), ".data", "papers");
  if (!path.resolve(markdownPath).startsWith(`${papersDir}${path.sep}`)) return undefined;
  return readFile(markdownPath, "utf8").catch(() => undefined);
}

function linkedResourceUrl(value: string, item: ContentItem) {
  const directUrl = value.match(/https?:\/\/[^\s)\]}]+/i)?.[0]?.replace(/[.,;:]$/, "");
  if (directUrl) return directUrl;
  const doi = value.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i)?.[0]?.replace(/[.,;:]$/, "");
  if (doi) return `https://doi.org/${doi}`;
  const arxivId = value.match(/arxiv\s*:\s*([\d.]+(?:v\d+)?)/i)?.[1];
  if (arxivId) return `https://arxiv.org/abs/${arxivId}`;
  return `https://www.semanticscholar.org/search?q=${encodeURIComponent(value.slice(0, 240) || item.title)}`;
}

function bibtexBibliography(value: string, item: ContentItem): PaperLinkedResource[] {
  return value.split(/\n(?=@[a-z]+\s*\{)/i).map((record): PaperLinkedResource | undefined => {
    const field = (name: string) => record.match(new RegExp(`${name}\\s*=\\s*[{\"]([^}\"]+)`, "i"))?.[1]?.replace(/\s+/g, " ").trim();
    const title = field("title");
    if (!title) return undefined;
    const detail = [field("author")?.replace(/\s+and\s+/gi, ", "), field("year")].filter(Boolean).join(" · ");
    return { title, url: linkedResourceUrl(`${title} ${field("year") ?? ""}`, item), detail: detail || "TeX kaynakçası" };
  }).filter((entry): entry is PaperLinkedResource => entry !== undefined);
}

async function localTexBibliography(item: ContentItem) {
  const archivePath = item.paperDocument?.texArchivePath;
  if (item.paperDocument?.sourceKind !== "tex" || !archivePath) return [] as PaperLinkedResource[];
  const papersDir = path.resolve(process.cwd(), ".data", "papers");
  const sourceDir = path.resolve(path.dirname(archivePath), "source");
  if (!sourceDir.startsWith(`${papersDir}${path.sep}`)) return [] as PaperLinkedResource[];
  const entries = await readdir(sourceDir, { recursive: true }).catch(() => [] as string[]);
  const files = entries.filter((entry) => entry.toLocaleLowerCase("en").endsWith(".bib")).slice(0, 20);
  const references = await Promise.all(files.map(async (file) => bibtexBibliography(await readFile(path.join(sourceDir, file), "utf8").catch(() => ""), item)));
  return references.flat();
}

async function localDocumentResources(markdown: string | undefined, item: ContentItem) {
  const lines = markdown?.split("\n") ?? [];
  let page: number | undefined;
  let inReferences = false;
  const bibliography: PaperLinkedResource[] = [];
  const appendices: PaperLinkedResource[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const pageMatch = line.match(/^<!--\s*page:(\d+)\s*-->$/i);
    if (pageMatch) { page = Number(pageMatch[1]); continue; }
    const heading = line.replace(/^#{1,6}\s+/, "").trim();
    if (/^(references|bibliography|kaynakça|kaynaklar)$/i.test(heading)) { inReferences = true; continue; }
    if (/^(appendix|appendices|ekler?|ek\s+[a-z0-9])(?:\s|:|$)/i.test(heading) && !/^ekler$/i.test(heading)) {
      if (!appendices.some((entry) => entry.title === heading)) appendices.push({ title: heading, page, detail: page ? `PDF sayfa ${page}` : "PDF ek bölümü", url: `${item.arxiv?.pdfUrl ?? item.url}${page ? `#page=${page}` : ""}` });
      inReferences = false;
      continue;
    }
    if (inReferences && /^(?:\[\d+\]|\d+\.|[-*])\s+/.test(line) && bibliography.length < 80) {
      bibliography.push({ title: line.slice(0, 360), url: linkedResourceUrl(line, item), detail: "Makale kaynakçası" });
    }
  }
  const texBibliography = await localTexBibliography(item);
  return { bibliography: [...bibliography, ...texBibliography].filter((entry, index, entries) => entries.findIndex((candidate) => candidate.title.toLocaleLowerCase() === entry.title.toLocaleLowerCase()) === index), appendices };
}

export const PAPER_RESEARCH_QUESTIONS = [
  "Makalenin çözmeye çalıştığı temel problem nedir?",
  "Yazarların ana tezi ve özgün katkısı nedir?",
  "Çalışmanın kapsamı, varsayımları ve kapsam dışı bıraktığı durumlar nelerdir?",
  "Önerilen yöntem veya sistem mimarisi nasıl çalışır?",
  "Hangi veri kümeleri, girdiler ve ön işleme adımları kullanılmıştır?",
  "Deney düzeni, karşılaştırma tabanları ve başarı metrikleri nelerdir?",
  "En önemli nicel ve nitel bulgular nelerdir?",
  "Yaklaşım önceki çalışmalardan hangi yönleriyle ayrılır?",
  "Sınırlamalar, hata türleri, riskler ve genellenebilirlik sorunları nelerdir?",
  "Bu çalışmanın pratik kullanım alanları ve en mantıklı sonraki araştırma adımları nelerdir?"
] as const;

function rootQuestions(item: ContentItem, keywords: string[], technologies: string[], markdown?: string): PaperQuestionAnswer[] {
  const focus = keywords.slice(0, 3).join(", ") || "çalışmanın ana konusu";
  const tech = technologies.join(", ") || "makalede belirtilen yöntemler";
  const overview = evidence(markdown, ["abstract", "introduction", "problem", "challenge"], item.summary);
  return [
    [PAPER_RESEARCH_QUESTIONS[0], overview],
    [PAPER_RESEARCH_QUESTIONS[1], evidence(markdown, ["we propose", "we present", "contribution", "approach"], `${item.title}, ${focus} için bir yaklaşım veya çerçeve öneriyor.`)],
    [PAPER_RESEARCH_QUESTIONS[2], evidence(markdown, ["assume", "setting", "scope", "limitation"], "Kapsam, makalenin tanımladığı görev, veri ve değerlendirme koşullarıyla sınırlıdır.")],
    [PAPER_RESEARCH_QUESTIONS[3], evidence(markdown, ["method", "architecture", "pipeline", "framework"], `Önerilen yöntemin çekirdeği ${tech} etrafında şekilleniyor.`)],
    [PAPER_RESEARCH_QUESTIONS[4], evidence(markdown, ["input", "dataset", "data", "output"], "Makale, tanımlanan görev verisini işleyip ölçülebilir bir çıktı veya karar üretmeyi hedefliyor.")],
    [PAPER_RESEARCH_QUESTIONS[5], evidence(markdown, ["experiment", "benchmark", "baseline", "metric", "evaluation"], "Başarı; deneyler, ilgili karşılaştırmalar ve makalenin seçtiği metriklerle değerlendirilmelidir.")],
    [PAPER_RESEARCH_QUESTIONS[6], evidence(markdown, ["result", "improve", "outperform", "performance"], "Bulguların gücü, bildirilen metrikler ve karşılaştırma sonuçları üzerinden okunmalıdır.")],
    [PAPER_RESEARCH_QUESTIONS[7], evidence(markdown, ["novel", "unlike", "previous", "prior work"], `${focus} alanında önceki yaklaşımlardan ayrışan bir yöntem veya değerlendirme bakışı sunuyor.`)],
    [PAPER_RESEARCH_QUESTIONS[8], evidence(markdown, ["limitation", "failure", "challenge", "future work"], "Sınırlamalar; veri çeşitliliği, deney kapsamı ve farklı koşullara genellenebilirlik açısından değerlendirilmelidir.")],
    [PAPER_RESEARCH_QUESTIONS[9], `${focus} alanında çalışan ekipler için bu yaklaşım, çözüm tasarımı ve değerlendirme kararlarını etkileyebilecek bir referans noktasıdır.`]
  ].map(([question, answer]) => ({ question, answer }));
}

async function aiRootQuestions(item: ContentItem, markdown: string | undefined, fallback: PaperQuestionAnswer[]) {
  const source = (markdown ?? item.originalContent ?? item.summary).replace(/\s+/g, " ").slice(0, 14_000);
  try {
    const result = await requestLlm(
      `Aşağıdaki araştırma makalesini, verilen sabit 10 sorunun her birini yanıtlayarak analiz et. Soruları değiştirme veya atlama. Yalnızca {"answers":[{"id":1,"answer":"..."}]} biçiminde geçerli JSON döndür. Her cevap makaledeki kanıta dayansın; bilgi yoksa açıkça belirt.\n\nSorular:\n${PAPER_RESEARCH_QUESTIONS.map((question, index) => `${index + 1}. ${question}`).join("\n")}\n\nBaşlık: ${item.title}\nEtiketler: ${item.tags.join(", ")}\nMetin: ${source}`,
      { system: "Sen teknik araştırma makalelerini eleştirel inceleyen kıdemli bir AI araştırma analistisin.", maxTokens: 1_800 }
    );
    const json = result.content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(json) as { answers?: Array<{ id?: unknown; answer?: unknown }> };
    const answers = new Map((parsed.answers ?? []).filter((entry): entry is { id: number; answer: string } => Number.isInteger(entry.id) && typeof entry.answer === "string").map((entry) => [entry.id, entry.answer]));
    if (answers.size < 7) return { questions: fallback, source: "fallback" as const };
    return { questions: PAPER_RESEARCH_QUESTIONS.map((question, index) => ({ question, answer: answers.get(index + 1) ?? fallback[index].answer })), source: "ai" as const, model: result.model };
  } catch {
    return { questions: fallback, source: "fallback" as const };
  }
}

function referenceQuestions(paper: { title?: string; abstract?: string; year?: number }): PaperQuestionAnswer[] {
  const summary = shortText(paper.abstract) || "Özet bilgisi kaynak servisinde bulunmuyor.";
  return [
    { question: "Bu referansın temel konusu nedir?", answer: summary },
    { question: "Ana makale bunu neden kullanıyor?", answer: "Ana makaledeki kavramı, yöntemi veya önceki bulguyu temellendirmek için atıf yapılıyor." },
    { question: "Hangi döneme ait bir temel sağlıyor?", answer: paper.year ? `${paper.year} tarihli çalışma, alanın önceki bilgi birikimini temsil ediyor.` : "Yayın yılı kaynak servisinde belirtilmemiş." },
    { question: "İncelerken nelere bakılmalı?", answer: "Yöntem, veri/deney düzeni, bulgular ve ana makaleyle kurduğu doğrudan ilişki karşılaştırılmalı." }
  ];
}

function reasonFor(reference: NonNullable<SemanticPaper["references"]>[number]) {
  const intent = reference.intents?.[0];
  const context = shortText(reference.contexts?.[0]);
  const relation = intent ? `${intent.toLowerCase()} amaçlı` : "önceki çalışma veya yöntem desteği için";
  return context ? `Bu kaynak ${relation} kullanılmış: “${context}”` : `Bu kaynak, ana makaledeki ilgili kavramı veya yöntemi desteklemek üzere ${relation} atıf almış.`;
}

function toNode(reference: NonNullable<SemanticPaper["references"]>[number], children: CitationTreeNode[] = []): CitationTreeNode {
  return {
    id: reference.paperId ?? `${reference.title}-${reference.year ?? ""}`,
    title: reference.title ?? "Başlığı alınamayan referans",
    authors: reference.authors?.map((author) => author.name).filter((name): name is string => Boolean(name)) ?? [],
    year: reference.year,
    abstract: reference.abstract,
    url: reference.url,
    citationReason: reasonFor(reference),
    citedIn: shortText(reference.contexts?.[0]),
    questions: referenceQuestions(reference),
    children
  };
}

function localCitationNodes(entries: PaperLinkedResource[]): CitationTreeNode[] {
  return entries.slice(0, 12).map((entry, index) => ({
    id: `local-reference-${index}-${entry.title.slice(0, 48)}`,
    title: entry.title.replace(/^[-*]\s+/, ""),
    authors: [],
    url: entry.url,
    citationReason: "Yerel TeX/PDF kaynakçasından ayrıştırıldı.",
    questions: [{ question: "Bu kaynak neden listeleniyor?", answer: entry.detail ?? "Ana makalenin kaynakçasında yer alıyor." }],
    children: []
  }));
}

async function semanticFetch(path: string): Promise<SemanticPaper | undefined> {
  const response = await fetch(`https://api.semanticscholar.org/graph/v1/${path}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } });
  if (!response.ok) return undefined;
  return response.json() as Promise<SemanticPaper>;
}

async function resolvePaper(item: ContentItem) {
  const arxivId = item.externalId.replace(/^arxiv:/i, "").replace(/v\d+$/i, "");
  if (item.source === "arxiv" && arxivId) return semanticFetch(`paper/ARXIV:${encodeURIComponent(arxivId)}?fields=${fields}`);
  const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(item.title)}&limit=1&fields=${fields}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000), next: { revalidate: 86400 } });
  if (!response.ok) return undefined;
  const body = await response.json() as { data?: SemanticPaper[] };
  return body.data?.[0];
}

export async function analyzePaperCitations(item: ContentItem, force = false): Promise<PaperCitationAnalysis> {
  const keywords = keywordsFor(item);
  const technologies = technologiesFor(item, keywords);
  const markdown = await localMarkdown(item);
  const fingerprint = `${item.paperDocument?.parsedAt ?? "summary"}:${item.summary.length}:${getLlmConfig().model}`;
  const cacheKey = `paper.ai-analysis.${item.id}`;
  const cached = getPreference<{ fingerprint: string; analysis?: PaperCitationAnalysis } | null>(cacheKey, null);
  if (!force && cached?.fingerprint === fingerprint && cached.analysis?.answerSource === "ai") return cached.analysis;
  const localResources = await localDocumentResources(markdown, item);
  const deterministicQuestions = rootQuestions(item, keywords, technologies, markdown);
  const aiAnswers = await aiRootQuestions(item, markdown, deterministicQuestions);
  const base = { keywords, technologies, questions: aiAnswers.questions, answerSource: aiAnswers.source, answerModel: aiAnswers.model, ...localResources, generatedAt: new Date().toISOString() };
  const finish = (analysis: PaperCitationAnalysis) => { if (analysis.answerSource === "ai") setPreference(cacheKey, { fingerprint, analysis }); return analysis; };
  try {
    const paper = await resolvePaper(item);
    const references = (paper?.references ?? []).filter((reference) => reference.paperId && reference.title).slice(0, 4);
    const citations = await Promise.all(references.map(async (reference) => {
      const childPaper = reference.paperId ? await semanticFetch(`paper/${reference.paperId}?fields=${fields}`) : undefined;
      const children = (childPaper?.references ?? []).filter((child) => child.paperId && child.title).slice(0, 3).map((child) => toNode(child));
      return toNode(reference, children);
    }));
    const bibliography = [...citations.map((citation) => ({ title: citation.title, url: citation.url ?? linkedResourceUrl(citation.title, item), detail: [citation.authors.slice(0, 2).join(", "), citation.year].filter(Boolean).join(" · ") || "Atıf verilen çalışma" })), ...localResources.bibliography].filter((entry, index, entries) => entries.findIndex((candidate) => candidate.title.toLocaleLowerCase() === entry.title.toLocaleLowerCase()) === index);
    return finish({ ...base, bibliography, citations: citations.length ? citations : localCitationNodes(localResources.bibliography), source: citations.length ? "semantic-scholar" : "local" });
  } catch {
    return finish({ ...base, citations: localCitationNodes(localResources.bibliography), source: "local" });
  }
}
