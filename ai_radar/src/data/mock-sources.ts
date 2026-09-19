import type { SourceStatus } from "@/types";
import { isoHoursAgo } from "@/lib/time";

export const mockSources: SourceStatus[] = [
  {
    id: "source-01",
    name: "arXiv",
    type: "Paper feed",
    url: "https://arxiv.org",
    status: "active",
    lastCheckedAt: isoHoursAgo(1),
    lastSuccessfulRunAt: isoHoursAgo(1),
    totalItems: 248,
    newItems: 4,
    checkIntervalMinutes: 60
  },
  {
    id: "source-02",
    name: "Hugging Face",
    type: "Models and Papers",
    url: "https://huggingface.co",
    status: "active",
    lastCheckedAt: isoHoursAgo(2),
    lastSuccessfulRunAt: isoHoursAgo(2),
    totalItems: 512,
    newItems: 7,
    checkIntervalMinutes: 45
  },
  {
    id: "source-03",
    name: "Ollama",
    type: "Model library",
    url: "https://ollama.com/library",
    status: "active",
    lastCheckedAt: isoHoursAgo(4),
    lastSuccessfulRunAt: isoHoursAgo(4),
    totalItems: 86,
    newItems: 2,
    checkIntervalMinutes: 90
  },
  {
    id: "source-04",
    name: "AlphaSignal",
    type: "Newsletter",
    url: "https://alphasignal.ai",
    status: "waiting",
    lastCheckedAt: isoHoursAgo(6),
    lastSuccessfulRunAt: isoHoursAgo(30),
    totalItems: 31,
    newItems: 1,
    lastError: "Next digest not published yet.",
    checkIntervalMinutes: 720
  },
  {
    id: "source-05",
    name: "LinkedIn",
    type: "People watchlist",
    url: "https://linkedin.com",
    status: "active",
    lastCheckedAt: isoHoursAgo(5),
    lastSuccessfulRunAt: isoHoursAgo(5),
    totalItems: 74,
    newItems: 5,
    checkIntervalMinutes: 120
  },
  {
    id: "source-06",
    name: "RSSHub",
    type: "Generated feeds",
    url: "https://docs.rsshub.app",
    status: "error",
    lastCheckedAt: isoHoursAgo(3),
    lastSuccessfulRunAt: isoHoursAgo(24),
    totalItems: 53,
    newItems: 0,
    lastError: "One feed returned 429; retry scheduled.",
    checkIntervalMinutes: 180
  },
  {
    id: "source-07",
    name: "changedetection.io",
    type: "Page monitoring",
    url: "https://changedetection.io",
    status: "active",
    lastCheckedAt: isoHoursAgo(2),
    lastSuccessfulRunAt: isoHoursAgo(2),
    totalItems: 26,
    newItems: 3,
    checkIntervalMinutes: 30
  },
  {
    id: "source-08",
    name: "n8n",
    type: "Workflow feeds",
    url: "https://n8n.io",
    status: "disabled",
    lastCheckedAt: isoHoursAgo(48),
    lastSuccessfulRunAt: isoHoursAgo(48),
    totalItems: 18,
    newItems: 0,
    lastError: "Workflow is disabled in this prototype.",
    checkIntervalMinutes: 360
  }
];

