import { PDFParse } from "pdf-parse";
import { getData as getPdfWorkerData } from "pdf-parse/worker";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import type { ContentItem, PaperCitationLocation, PaperDocument } from "@/types";

const MAX_PDF_BYTES = 75 * 1024 * 1024;

PDFParse.setWorker(getPdfWorkerData());
const MAX_TEX_ARCHIVE_BYTES = 40 * 1024 * 1024;
const MAX_TEX_EXPANDED_BYTES = 100 * 1024 * 1024;
const MAX_TEX_FILES = 600;
const TEXT_SOURCE_EXTENSIONS = new Set([".tex", ".bib", ".bbl", ".sty", ".cls", ".bst", ".txt"]);

function normalizeText(value: string) {
  return value.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function headingIndex(lines: string[], pattern: RegExp) {
  return lines.findIndex((line) => pattern.test(line.trim()));
}

function citationLocations(markdown: string): PaperCitationLocation[] {
  const lines = markdown.split("\n");
  const found: PaperCitationLocation[] = [];
  const marker = /\[(?:\d+(?:\s*[,;]\s*\d+|\s*[-–]\s*\d+)*)\]|\([A-Z][A-Za-z'’-]+(?:\s+et al\.)?(?:,\s*\d{4}[a-z]?)?\)/g;
  lines.forEach((line, index) => {
    for (const match of line.matchAll(marker)) {
      found.push({ marker: match[0], line: index + 1, excerpt: line.trim().slice(0, 320) });
      if (found.length >= 200) return;
    }
  });
  return found;
}

function referencesFrom(text: string) {
  return text.split("\n").map((line) => line.trim()).filter((line) => /^(?:\[\d+\]|\d+\.|[-*])\s+/.test(line)).slice(0, 500);
}

function documentDirectory(paper: ContentItem) {
  return path.join(process.cwd(), ".data", "papers", encodeURIComponent(paper.id));
}

function validArxivUrl(value: string | undefined) {
  if (!value) return false;
  try { return new URL(value).protocol === "https:" && new URL(value).hostname === "arxiv.org"; }
  catch { return false; }
}

async function fetchBounded(url: string, limit: number, label: string) {
  const response = await fetch(url, { headers: { "User-Agent": "SavvyResearchDashboard/1.0" }, signal: AbortSignal.timeout(60_000), cache: "no-store" });
  if (!response.ok) throw new Error(`${label} indirilemedi (${response.status}).`);
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > limit) throw new Error(`${label} boyut sınırını aşıyor.`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > limit) throw new Error(`${label} boyut sınırını aşıyor.`);
  return buffer;
}

function safeArchivePath(value: string) {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!normalized || normalized.startsWith("/") || normalized.split("/").some((part) => !part || part === "." || part === "..") || normalized.includes("\0")) return undefined;
  return normalized;
}

function tarEntries(buffer: Buffer) {
  const files = new Map<string, Buffer>();
  let offset = 0;
  let expanded = 0;
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) break;
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const prefix = header.subarray(345, 500).toString("utf8").replace(/\0.*$/, "");
    const sizeText = header.subarray(124, 136).toString("ascii").replace(/\0.*$/, "").trim();
    const size = Number.parseInt(sizeText || "0", 8);
    const type = String.fromCharCode(header[156] || 0);
    if (!Number.isFinite(size) || size < 0 || offset + 512 + size > buffer.length) throw new Error("TeX arşivi bozuk görünüyor.");
    const entryName = safeArchivePath(prefix ? `${prefix}/${name}` : name);
    if ((type === "0" || type === "\0") && entryName) {
      expanded += size;
      if (expanded > MAX_TEX_EXPANDED_BYTES || files.size >= MAX_TEX_FILES) throw new Error("TeX arşivi güvenli işleme sınırını aşıyor.");
      const extension = path.posix.extname(entryName).toLocaleLowerCase("en");
      if (TEXT_SOURCE_EXTENSIONS.has(extension)) files.set(entryName, Buffer.from(buffer.subarray(offset + 512, offset + 512 + size)));
    }
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

function sourceFilesFromArchive(buffer: Buffer) {
  const unpacked = buffer[0] === 0x1f && buffer[1] === 0x8b ? gunzipSync(buffer, { maxOutputLength: MAX_TEX_EXPANDED_BYTES }) : buffer;
  const files = tarEntries(unpacked);
  if (files.size) return files;
  const text = buffer.toString("utf8");
  if (/\\documentclass\b/.test(text)) return new Map([["main.tex", buffer]]);
  throw new Error("TeX kaynağında güvenli biçimde işlenebilir dosya bulunamadı.");
}

function texText(value: Buffer) {
  return value.toString("utf8").replace(/^\uFEFF/, "");
}

function findMainTex(files: Map<string, Buffer>) {
  const candidates = [...files.entries()].filter(([name]) => name.toLocaleLowerCase("en").endsWith(".tex"));
  const main = candidates.sort(([leftName, left], [rightName, right]) => {
    const score = (name: string, value: Buffer) => (name.toLocaleLowerCase("en").endsWith("main.tex") ? 30 : 0) + (/\\documentclass\b/.test(texText(value)) ? 100 : 0) + (name.split("/").length === 1 ? 5 : 0);
    return score(rightName, right) - score(leftName, left);
  })[0];
  if (!main) throw new Error("TeX arşivinde ana .tex dosyası bulunamadı.");
  return main[0];
}

function resolveTexFile(baseFile: string, requested: string, files: Map<string, Buffer>) {
  const clean = requested.trim().replaceAll("\\", "/");
  if (!clean || clean.startsWith("/") || clean.includes("..")) return undefined;
  const base = path.posix.dirname(baseFile);
  const candidate = path.posix.normalize(path.posix.join(base, clean));
  return [candidate, `${candidate}.tex`].find((name) => files.has(name));
}

function combineTex(mainFile: string, files: Map<string, Buffer>) {
  const visited = new Set<string>();
  const expand = (name: string): string => {
    if (visited.has(name) || visited.size >= 120) return "";
    visited.add(name);
    const source = texText(files.get(name)!);
    return source.replace(/\\(?:input|include|subfile)\s*\{([^}]+)\}/g, (_, requested: string) => {
      const target = resolveTexFile(name, requested, files);
      return target ? `\n% included: ${target}\n${expand(target)}\n` : "";
    });
  };
  return { source: expand(mainFile), fileCount: visited.size };
}

