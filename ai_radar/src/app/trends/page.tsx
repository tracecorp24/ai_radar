import { TrendExplorer } from "@/components/trends/trend-explorer";
import { TrendSearchPanel } from "@/components/trends/trend-search-panel";
import { TrendTopicChip } from "@/components/trends/trend-topic-chip";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSourceHealthHistory } from "@/lib/services/source-service";
import { Flame, Layers3, Sparkles, Users } from "lucide-react";
import { getTrendingModels } from "@/lib/services/model-service";
import { getPeople } from "@/lib/services/person-service";
import { getResearchContent } from "@/lib/services/content-service";
import { getTrendPoints, getTrendTopics } from "@/lib/services/trend-service";

export const metadata = {
  title: "Trendler"
};
export const dynamic = "force-dynamic";

export default async function TrendsPage() {
  const [sources, models, people, research] = await Promise.all([
    getSourceHealthHistory(),
    getTrendingModels(),
    getPeople(),
    getResearchContent()
  ]);
  const [trendPoints, trendTopics] = await Promise.all([getTrendPoints(), getTrendTopics()]);

  const topModel = models[0];
  const topTopic = trendTopics[0];
  const topicName = topTopic?.name ?? "—";
  const topicGrowth = topTopic ? `+${topTopic.growth.toFixed(1)}%` : "Henüz trend snapshotı yok";
  const topPerson = [...people].sort((a, b) => b.newPostCount - a.newPostCount)[0];
  const topNovelty = [...research].sort((a, b) => b.noveltyScore - a.noveltyScore)[0];

  return (
    <div className="page-grid space-y-8">
      <SectionHeader
        eyebrow="Trendler"
        title="Grafikler ve analitik sinyal panosu"
        description="Günlük içerik yoğunluğu, konu büyümesi, kaynak dağılımı ve model trendleri tek bir sayfada."
      />

      <TrendSearchPanel />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Haftanın konusu" value={topicName} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="En aktif model" value={topModel?.name ?? "—"} icon={<Layers3 className="h-4 w-4" />} />
        <StatCard label="En yüksek yenilik" value={topNovelty?.title ?? "—"} icon={<Flame className="h-4 w-4" />} />
        <StatCard label="En aktif kişi" value={topPerson?.name ?? "—"} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.5fr]">
        <TrendExplorer initialPoints={trendPoints} initialTopics={trendTopics} sources={sources} />
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Haftanın özet insight’ları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">En hızlı yükselen konu</p>
                <p className="text-muted-foreground">{topicName} · {topicGrowth}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">En çok güncellenen model</p>
                <p className="text-muted-foreground">{topModel?.name ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">En yüksek yenilik puanı</p>
                <p className="text-muted-foreground">{topNovelty?.title ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
                <p className="font-medium">Kaynaklar arası ortak trend</p>
                <p className="text-muted-foreground">Agentic AI, MCP ve tool calling sinyalleri birlikte yükseliyor.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Konu yoğunluğu</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {trendTopics.map((topic) => (
                <TrendTopicChip key={topic.name} {...topic} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
