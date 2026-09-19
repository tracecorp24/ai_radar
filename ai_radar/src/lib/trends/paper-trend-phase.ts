import type { TrendPhase } from "@/types";

export interface PaperTrendSignals {
  publishedAt: string;
  trendScore: number;
  momentumScore: number;
  engagementScore?: number;
}

export function classifyPaperTrendPhase(signals: PaperTrendSignals): TrendPhase | undefined {
  const published = new Date(signals.publishedAt).getTime();
  const ageHours = Number.isFinite(published) ? Math.max(0, (Date.now() - published) / 3_600_000) : Number.POSITIVE_INFINITY;
  const engagement = signals.engagementScore ?? 0;

  if (ageHours <= 72 && signals.trendScore >= 55 && (signals.momentumScore >= 35 || engagement >= 45)) return "hot";
  if (signals.trendScore >= 75 || engagement >= 70) return "trending";
  return undefined;
}

export function trendPhaseReason(phase: TrendPhase) {
  return phase === "hot" ? "Hot: yeni ve ivmeleniyor" : "Trend: güçlü sinyal yerleşmiş";
}
