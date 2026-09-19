import { ResearchExplorer } from "@/components/research/research-explorer";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { getResearchContent } from "@/lib/services/content-service";
import { Filter, Layers3, Sparkles } from "lucide-react";

export const metadata = {
  title: "Araştırmalar"
};
export const dynamic = "force-dynamic";

export default async function ResearchPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag = "" } = await searchParams;
  const items = await getResearchContent();
  const featured = items.filter((item) => item.isFeatured).length;
  const avgScore = items.length ? Math.round(items.reduce((sum, item) => sum + (item.trendScore ?? item.relevanceScore), 0) / items.length) : 0;

  return (
    <div className="page-grid space-y-8">
      <SectionHeader
        eyebrow="Araştırmalar"
        title="Makale odaklı araştırma akışı"
        description="Kaynak, kategori, tarih, yazar, etiket, önem, yenilik ve okunma durumuna göre filtrelenebilen bir görünüm."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Toplam içerik" value={String(items.length)} icon={<Layers3 className="h-4 w-4" />} />
        <StatCard label="Öne çıkan" value={String(featured)} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Ortalama önem" value={String(avgScore)} icon={<Filter className="h-4 w-4" />} />
      </div>

      <ResearchExplorer items={items} initialTag={tag} />
    </div>
  );
}
