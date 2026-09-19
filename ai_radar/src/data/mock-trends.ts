import type { BookmarkCollection, TrendPoint, TrendTopic } from "@/types";
import { isoDaysAgo } from "@/lib/time";

export const mockTrendPoints: TrendPoint[] = Array.from({ length: 14 }, (_, index) => {
  const offset = 13 - index;
  return {
    date: isoDaysAgo(offset),
    contentCount: [11, 13, 12, 15, 18, 19, 22, 24, 23, 26, 28, 29, 31, 34][index],
    modelDownloads: [84, 88, 90, 94, 99, 103, 112, 118, 121, 129, 137, 144, 151, 160][index] * 1000,
    weeklyArticles: [4, 5, 5, 6, 7, 7, 8, 9, 8, 9, 10, 10, 11, 12][index],
    sourceHealth: [94, 94, 92, 92, 90, 91, 91, 89, 89, 90, 91, 92, 93, 94][index]
  };
});

export const mockTrendTopics: TrendTopic[] = [
  { name: "Agentic AI", growth: 32.4, count: 28 },
  { name: "MCP", growth: 28.1, count: 24 },
  { name: "RAG", growth: 22.7, count: 26 },
  { name: "Local LLM", growth: 19.5, count: 18 },
  { name: "Multimodal", growth: 18.8, count: 17 },
  { name: "Reasoning Models", growth: 17.4, count: 21 },
  { name: "Evaluation", growth: 16.2, count: 14 },
  { name: "Tool Calling", growth: 15.5, count: 19 }
];

export const bookmarkCollections: BookmarkCollection[] = [
  { id: "later", name: "Daha sonra oku", description: "Hızlı takip etmek istediğin içerikler", itemIds: ["content-01", "content-04", "content-12"] },
  { id: "important", name: "Önemli", description: "Araştırma kararlarını etkileyen içerikler", itemIds: ["content-02", "content-05", "content-18"] },
  { id: "research", name: "Araştırılacak", description: "Derinlemesine inceleme gerektiren içerikler", itemIds: ["content-07", "content-09", "content-16"] },
  { id: "idea", name: "Proje fikri", description: "Ürün ve prototip fikirleri", itemIds: ["content-06", "content-10"] },
  { id: "models", name: "Model denemeleri", description: "Yerel deneme ve benchmark adayları", itemIds: ["content-03", "content-08", "content-15"] },
  { id: "archive", name: "Arşiv", description: "Sonradan referans için saklananlar", itemIds: ["content-11", "content-13", "content-20"] }
];