function latexToMarkdown(value: string) {
  let output = value.replace(/(^|[^\\])%.*$/gm, "$1");
  output = output.replace(/\\(?:section\*?)\s*\{([^}]*)\}/g, "\n\n## $1\n");
  output = output.replace(/\\(?:subsection\*?)\s*\{([^}]*)\}/g, "\n\n### $1\n");
  output = output.replace(/\\(?:subsubsection\*?)\s*\{([^}]*)\}/g, "\n\n#### $1\n");
  output = output.replace(/\\begin\{abstract\}/g, "\n\n## Özet\n").replace(/\\end\{abstract\}/g, "\n");
  output = output.replace(/\\begin\{(?:itemize|enumerate)\}/g, "\n").replace(/\\end\{(?:itemize|enumerate)\}/g, "\n").replace(/\\item\s*/g, "\n- ");
  output = output.replace(/\\bibitem(?:\[[^\]]*\])?\{[^}]*\}/g, "\n- ");
  output = output.replace(/\\(?:cite|citep|citet|ref|eqref)\s*(?:\[[^\]]*\])?\{([^}]*)\}/g, "[$1]");
  for (let pass = 0; pass < 4; pass += 1) output = output.replace(/\\[a-zA-Z@*]+\s*(?:\[[^\]]*\])?\{([^{}]*)\}/g, "$1");
  return normalizeText(output.replace(/\\(?:begin|end)\{[^}]*\}|\\[a-zA-Z@*]+|[{}]/g, " "));
}

