import type { PersonItem } from "@/types";
import { isoDaysAgo, isoHoursAgo } from "@/lib/time";

export const mockPeople: PersonItem[] = [
  {
    id: "person-01",
    name: "Sara Kim",
    role: "AI Product Lead",
    organization: "Independent",
    platform: "linkedin",
    profileUrl: "https://linkedin.com/in/sarakim",
    topics: ["Tool Calling", "Evaluation", "UX"],
    lastCheckedAt: isoHoursAgo(2),
    lastPostAt: isoDaysAgo(1),
    newPostCount: 1,
    isActive: true
  },
  {
    id: "person-02",
    name: "Omar Khan",
    role: "Search Infrastructure Engineer",
    organization: "SearchWorks",
    platform: "linkedin",
    profileUrl: "https://linkedin.com/in/omarkhan",
    topics: ["RAG", "Embeddings", "Observability"],
    lastCheckedAt: isoHoursAgo(4),
    lastPostAt: isoDaysAgo(2),
    newPostCount: 0,
    isActive: true
  },
  {
    id: "person-03",
    name: "Zeynep Ali",
    role: "Product Designer",
    organization: "Product Studio",
    platform: "linkedin",
    profileUrl: "https://linkedin.com/in/zeynepali",
    topics: ["Agentic AI", "UX", "Observability"],
    lastCheckedAt: isoHoursAgo(6),
    lastPostAt: isoDaysAgo(3),
    newPostCount: 2,
    isActive: true
  },
  {
    id: "person-04",
    name: "Noah Turner",
    role: "Research Scientist",
    organization: "ETH Zürich",
    platform: "github",
    profileUrl: "https://github.com/noahturner",
    topics: ["Multimodal", "Agents", "Benchmarking"],
    lastCheckedAt: isoHoursAgo(8),
    lastPostAt: isoDaysAgo(5),
    newPostCount: 0,
    isActive: true
  },
  {
    id: "person-05",
    name: "Mina Yıldız",
    role: "PhD Researcher",
    organization: "Stanford AI Lab",
    platform: "other",
    profileUrl: "https://example.com/mina",
    topics: ["Memory", "Long Context", "Retrieval"],
    lastCheckedAt: isoHoursAgo(12),
    lastPostAt: isoDaysAgo(0),
    newPostCount: 1,
    isActive: true
  },
  {
    id: "person-06",
    name: "Elif Aslan",
    role: "Security Researcher",
    organization: "Oxford University",
    platform: "x",
    profileUrl: "https://x.com/elifaslan",
    topics: ["MCP", "Security", "AI Safety"],
    lastCheckedAt: isoHoursAgo(14),
    lastPostAt: isoDaysAgo(4),
    newPostCount: 0,
    isActive: true
  },
  {
    id: "person-07",
    name: "Kaan Erdem",
    role: "ML Engineer",
    organization: "Toronto AI",
    platform: "github",
    profileUrl: "https://github.com/kaanerdem",
    topics: ["Reasoning Models", "Evaluation", "Benchmarks"],
    lastCheckedAt: isoHoursAgo(16),
    lastPostAt: isoDaysAgo(6),
    newPostCount: 0,
    isActive: false
  },
  {
    id: "person-08",
    name: "Ari Cohen",
    role: "Applied Researcher",
    organization: "Stanford AI Lab",
    platform: "linkedin",
    profileUrl: "https://linkedin.com/in/aricohen",
    topics: ["Agentic AI", "Memory", "RAG"],
    lastCheckedAt: isoHoursAgo(20),
    lastPostAt: isoDaysAgo(1),
    newPostCount: 3,
    isActive: true
  }
];

export const personTimeline: Record<string, { id: string; date: string; title: string; summary: string; platform: PersonItem["platform"] }[]> =
  {
    "person-01": [
      {
        id: "post-01",
        date: isoDaysAgo(1),
        title: "Tool calling needs product-grade observability",
        summary: "A thread about logging decisions, fallback behavior, and human override paths.",
        platform: "linkedin"
      },
      {
        id: "post-02",
        date: isoDaysAgo(8),
        title: "Evaluating RAG means measuring retrieval misses",
        summary: "Focus on scenario-based metrics rather than raw answer accuracy.",
        platform: "linkedin"
      }
    ],
    "person-03": [
      {
        id: "post-03",
        date: isoDaysAgo(3),
        title: "Designing for visible failure states in agents",
        summary: "An argument for transparent traces and explicit user intervention points.",
        platform: "linkedin"
      }
    ],
    "person-05": [
      {
        id: "post-04",
        date: isoDaysAgo(0),
        title: "Memory consolidation can reduce repeated retrieval costs",
        summary: "A note on combining long-context prompts with episodic memory layers.",
        platform: "other"
      }
    ],
    "person-08": [
      {
        id: "post-05",
        date: isoDaysAgo(1),
        title: "Research assistant agents need bounded retry policies",
        summary: "A discussion of retries, budgets, and task completion criteria.",
        platform: "linkedin"
      },
      {
        id: "post-06",
        date: isoDaysAgo(7),
        title: "Why agent memory is still an open systems problem",
        summary: "Notes from a lab meeting on retrieval, summaries, and storage drift.",
        platform: "linkedin"
      }
    ]
  };

