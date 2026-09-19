import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { SourceManager } from "@/components/sources/source-manager";
import { getSources } from "@/lib/services/source-service";
import { Radar, RefreshCcw, TriangleAlert } from "lucide-react";

export const metadata = {
  title: "Kaynaklar"
};
export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await getSources();
  const active = sources.filter((source) => source.status === "active").length;
  const errors = sources.filter((source) => source.status === "error").length;
  const newItems = sources.reduce((sum, source) => sum + source.newItems, 0);

  return (
    <div className="page-grid space-y-8">
      <SectionHeader
        eyebrow="Kaynaklar"
        title="Kaynak yönetimi ve manuel çalıştırma"
        description="arXiv, RSS/Atom, GitHub, Hugging Face ve local Ollama kaynaklarını yönetin; çalışma geçmişini ve hataları izleyin."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Aktif kaynak" value={String(active)} icon={<Radar className="h-4 w-4" />} />
        <StatCard label="Hatalı kaynak" value={String(errors)} icon={<TriangleAlert className="h-4 w-4" />} />
        <StatCard label="Bulunan içerik" value={String(newItems)} icon={<RefreshCcw className="h-4 w-4" />} />
      </div>

      <SourceManager sources={sources} />
    </div>
  );
}
