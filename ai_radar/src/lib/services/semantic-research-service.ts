import { getLlmConfig, requestEmbeddings } from "@/lib/llm/client";
import { listContent, listContentEmbeddings, upsertContentEmbedding, type StoredContentEmbedding } from "@/lib/local-db";
import type { ContentItem, SemanticSearchResult } from "@/types";

const CATEGORY_PROTOTYPES = [
  ["AI Agents", "autonomous agents agentic workflows tool use planning multi-agent systems"],
  ["RAG & Search", "retrieval augmented generation semantic search vector database embeddings knowledge retrieval"],
  ["Reasoning", "reasoning inference planning chain of thought test time compute mathematics logic"],
  ["Multimodal AI", "multimodal vision language audio video image understanding generation"],
  ["AI Coding", "code generation software engineering coding agents program synthesis developer tools"],
  ["Model Training", "fine tuning reinforcement learning preference optimization distillation synthetic data training"],
  ["Evaluation & Safety", "evaluation benchmarks alignment safety guardrails robustness interpretability red teaming"],
  ["Inference & Systems", "model serving inference optimization quantization efficiency hardware distributed systems"],
  ["Robotics & Embodied AI", "robotics embodied intelligence autonomous vehicles control vision language action"],
  ["Scientific & Healthcare AI", "scientific machine learning healthcare medical biology chemistry research applications"]
] as const;

function paperText(item: ContentItem) {
  return `Başlık: ${item.title}\nÖzet: ${item.summary}\nEtiketler: ${item.tags.join(", ")}`.slice(0, 6_000);
}

function cosine(left: number[], right: number[]) {
  if (!left.length || left.length !== right.length) return -1;
  let dot = 0; let leftNorm = 0; let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) { dot += left[index] * right[index]; leftNorm += left[index] ** 2; rightNorm += right[index] ** 2; }
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm) || 1);
}

function classify(vector: number[], categoryVectors: number[][]) {
  const ranked = CATEGORY_PROTOTYPES.map(([label], index) => ({ label, score: cosine(vector, categoryVectors[index]) })).sort((a, b) => b.score - a.score);
  const threshold = Math.max(0.35, (ranked[0]?.score ?? 0) - 0.07);
  return ranked.filter((entry) => entry.score >= threshold).slice(0, 3).map((entry) => entry.label);
}

function storedForModel(model: string) {
  return new Map(listContentEmbeddings().filter((entry) => entry.model === model).map((entry) => [entry.contentId, entry]));
}

export async function indexPaperCatalog(limit = 60) {
  const papers = listContent({ type: "paper", limit: 3_000 });
  const model = getLlmConfig().embeddingModel!;
  const stored = storedForModel(model);
  const missing = papers.filter((paper) => !stored.has(paper.id)).slice(0, Math.min(Math.max(limit, 1), 100));
  if (missing.length) {
    const { vectors } = await requestEmbeddings([...CATEGORY_PROTOTYPES.map(([, description]) => description), ...missing.map(paperText)]);
    const categoryVectors = vectors.slice(0, CATEGORY_PROTOTYPES.length);
    missing.forEach((paper, index) => {
      const vector = vectors[CATEGORY_PROTOTYPES.length + index];
      stored.set(paper.id, upsertContentEmbedding(paper.id, model, vector, classify(vector, categoryVectors)));
    });
  }
  return {
    model,
    indexed: missing.length,
    total: papers.length,
    remaining: Math.max(0, papers.length - stored.size),
    categories: Object.fromEntries([...stored.values()].map((entry) => [entry.contentId, entry.categories]))
  };
}

export async function semanticPaperSearch(query: string, limit = 24) {
  const papers = listContent({ type: "paper", limit: 3_000 });
  const model = getLlmConfig().embeddingModel!;
  const stored = storedForModel(model);
  const missing = papers.filter((paper) => !stored.has(paper.id)).slice(0, 50);
  const prefix = missing.length ? [query, ...CATEGORY_PROTOTYPES.map(([, description]) => description)] : [query];
  const { vectors } = await requestEmbeddings([...prefix, ...missing.map(paperText)]);
  const queryVector = vectors[0];
  if (missing.length) {
    const categoryVectors = vectors.slice(1, 1 + CATEGORY_PROTOTYPES.length);
    missing.forEach((paper, index) => {
      const vector = vectors[prefix.length + index];
      stored.set(paper.id, upsertContentEmbedding(paper.id, model, vector, classify(vector, categoryVectors)));
    });
  }
  const results = papers.flatMap((item) => {
    const embedding: StoredContentEmbedding | undefined = stored.get(item.id);
    return embedding ? [{ item, similarity: cosine(queryVector, embedding.vector), categories: embedding.categories } satisfies SemanticSearchResult] : [];
  }).sort((a, b) => b.similarity - a.similarity).slice(0, Math.min(Math.max(limit, 1), 50));
  return { results, model, indexed: missing.length, remaining: Math.max(0, papers.length - stored.size) };
}
