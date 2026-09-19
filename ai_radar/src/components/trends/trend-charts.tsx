"use client";

import dynamic from "next/dynamic";
import type { SourceStatus, TrendPoint, TrendTopic } from "@/types";

const TrendChartsView = dynamic(() => import("./trend-charts-view").then((module) => module.TrendChartsView), {
  ssr: false,
  loading: () => <div className="grid min-h-[560px] gap-4 rounded-2xl bg-muted/20 p-4" aria-label="Grafikler yükleniyor" />
});

export function TrendCharts(props: { points: TrendPoint[]; topics: TrendTopic[]; sources: SourceStatus[] }) {
  return <TrendChartsView {...props} />;
}
