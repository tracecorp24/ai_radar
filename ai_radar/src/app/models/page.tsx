import { ModelExplorer } from "@/components/models/model-explorer";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { getModels } from "@/lib/services/model-service";
import { Download, Layers3, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Modeller"
};
export const dynamic = "force-dynamic";

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ compare?: string }> }) {
  const { compare } = await searchParams;
  const models = await getModels();
  const avgTrend = models.length ? Math.round(models.reduce((sum, model) => sum + model.trendScore, 0) / models.length) : 0;
  const totalDownloads = models.reduce((sum, model) => sum + model.downloads, 0);

  return (
    <div className="page-grid space-y-8">
      <SectionHeader
        eyebrow="Modeller"
        title="Hugging Face ve Ollama model keşfi"
        description="Kaynak, organizasyon, pipeline, boyut, lisans ve trend skoruna göre filtrelenebilen, karşılaştırmaya hazır görünüm."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Toplam model" value={String(models.length)} icon={<Layers3 className="h-4 w-4" />} />
        <StatCard label="Toplam indirme" value={totalDownloads.toLocaleString("tr-TR")} icon={<Download className="h-4 w-4" />} />
        <StatCard label="Ortalama trend" value={String(avgTrend)} icon={<TrendingUp className="h-4 w-4" />} />
      </div>

      <ModelExplorer models={models} initialCompareIds={compare?.split(",").filter(Boolean)} />
    </div>
  );
}
