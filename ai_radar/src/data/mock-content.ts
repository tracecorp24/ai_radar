import type { ContentItem } from "@/types";
import { isoDaysAgo, isoHoursAgo } from "@/lib/time";

type ContentSeed = Omit<ContentItem, "id" | "publishedAt" | "firstSeenAt" | "updatedAt"> & {
  title: string;
  summary: string;
  authors: string[];
  organization?: string;
  publishedDaysAgo: number;
  firstSeenHoursAgo: number;
  updatedDaysAgo?: number;
};

const seeds: ContentSeed[] = [
  {
    source: "arxiv",
    type: "paper",
    externalId: "arxiv-2608.01234",
    title: "Agentic Memory for Long-Horizon Research Assistants",
    summary:
      "A framework that separates episodic, semantic, and working memory to keep autonomous research agents stable over multi-step tasks.",
    originalContent:
      "We present a memory hierarchy optimized for long-horizon autonomous research workflows with retrieval-aware consolidation.",
    url: "https://arxiv.org/abs/2608.01234",
    authors: ["Mina Yıldız", "Ari Cohen", "Leo Park"],
    organization: "Stanford AI Lab",
    tags: ["Agentic AI", "Memory", "Long Context", "Research Agents"],
    relevanceScore: 96,
    noveltyScore: 94,
    difficulty: "advanced",
    isBookmarked: true,
    isRead: false,
    isFeatured: true,
    publishedDaysAgo: 0,
    firstSeenHoursAgo: 3,
    updatedDaysAgo: 0
  },
  {
    source: "huggingface",
    type: "model",
    externalId: "hf/meta-vision-8b",
    title: "MetaVision-8B v2 improves multimodal grounding on chart and document tasks",
    summary:
      "A compact multimodal model tuned for document understanding, chart QA, and image-to-text reasoning.",
    url: "https://huggingface.co/meta/metavision-8b-v2",
    authors: ["Meta AI"],
    organization: "Meta",
    tags: ["Multimodal", "Vision Language", "Charts", "Document AI"],
    relevanceScore: 93,
    noveltyScore: 88,
    difficulty: "intermediate",
    isBookmarked: true,
    isRead: true,
    publishedDaysAgo: 0,
    firstSeenHoursAgo: 8,
    updatedDaysAgo: 0
  },
  {
    source: "ollama",
    type: "model",
    externalId: "ollama-qwen3-tool-14b",
    title: "Qwen3 Tool 14B enters the local LLM shortlist",
    summary:
      "A local-first instruction model with stronger tool calling and acceptable latency on consumer GPUs.",
    url: "https://ollama.com/library/qwen3-tool",
    authors: ["Ollama Community"],
    tags: ["Local LLM", "Tool Calling", "Reasoning Models"],
    relevanceScore: 88,
    noveltyScore: 82,
    difficulty: "intermediate",
    isBookmarked: false,
    isRead: false,
    publishedDaysAgo: 1,
    firstSeenHoursAgo: 14
  },
  {
    source: "rss",
    type: "article",
    externalId: "rss-deepseek-rag-bench",
    title: "RAG benchmark reveals retrieval quality matters more than model size",
    summary:
      "An editorial roundup comparing retrievers, rerankers, and evaluation setups across several industrial use cases.",
    url: "https://example.com/rag-benchmark-roundup",
    authors: ["Savvy Editorial"],
    organization: "Savvy",
    tags: ["RAG", "Evaluation", "Embeddings", "Benchmarks"],
    relevanceScore: 84,
    noveltyScore: 79,
    difficulty: "beginner",
    isBookmarked: true,
    isRead: false,
    publishedDaysAgo: 1,
    firstSeenHoursAgo: 18
  },
  {
    source: "github",
    type: "release",
    externalId: "github-llamaindex-v1.2",
    title: "LlamaIndex 1.2 adds workflow tracing and agent checkpoints",
    summary:
      "The release introduces debugging primitives for multi-agent orchestration and more deterministic execution traces.",
    originalContent: "Release notes for workflow tracing, checkpointed retries, and source-attribution tooling.",
    url: "https://github.com/run-llama/llama_index/releases/tag/v1.2.0",
    authors: ["run-llama"],
    organization: "GitHub",
    tags: ["Multi-Agent", "Tracing", "Workflow"],
    relevanceScore: 90,
    noveltyScore: 85,
    difficulty: "intermediate",
    isBookmarked: false,
    isRead: true,
    publishedDaysAgo: 2,
    firstSeenHoursAgo: 28
  },
  {
    source: "alphasignal",
    type: "newsletter",
    externalId: "alphasignal-agentic-weekly-31",
    title: "Agentic automation dominates enterprise AI watchlists",
    summary:
      "The weekly digest highlights orchestration patterns, compliance concerns, and the rise of semi-autonomous workflows.",
    url: "https://example.com/alphasignal-agentic-weekly",
    authors: ["AlphaSignal"],
    tags: ["Agentic AI", "AI Automation", "Workflow", "Governance"],
    relevanceScore: 89,
    noveltyScore: 84,
    difficulty: "beginner",
    isBookmarked: true,
    isRead: false,
    publishedDaysAgo: 2,
    firstSeenHoursAgo: 36
  },
  {
    source: "linkedin",
    type: "post",
    externalId: "linkedin-sara-kim-1",
    title: "Sara Kim: Evaluating tool calling is now a product decision, not a benchmark detail",
    summary:
      "A short post arguing that tool-use reliability should be tracked with operational metrics instead of only offline scores.",
    url: "https://linkedin.com/in/sarakim/post/1",
    authors: ["Sara Kim"],
    organization: "Independent",
    tags: ["Tool Calling", "Evaluation", "Product Strategy"],
    relevanceScore: 78,
    noveltyScore: 72,
    difficulty: "beginner",
    isBookmarked: false,
    isRead: false,
    publishedDaysAgo: 2,
    firstSeenHoursAgo: 42
  },
  {
    source: "arxiv",
    type: "paper",
    externalId: "arxiv-2608.01280",
    title: "A Survey of Multimodal Agents for Computer Use",
    summary:
      "The survey maps planner, perception, and action loops across browser, desktop, and robotics control settings.",
    url: "https://arxiv.org/abs/2608.01280",
    authors: ["Noah Turner", "Ipek Demir", "Hana Lee"],
    organization: "ETH Zürich",
    tags: ["Multimodal", "Agents", "Computer Use", "Survey"],
    relevanceScore: 91,
    noveltyScore: 81,
    difficulty: "advanced",
    isBookmarked: true,
    isRead: false,
    publishedDaysAgo: 3,
    firstSeenHoursAgo: 50
  },
  {
    source: "huggingface",
    type: "model",
    externalId: "hf/phi-local-4b",
    title: "Phi Local 4B optimizes 8-bit deployment on laptops",
    summary:
      "A small instruction model aimed at offline note-taking, summarization, and retrieval-augmented copilots.",
    url: "https://huggingface.co/phi-local/4b",
    authors: ["Microsoft Research"],
    organization: "Microsoft",
    tags: ["Local LLM", "Quantization", "Small Models"],
    relevanceScore: 82,
    noveltyScore: 77,
    difficulty: "beginner",
    isBookmarked: false,
    isRead: true,
    publishedDaysAgo: 3,
    firstSeenHoursAgo: 54
  },
  {
    source: "rss",
    type: "article",
    externalId: "rss-mcp-security-brief",
    title: "MCP security baselines are converging on allowlists and scoped tokens",
    summary:
      "This brief compares transport assumptions, prompt-injection mitigations, and least-privilege design across early MCP deployments.",
    url: "https://example.com/mcp-security-brief",
    authors: ["Savvy Editorial"],
    organization: "Savvy",
    tags: ["MCP", "Security", "Tool Calling"],
    relevanceScore: 87,
    noveltyScore: 86,
    difficulty: "intermediate",
    isBookmarked: true,
    isRead: false,
    publishedDaysAgo: 4,
    firstSeenHoursAgo: 68
  },
  {
    source: "ollama",
    type: "model",
    externalId: "ollama-llama4-vision-11b",
    title: "Llama 4 Vision 11B brings practical multimodal grounding to Ollama",
    summary:
      "A local-friendly model profile for UI screenshots, document QA, and agentic desktop workflows.",
    url: "https://ollama.com/library/llama4-vision",
    authors: ["Ollama Team"],
    tags: ["Multimodal", "Local LLM", "Vision Language"],
    relevanceScore: 90,
    noveltyScore: 83,
    difficulty: "intermediate",
    isBookmarked: false,
    isRead: true,
    publishedDaysAgo: 4,
    firstSeenHoursAgo: 72
  },
  {
    source: "github",
    type: "release",
    externalId: "github-openwebui-2026.8",
    title: "Open WebUI ships better model routing and prompt templates",
    summary:
      "The release focuses on routing, reusable prompt presets, and a lighter browse experience for local models.",
    url: "https://github.com/open-webui/open-webui/releases",
    authors: ["Open WebUI"],
    organization: "GitHub",
    tags: ["Local LLM", "UI", "Workflow"],
    relevanceScore: 76,
    noveltyScore: 70,
    difficulty: "beginner",
    isBookmarked: false,
    isRead: true,
    publishedDaysAgo: 5,
    firstSeenHoursAgo: 84
  },
  {
    source: "arxiv",
    type: "paper",
    externalId: "arxiv-2608.01311",
    title: "Evaluating Reasoning Models with Multi-Step Consistency Metrics",
    summary:
      "The paper proposes a benchmark suite that measures answer stability, reasoning trace coherence, and tool invocation quality.",
    url: "https://arxiv.org/abs/2608.01311",
    authors: ["Kaan Erdem", "Maya Singh"],
    organization: "University of Toronto",
    tags: ["Reasoning Models", "Evaluation", "Benchmarks"],
    relevanceScore: 97,
    noveltyScore: 92,
    difficulty: "advanced",
    isBookmarked: true,
    isRead: false,
    publishedDaysAgo: 5,
    firstSeenHoursAgo: 88
  },
  {
    source: "linkedin",
    type: "post",
    externalId: "linkedin-omar-khan-2",
    title: "Omar Khan: Most RAG failures are indexing failures in disguise",
    summary:
      "A concise post about observability for chunking, metadata quality, and reranking pipelines.",
    url: "https://linkedin.com/in/omarkhan/post/2",
    authors: ["Omar Khan"],
    organization: "SearchWorks",
    tags: ["RAG", "Observability", "Embeddings"],
    relevanceScore: 80,
    noveltyScore: 74,
    difficulty: "beginner",
    isBookmarked: false,
    isRead: false,
    publishedDaysAgo: 6,
    firstSeenHoursAgo: 102
  },
  {
    source: "rss",
    type: "article",
    externalId: "rss-long-context-notes",
    title: "Long-context models still need retrieval to stay cheap and predictable",
    summary:
      "A practical note on why extended context alone is not a replacement for structured retrieval and indexing.",
    url: "https://example.com/long-context-notes",
    authors: ["Savvy Editorial"],
    organization: "Savvy",
    tags: ["Long Context", "RAG", "Architecture"],
    relevanceScore: 83,
    noveltyScore: 80,
    difficulty: "intermediate",
    isBookmarked: true,
    isRead: true,
    publishedDaysAgo: 6,
    firstSeenHoursAgo: 108
  },
  {
    source: "huggingface",
    type: "model",
    externalId: "hf/embedding-xl-v3",
    title: "Embedding-XL-v3 sets a new baseline for multilingual retrieval",
    summary:
      "A sentence embedding model with strong recall on multilingual search and domain-specific corpora.",
    url: "https://huggingface.co/embeddings/embedding-xl-v3",
    authors: ["Hugging Face Research"],
    organization: "Hugging Face",
    tags: ["Embeddings", "Retrieval", "Multilingual"],
    relevanceScore: 86,
    noveltyScore: 78,
    difficulty: "beginner",
    isBookmarked: false,
    isRead: false,
    publishedDaysAgo: 7,
    firstSeenHoursAgo: 118
  },
  {
    source: "github",
    type: "release",
    externalId: "github-mcp-servers-core",
    title: "MCP Servers Core adds observability hooks and request quotas",
    summary:
      "New release notes emphasize rate limiting, request telemetry, and safer default tool exposure.",
    url: "https://github.com/modelcontextprotocol/servers/releases",
    authors: ["MCP Project"],
    organization: "GitHub",
    tags: ["MCP", "Security", "Observability"],
    relevanceScore: 89,
    noveltyScore: 86,
    difficulty: "intermediate",
    isBookmarked: true,
    isRead: false,
    publishedDaysAgo: 7,
    firstSeenHoursAgo: 130
  },
  {
    source: "alphasignal",
    type: "newsletter",
    externalId: "alphasignal-eval-roundup-18",
    title: "AI evaluation is moving from leaderboards to scenario coverage",
    summary:
      "The roundup explains why product teams are turning toward task-specific scenario tests and failure-mode tracking.",
    url: "https://example.com/alphasignal-eval-roundup",
    authors: ["AlphaSignal"],
    tags: ["Evaluation", "Benchmarks", "AI Safety"],
    relevanceScore: 88,
    noveltyScore: 84,
    difficulty: "intermediate",
    isBookmarked: false,
    isRead: false,
    publishedDaysAgo: 8,
    firstSeenHoursAgo: 142
  },
  {
    source: "linkedin",
    type: "post",
    externalId: "linkedin-zeynep-ali-3",
    title: "Zeynep Ali: The best agent UI is the one that shows failure states early",
    summary:
      "A post on transparent UX for agentic systems, emphasizing trace visibility and human override points.",
    url: "https://linkedin.com/in/zeynepali/post/3",
    authors: ["Zeynep Ali"],
    organization: "Product Studio",
    tags: ["Agentic AI", "UX", "Observability"],
    relevanceScore: 77,
    noveltyScore: 70,
    difficulty: "beginner",
    isBookmarked: false,
    isRead: true,
    publishedDaysAgo: 9,
    firstSeenHoursAgo: 162
  },
  {
    source: "arxiv",
    type: "paper",
    externalId: "arxiv-2608.01369",
    title: "Prompt-Injected Tool Calls and the Case for Scoped Capability Layers",
    summary:
      "The paper formalizes a threat model for tool-calling agents and proposes layered permissions for external actions.",
    url: "https://arxiv.org/abs/2608.01369",
    authors: ["Elif Aslan", "Nathan Brooks"],
    organization: "Oxford University",
    tags: ["MCP", "Security", "Tool Calling", "AI Safety"],
    relevanceScore: 95,
    noveltyScore: 93,
    difficulty: "advanced",
    isBookmarked: true,
    isRead: false,
    publishedDaysAgo: 10,
    firstSeenHoursAgo: 180
  },
  {
    source: "other",
    type: "article",
    externalId: "other-n8n-ai-workflows",
    title: "n8n workflows are becoming the glue for lightweight AI operations",
    summary:
      "A practical writeup on automating ingestion, notifications, and daily digests with low-code workflows.",
    url: "https://example.com/n8n-ai-workflows",
    authors: ["Savvy Editorial"],
    organization: "Savvy",
    tags: ["AI Automation", "n8n", "Workflow"],
    relevanceScore: 79,
    noveltyScore: 75,
    difficulty: "beginner",
    isBookmarked: false,
    isRead: false,
    publishedDaysAgo: 11,
    firstSeenHoursAgo: 194
  },
  {
    source: "rss",
    type: "newsletter",
    externalId: "rss-weekly-agentic-roundup",
    title: "Weekly roundup: multi-agent orchestration and model routing",
    summary:
      "A digest focused on coordination patterns, fallback strategies, and budget-aware routing between models.",
    url: "https://example.com/weekly-agentic-roundup",
    authors: ["Savvy Editorial"],
    organization: "Savvy",
    tags: ["Multi-Agent", "Reasoning Models", "Routing"],
    relevanceScore: 81,
    noveltyScore: 76,
    difficulty: "beginner",
    isBookmarked: true,
    isRead: true,
    publishedDaysAgo: 12,
    firstSeenHoursAgo: 220
  },
  {
    source: "github",
    type: "release",
    externalId: "github-sglang",
    title: "sglang: Fast and Expressive LLM Serving Engine",
    summary:
      "SGLang is a structured generation language and high-performance inference engine for LLMs with fast vLLM integration.",
    url: "https://github.com/sgl-project/sglang",
    authors: ["sgl-project"],
    organization: "GitHub",
    tags: ["Model Serving", "Inference Optimization", "Local LLM"],
    relevanceScore: 94,
    noveltyScore: 80,
    difficulty: "advanced",
    isBookmarked: false,
    isRead: false,
    publishedDaysAgo: 1,
    firstSeenHoursAgo: 10
  }
];

