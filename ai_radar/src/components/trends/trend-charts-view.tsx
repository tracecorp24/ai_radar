"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHART_COLORS } from "@/lib/constants";
import type { SourceStatus, TrendPoint, TrendTopic } from "@/types";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ReactNode } from "react";

function ChartShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-0"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="h-[280px] pt-4">{children}</CardContent>
    </Card>
  );
}

export function TrendChartsView({ points, topics, sources }: { points: TrendPoint[]; topics: TrendTopic[]; sources: SourceStatus[] }) {
  const sourceDistribution = sources.map((source, index) => ({ name: source.name, value: source.totalItems, color: CHART_COLORS[index % CHART_COLORS.length] }));
  const axis = { tick: { fontSize: 12 } };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartShell title="Günlere göre içerik sayısı"><ResponsiveContainer width="100%" height="100%"><LineChart data={points}><CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" /><XAxis dataKey="date" tickFormatter={(value) => value.slice(5, 10)} {...axis} /><YAxis {...axis} /><Tooltip /><Line type="monotone" dataKey="contentCount" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></ChartShell>
      <ChartShell title="En hızlı yükselen konular"><ResponsiveContainer width="100%" height="100%"><BarChart data={topics.slice(0, 8)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" /><XAxis type="number" {...axis} /><YAxis dataKey="name" type="category" width={110} {...axis} /><Tooltip /><Bar dataKey="growth" fill={CHART_COLORS[1]} radius={[0, 10, 10, 0]} /></BarChart></ResponsiveContainer></ChartShell>
      <ChartShell title="Kaynaklara göre içerik dağılımı"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3}>{sourceDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></ChartShell>
      <ChartShell title="Model indirme büyümesi"><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" /><XAxis dataKey="date" tickFormatter={(value) => value.slice(5, 10)} {...axis} /><YAxis {...axis} /><Tooltip /><Area type="monotone" dataKey="modelDownloads" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.18} /></AreaChart></ResponsiveContainer></ChartShell>
      <ChartShell title="Haftalık makale artışı"><ResponsiveContainer width="100%" height="100%"><LineChart data={points}><CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" /><XAxis dataKey="date" tickFormatter={(value) => value.slice(5, 10)} {...axis} /><YAxis {...axis} /><Tooltip /><Line type="monotone" dataKey="weeklyArticles" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></ChartShell>
      <ChartShell title="Kaynak sağlık geçmişi"><ResponsiveContainer width="100%" height="100%"><LineChart data={points}><CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" /><XAxis dataKey="date" tickFormatter={(value) => value.slice(5, 10)} {...axis} /><YAxis domain={[0, 100]} {...axis} /><Tooltip /><Line type="monotone" dataKey="sourceHealth" stroke={CHART_COLORS[4]} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></ChartShell>
    </div>
  );
}