function bibtexReferences(value: string) {
  return value.split(/\n(?=@[a-z]+\s*\{)/i).map((record) => {
    const field = (name: string) => record.match(new RegExp(`${name}\\s*=\\s*[{"]([^}"]+)`, "i"))?.[1]?.replace(/\s+/g, " ").trim();
    const title = field("title");
    if (!title) return undefined;
    const authors = field("author")?.replace(/\s+and\s+/gi, ", ");
    const year = field("year");
    return `- ${[authors, title, year].filter(Boolean).join(". ")}`;
  }).filter((entry): entry is string => Boolean(entry));
}

async function writeTexDocument(paper: ContentItem, archive: Buffer, files: Map<string, Buffer>, mainFile: string) {
  const documentDir = documentDirectory(paper);
  const sourceDir = path.join(documentDir, "source");
  await mkdir(sourceDir, { recursive: true });
  const { source, fileCount } = combineTex(mainFile, files);
  const bibliographySource = [...files.entries()].filter(([name]) => name.toLocaleLowerCase("en").endsWith(".bbl")).map(([, value]) => latexToMarkdown(texText(value))).join("\n\n");
  const bibtexSource = [...files.entries()].filter(([name]) => name.toLocaleLowerCase("en").endsWith(".bib")).flatMap(([, value]) => bibtexReferences(texText(value))).join("\n");
  const bibliography = [bibliographySource, bibtexSource].filter(Boolean).join("\n");
  const markdown = ["---", `paper_id: ${JSON.stringify(paper.id)}`, `title: ${JSON.stringify(paper.title)}`, `source_url: ${JSON.stringify(paper.arxiv?.texUrl ?? paper.url)}`, "source_kind: tex", `parsed_at: ${new Date().toISOString()}`, "---", "", `# ${paper.title}`, "", latexToMarkdown(source), bibliography ? "\n\n## References\n\n" : "", bibliography].join("\n");
  const referencesStart = markdown.search(/^##\s+(?:References|Bibliography|Kaynakça)/im);
  const references = referencesFrom(referencesStart >= 0 ? markdown.slice(referencesStart) : "");
  const locations = citationLocations(markdown);
  const sourceFiles = [...files.entries()].map(async ([name, value]) => {
    const target = path.join(sourceDir, ...name.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, value);
  });
  const archivePath = path.join(documentDir, "source.tar");
  const markdownPath = path.join(documentDir, "paper.md");
  const citationPath = path.join(documentDir, "citations.json");
  const manifestPath = path.join(documentDir, "source-manifest.json");
  await Promise.all([...sourceFiles, writeFile(archivePath, archive), writeFile(markdownPath, markdown, "utf8"), writeFile(citationPath, JSON.stringify({ generatedAt: new Date().toISOString(), locations, references }, null, 2), "utf8"), writeFile(manifestPath, JSON.stringify({ sourceKind: "tex", mainFile, retainedFiles: [...files.keys()], parsedAt: new Date().toISOString() }, null, 2), "utf8")]);
  return { status: "ready" as const, sourceKind: "tex" as const, texArchivePath: archivePath, texMainPath: path.join(sourceDir, ...mainFile.split("/")), markdownPath, citationIndexPath: citationPath, parsedAt: new Date().toISOString(), characterCount: markdown.length, sourceFileCount: fileCount, appendixCount: (markdown.match(/^##\s+Appendix/igm) ?? []).length, citationLocations: locations.slice(0, 30), referenceCount: references.length } satisfies PaperDocument;
}

function toPdfMarkdown(paper: ContentItem, pages: Array<{ num: number; text: string }>) {
  const pageText = pages.map((page) => `<!-- page:${page.num} -->\n${normalizeText(page.text)}`).join("\n\n");
  const lines = pageText.split("\n");
  const appendixStart = headingIndex(lines, /^(appendix|appendices|ekler?|ek\s+[a-z0-9])/i);
  const referencesStart = headingIndex(lines, /^(references|bibliography|kaynaklar)$/i);
  const bodyEnd = [appendixStart, referencesStart].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? lines.length;
  const appendixEnd = referencesStart >= 0 ? referencesStart : lines.length;
  const output = ["---", `paper_id: ${JSON.stringify(paper.id)}`, `title: ${JSON.stringify(paper.title)}`, `source_url: ${JSON.stringify(paper.arxiv?.pdfUrl ?? paper.url)}`, "source_kind: pdf", `parsed_at: ${new Date().toISOString()}`, "---", "", `# ${paper.title}`, "", "## Özet", "", paper.summary, "", "## Ana metin", "", ...lines.slice(0, bodyEnd)];
  if (appendixStart >= 0) output.push("", "## Ekler", "", ...lines.slice(appendixStart, appendixEnd));
  if (referencesStart >= 0) output.push("", "## Kaynakça", "", ...lines.slice(referencesStart));
  return { markdown: output.join("\n"), appendixCount: appendixStart >= 0 ? 1 : 0, references: referencesFrom(referencesStart >= 0 ? lines.slice(referencesStart).join("\n") : "") };
}

async function createPdfDocument(paper: ContentItem): Promise<PaperDocument> {
  const pdfUrl = paper.arxiv?.pdfUrl;
  if (!validArxivUrl(pdfUrl) || !pdfUrl?.startsWith("https://arxiv.org/pdf/")) throw new Error("Yalnızca güvenli arXiv PDF bağlantıları işlenebilir.");
  const buffer = await fetchBounded(pdfUrl, MAX_PDF_BYTES, "PDF");
  if (buffer.subarray(0, 4).toString() !== "%PDF") throw new Error("İndirilen dosya geçerli bir PDF değil.");
  const parser = new PDFParse({ data: buffer });
  let text;
  try { text = await parser.getText(); } finally { await parser.destroy(); }
  if (!text.text.trim()) throw new Error("PDF'ten metin çıkarılamadı; dosya taranmış görüntü olabilir.");
  const { markdown, appendixCount, references } = toPdfMarkdown(paper, text.pages);
  const locations = citationLocations(markdown);
  const documentDir = documentDirectory(paper);
  await mkdir(documentDir, { recursive: true });
  const pdfPath = path.join(documentDir, "source.pdf");
  const markdownPath = path.join(documentDir, "paper.md");
  const citationPath = path.join(documentDir, "citations.json");
  await Promise.all([writeFile(pdfPath, buffer), writeFile(markdownPath, markdown, "utf8"), writeFile(citationPath, JSON.stringify({ generatedAt: new Date().toISOString(), locations, references }, null, 2), "utf8")]);
  return { status: "ready", sourceKind: "pdf", pdfPath, markdownPath, citationIndexPath: citationPath, parsedAt: new Date().toISOString(), pageCount: text.total, characterCount: markdown.length, appendixCount, citationLocations: locations.slice(0, 30), referenceCount: references.length };
}

export async function createPaperDocument(paper: ContentItem): Promise<PaperDocument> {
  if (validArxivUrl(paper.arxiv?.texUrl)) {
    try {
      const archive = await fetchBounded(paper.arxiv!.texUrl!, MAX_TEX_ARCHIVE_BYTES, "TeX kaynağı");
      const files = sourceFilesFromArchive(archive);
      return await writeTexDocument(paper, archive, files, findMainTex(files));
    } catch (error) {
      if (!paper.arxiv?.pdfUrl) throw error;
    }
  }
  return createPdfDocument(paper);
}