export const mockContent: ContentItem[] = seeds.map((seed, index) => {
  const publishedAt = isoDaysAgo(seed.publishedDaysAgo);
  const isGithub = seed.source === "github";
  return {
    id: `content-${String(index + 1).padStart(2, "0")}`,
    source: seed.source,
    type: seed.type,
    externalId: seed.externalId,
    title: seed.title,
    summary: seed.summary,
    originalContent: seed.originalContent,
    url: seed.url,
    imageUrl: seed.imageUrl,
    authors: seed.authors,
    organization: seed.organization,
    publishedAt,
    firstSeenAt: isoHoursAgo(seed.firstSeenHoursAgo),
    updatedAt: seed.updatedDaysAgo !== undefined ? isoDaysAgo(seed.updatedDaysAgo) : undefined,
    tags: seed.tags,
    relevanceScore: seed.relevanceScore,
    noveltyScore: seed.noveltyScore,
    difficulty: seed.difficulty,
    isBookmarked: seed.isBookmarked,
    isRead: seed.isRead,
    isFeatured: seed.isFeatured,
    github: isGithub
      ? {
          stars: seed.externalId.includes("sglang") ? 8900 : 4200 + index * 300,
          forks: seed.externalId.includes("sglang") ? 950 : 350 + index * 40,
          openIssues: 32,
          language: "Python",
          createdAt: seed.externalId.includes("sglang") ? isoDaysAgo(540) : isoDaysAgo(30 + index * 5),
          pushedAt: publishedAt,
          starsPerDay: seed.externalId.includes("sglang") ? 16.5 : 12.0
        }
      : undefined
  };
});

export const contentById = new Map(mockContent.map((item) => [item.id, item]));
