import { getPreference, listContent, setPreference } from "@/lib/local-db";
import { isGitHubTrendCandidate } from "@/lib/github/trend-client";
import { matchesAnyTopicTerm } from "@/lib/trends/topic-utils";
import type { ContentItem, TrendTopic } from "@/types";

const ANALYSIS_KEY = "trend.analysis.v7";
const ANALYSIS_INTERVAL_MS = 10 * 60_000;
const WINDOW_DAYS = 1;

export const TREND_TOPIC_CATALOG = [
  { name: "AI Agents", terms: ["agentic", "ai agent", "agents", "multi-agent", "autonomous agent"] },
  { name: "RAG", terms: ["rag", "retrieval augmented", "retrieval-augmented", "vector search"] },
  { name: "Multimodal AI", terms: ["multimodal", "vision-language", "vlm", "audio-language"] },
  { name: "Reasoning", terms: ["reasoning", "chain of thought", "test-time compute", "inference-time"] },
  { name: "MCP & Tools", terms: ["model context protocol", "mcp", "tool calling", "function calling"] },
  { name: "Local LLM", terms: ["local llm", "on-device", "ollama", "gguf", "quantization"] },
  { name: "AI Coding", terms: ["code generation", "coding agent", "software engineering", "code assistant"] },
  { name: "Vision AI", terms: ["computer vision", "image generation", "object detection", "visual understanding"] },
  { name: "Robotics", terms: ["robotics", "robot learning", "embodied ai", "vision-language-action"] },
  { name: "Diffusion", terms: ["diffusion", "flow matching", "text-to-image", "image synthesis"] },
  { name: "AI Safety", terms: ["alignment", "ai safety", "guardrail", "red teaming", "jailbreak"] },
  { name: "Small Language Models", terms: ["small language model", "slm", "compact model", "edge model"] },
  { name: "Foundation Models", terms: ["foundation model", "ai model", "base model", "pretrained model"] },
  { name: "Fine-Tuning", terms: ["fine-tuning", "fine tuning", "finetuning", "lora", "qlora", "peft"] },
  { name: "Reinforcement Learning", terms: ["reinforcement learning", "deep rl", "policy learning", "q-learning"] },
  { name: "RLHF", terms: ["rlhf", "human feedback", "reward model", "preference model"] },
  { name: "Preference Optimization", terms: ["dpo", "preference optimization", "orpo", "kto", "simpo"] },
  { name: "Reinforcement Fine-Tuning", terms: ["reinforcement fine-tuning", "reinforcement finetuning", "rft", "verifiable reward"] },
  { name: "Model Distillation", terms: ["knowledge distillation", "model distillation", "teacher student", "student model"] },
  { name: "Quantization", terms: ["quantization", "int8", "int4", "4-bit", "8-bit", "awq", "gptq"] },
  { name: "Mixture of Experts", terms: ["mixture of experts", "mixture-of-experts", "moe", "sparse experts"] },
  { name: "Transformers", terms: ["transformer architecture", "attention mechanism", "self-attention", "transformers"] },
  { name: "Long Context", terms: ["long context", "context window", "million token", "context length"] },
  { name: "AI Memory", terms: ["agent memory", "long-term memory", "memory system", "episodic memory"] },
  { name: "Vector Databases", terms: ["vector database", "vector db", "vector store", "similarity search"] },
  { name: "Embeddings", terms: ["embedding model", "text embedding", "multimodal embedding", "representation learning"] },
  { name: "Synthetic Data", terms: ["synthetic data", "data generation", "synthetic dataset", "self-generated data"] },
  { name: "Data Curation", terms: ["data curation", "dataset curation", "data filtering", "data quality"] },
  { name: "AI Evaluation", terms: ["llm evaluation", "model evaluation", "ai eval", "evaluation framework", "grader"] },
  { name: "AI Benchmarks", terms: ["benchmark", "leaderboard", "evaluation dataset", "benchmarking"] },
  { name: "Inference Optimization", terms: ["inference optimization", "speculative decoding", "kv cache", "flash attention"] },
  { name: "Model Serving", terms: ["model serving", "llm serving", "vllm", "inference server", "model deployment"] },
  { name: "Edge AI", terms: ["edge ai", "on-device ai", "mobile ai", "tinyml"] },
  { name: "Speech AI", terms: ["speech recognition", "speech-to-text", "automatic speech recognition", "asr", "text-to-speech"] },
  { name: "Audio Generation", terms: ["audio generation", "music generation", "text-to-audio", "voice generation"] },
  { name: "Video Generation", terms: ["video generation", "text-to-video", "image-to-video", "video diffusion"] },
  { name: "World Models", terms: ["world model", "world models", "environment model", "latent dynamics"] },
  { name: "Embodied AI", terms: ["embodied ai", "embodied agent", "physical agent", "vision-language-action"] },
  { name: "Autonomous Vehicles", terms: ["autonomous driving", "self-driving", "autonomous vehicle", "driving model"] },
  { name: "Scientific Machine Learning", terms: ["scientific machine learning", "scientific ml", "physics-informed", "neural operator"] },
  { name: "Healthcare AI", terms: ["healthcare ai", "medical ai", "clinical ai", "medical imaging", "biomedical model"] },
  { name: "AI Search", terms: ["ai search", "neural search", "semantic search", "answer engine"] },
  { name: "Knowledge Graphs", terms: ["knowledge graph", "graph rag", "graph retrieval", "knowledge base"] },
  { name: "Graph Neural Networks", terms: ["graph neural network", "gnn", "graph transformer", "graph learning"] },
  { name: "Time Series AI", terms: ["time series", "time-series model", "forecasting model", "temporal model"] },
  { name: "Federated Learning", terms: ["federated learning", "federated training", "decentralized learning"] },
  { name: "Privacy-Preserving ML", terms: ["privacy-preserving", "differential privacy", "private ml", "homomorphic encryption"] },
  { name: "Explainable AI", terms: ["explainable ai", "xai", "model interpretability", "interpretable ai"] },
  { name: "Open-Source Models", terms: ["open-source model", "open source model", "open weights", "open-weight"] },
  { name: "AI Hardware", terms: ["ai accelerator", "ai hardware", "gpu inference", "tpu", "npu", "inference chip"] }
] as const;

