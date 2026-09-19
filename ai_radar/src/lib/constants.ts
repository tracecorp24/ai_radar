import type { ContentSource } from "@/types";
import { BarChart3, BookOpenText, Layers3, LayoutDashboard, Users, Radar, Settings2 } from "lucide-react";

export const APP_NAME = "Savvy";
export const APP_TAGLINE = "AI Research & Technology Intelligence";
export const APP_TAGLINE_TR = "Yapay Zekâ Araştırma ve Teknoloji İstihbarat Platformu";

export const NAV_ITEMS = [
  { label: "Ana Sayfa", href: "/", icon: LayoutDashboard },
  { label: "Araştırmalar", href: "/research", icon: BookOpenText },
  { label: "Modeller", href: "/models", icon: Layers3 },
  { label: "Kişiler", href: "/people", icon: Users },
  { label: "Trendler", href: "/trends", icon: BarChart3 },
  { label: "Kaydedilenler", href: "/bookmarks", icon: Radar },
  { label: "Kaynaklar", href: "/sources", icon: Radar },
  { label: "Ayarlar", href: "/settings", icon: Settings2 }
] as const;

export const SOURCE_META: Record<ContentSource | "unknown", { label: string; tone: string }> = {
  arxiv: { label: "arXiv", tone: "border-cyan-400/30 text-cyan-300 bg-cyan-500/10" },
  huggingface: { label: "Hugging Face", tone: "border-violet-400/30 text-violet-300 bg-violet-500/10" },
  ollama: { label: "Ollama", tone: "border-emerald-400/30 text-emerald-300 bg-emerald-500/10" },
  alphasignal: { label: "AlphaSignal", tone: "border-amber-400/30 text-amber-300 bg-amber-500/10" },
  linkedin: { label: "LinkedIn", tone: "border-sky-400/30 text-sky-300 bg-sky-500/10" },
  github: { label: "GitHub", tone: "border-slate-400/30 text-slate-300 bg-slate-500/10" },
  rss: { label: "RSS", tone: "border-rose-400/30 text-rose-300 bg-rose-500/10" },
  other: { label: "Other", tone: "border-slate-400/30 text-slate-300 bg-slate-500/10" },
  unknown: { label: "Unknown", tone: "border-slate-400/30 text-slate-300 bg-slate-500/10" }
};

export const TREND_TOPICS = [
  "Agentic AI",
  "RAG",
  "MCP",
  "Multi-Agent",
  "Local LLM",
  "Multimodal",
  "Evaluation",
  "AI Safety",
  "Tool Calling",
  "Reasoning Models",
  "Embeddings",
  "Vector Databases"
];

export const COLLECTIONS = [
  "Daha sonra oku",
  "Önemli",
  "Araştırılacak",
  "Proje fikri",
  "Model denemeleri",
  "Arşiv"
] as const;

export const SOURCE_FILTERS = [
  "arxiv",
  "huggingface",
  "ollama",
  "alphasignal",
  "linkedin",
  "github",
  "rss",
  "other"
] as const;

export const CHART_COLORS = ["#60a5fa", "#a78bfa", "#34d399", "#f59e0b", "#f43f5e", "#94a3b8"];
