"use client";

import { TrendCharts } from "@/components/trends/trend-charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SourceStatus, TrendPoint, TrendTopic } from "@/types";
import Link from "next/link";
import { useState } from "react";

type Range = "7d" | "14d" | "30d";

export function TrendExplorer({ initialPoints, initialTopics, sources }: { initialPoints: TrendPoint[]; initialTopics: TrendTopic[]; sources: SourceStatus[] }) {
  const [range, setRange] = useState<Range>("14d");
  const [points, setPoints] = useState(initialPoints);
  const [topics, setTopics] = useState(initialTopics);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TrendTopic | null>(initialTopics[0] ?? null);

  async function changeRange(nextRange: Range) {
    setRange(nextRange); setLoading(true);
    try {
      const response = await fetch(`/api/trends?range=${nextRange}`);
      const payload = await response.json();
      if (response.ok) { setPoints(payload.data.points ?? []); setTopics(payload.data.topics ?? []); setSelectedTopic(payload.data.topics?.[0] ?? null); }
    } finally { setLoading(false); }
  }

  return <div className="space-y-4">
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="text-sm font-medium">Analiz aralığı</p><p className="text-xs text-muted-foreground">Snapshot verileri seçilen zaman penceresine göre yeniden hesaplanır.</p></div><div className="flex gap-2">{(["7d", "14d", "30d"] as Range[]).map((value) => <Button key={value} size="sm" variant={range === value ? "default" : "outline"} disabled={loading} onClick={() => changeRange(value)}>{value === "7d" ? "7 gün" : value === "14d" ? "14 gün" : "30 gün"}</Button>)}</div></CardContent></Card>
    <TrendCharts points={points} topics={topics} sources={sources} />
    <Card><CardContent className="flex flex-wrap items-center gap-2 p-4"><span className="mr-2 text-sm font-medium">Konu detayına in:</span>{topics.map((topic) => <Button key={topic.name} size="sm" variant={selectedTopic?.name === topic.name ? "default" : "outline"} onClick={() => setSelectedTopic(topic)}>{topic.name}</Button>)}{selectedTopic ? <Button asChild size="sm" variant="ghost"><Link href={`/research?tag=${encodeURIComponent(selectedTopic.name)}`}>“{selectedTopic.name}” içeriklerini aç · {selectedTopic.count}</Link></Button> : <span className="text-sm text-muted-foreground">Bu aralıkta konu sinyali yok.</span>}</CardContent></Card>
  </div>;
}