export interface TrendAnalysisState {
  topics: TrendTopic[];
  analyzedAt: string;
  itemCount: number;
  windowDays: number;
  sources: { github: number; arxiv: number; huggingface: number; linkedin: number };
  catalogSize: number;
}

function searchable(item: ContentItem) {
  return `${item.title} ${item.summary} ${item.tags.join(" ")}`.toLocaleLowerCase("en");
}

function matches(item: ContentItem, terms: readonly string[]) {
  return matchesAnyTopicTerm(searchable(item), terms);
}

export function classifyContentTopics(item: ContentItem, limit = 3) {
  return TREND_TOPIC_CATALOG.filter((topic) => matches(item, topic.terms)).slice(0, limit).map((topic) => topic.name);
}

function averageScore(items: ContentItem[]) {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + (item.trendScore ?? (item.relevanceScore + item.noveltyScore) / 2), 0) / items.length;
}

function trendCategory(item: ContentItem) {
  if (item.source === "github") return "github" as const;
  if (item.source === "huggingface" || item.type === "model") return "huggingface" as const;
  if (item.source === "linkedin" || item.type === "post") return "linkedin" as const;
  return "paper" as const;
}

export function getTrendAnalysisState() {
  const state = getPreference<TrendAnalysisState | null>(ANALYSIS_KEY, null);
  return state?.catalogSize === TREND_TOPIC_CATALOG.length ? state : null;
}

export function analyzeStoredTrends(force = false): TrendAnalysisState {
  const current = getTrendAnalysisState();
  if (!force && current && Date.now() - new Date(current.analyzedAt).getTime() < ANALYSIS_INTERVAL_MS) return current;

  const items = listContent({ limit: 3000 }).filter((item) => {
    const supported = item.source === "github" || item.source === "arxiv" || item.source === "huggingface" || item.source === "linkedin";
    return supported && (item.source !== "github" || isGitHubTrendCandidate(item));
  });
  const now = Date.now();
  const recentCutoff = now - WINDOW_DAYS * 86_400_000;
  const previousCutoff = now - WINDOW_DAYS * 2 * 86_400_000;
  const recent = items.filter((item) => new Date(item.publishedAt).getTime() >= recentCutoff);
  const previous = items.filter((item) => { const published = new Date(item.publishedAt).getTime(); return published >= previousCutoff && published < recentCutoff; });

  const ranked = TREND_TOPIC_CATALOG.map((topic) => {
    const recentMatches = recent.filter((item) => matches(item, topic.terms));
    const previousMatches = previous.filter((item) => matches(item, topic.terms));
    const isNew = previousMatches.length === 0 && recentMatches.length > 0;
    const growth = previousMatches.length ? (recentMatches.length - previousMatches.length) / previousMatches.length * 100 : 0;
    const momentum = isNew ? 10 : Math.max(0, Math.min(100, growth));
    const score = averageScore(recentMatches) * 0.65 + Math.min(100, recentMatches.length * 12) * 0.2 + momentum * 0.15;
    const itemIds = [...recentMatches].sort((a, b) => averageScore([b]) - averageScore([a])).slice(0, 20).map((item) => item.id);
    const previousItemIds = [...previousMatches].sort((a, b) => averageScore([b]) - averageScore([a])).slice(0, 20).map((item) => item.id);
    const categoryCounts = Object.fromEntries((["paper", "github", "linkedin", "huggingface"] as const).map((category) => [category, { count: recentMatches.filter((item) => trendCategory(item) === category).length, previousCount: previousMatches.filter((item) => trendCategory(item) === category).length }])) as TrendTopic["categoryCounts"];
    return { name: topic.name, count: recentMatches.length, previousCount: previousMatches.length, growth: Math.round(growth * 10) / 10, isNew, itemIds, previousItemIds, categoryCounts, score };
  }).filter((topic) => topic.count > 0).sort((a, b) => b.score - a.score || b.count - a.count);

  const state: TrendAnalysisState = {
    topics: ranked.map(({ name, count, previousCount, growth, isNew, itemIds, previousItemIds, categoryCounts }) => ({ name, count, previousCount, growth, isNew, itemIds, previousItemIds, categoryCounts })),
    analyzedAt: new Date().toISOString(),
    itemCount: recent.length,
    windowDays: WINDOW_DAYS,
    sources: { github: recent.filter((item) => item.source === "github").length, arxiv: recent.filter((item) => item.source === "arxiv").length, huggingface: recent.filter((item) => item.source === "huggingface").length, linkedin: recent.filter((item) => item.source === "linkedin").length },
    catalogSize: TREND_TOPIC_CATALOG.length
  };
  return setPreference(ANALYSIS_KEY, state);
}
