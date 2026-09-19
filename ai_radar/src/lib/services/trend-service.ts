import { getTrendData, listCollections } from "@/lib/local-db";
import { analyzeStoredTrends, getTrendAnalysisState } from "@/lib/services/autonomous-trend-analysis-service";
export async function getTrendPoints() { return getTrendData(14).points; }
export async function getTrendTopics() { return (getTrendAnalysisState() ?? analyzeStoredTrends()).topics; }
export async function getTrendAnalysisStatus() { return getTrendAnalysisState() ?? analyzeStoredTrends(); }
export async function getBookmarkCollections() { return listCollections(); }
