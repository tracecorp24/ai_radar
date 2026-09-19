import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { ScoreBadge } from "@/components/shared/score-badge";
import { TagList } from "@/components/shared/tag-list";
import { formatDate, formatNumber, formatPercent } from "@/lib/formatters";
import { getModelById, getTrendingModels } from "@/lib/services/model-service";
import { notFound } from "next/navigation";
import { ArrowUpRight, Download } from "lucide-react";
import Link from "next/link";
import { ModelFavoriteButton } from "@/components/models/model-favorite-button";

export default async function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [model, models] = await Promise.all([getModelById(id), getTrendingModels()]);

  if (!model) {
    notFound();
  }

  const similar = models.filter((item) => item.id !== model.id && item.tags.some((tag) => model.tags.includes(tag))).slice(0, 3);

  return (
    <div className="page-grid grid gap-8 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-8">
        <SectionHeader eyebrow="Model detay" title={model.name} description={model.description} />

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="subtle">{model.source}</Badge>
              <Badge tone="subtle">{model.pipeline ?? "text-generation"}</Badge>
              <Badge tone="subtle">{model.quantization ?? "—"}</Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>{model.organization}</span>
              <span>•</span>
              <span>{model.modelId}</span>
              <span>•</span>
              <span>Güncelleme: {formatDate(model.updatedAt)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <ScoreBadge label="Trend" value={model.trendScore} tone="success" />
              <Badge tone="subtle">Parametre: {model.parameterSize ?? "—"}</Badge>
              <Badge tone="subtle">Context: {model.contextLength ? model.contextLength.toLocaleString("tr-TR") : "—"}</Badge>
              <Badge tone="subtle">Lisans: {model.license ?? "—"}</Badge>
            </div>
            <TagList tags={model.tags} />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Model özeti</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{model.description}</CardContent>
              </Card>
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Kullanım notları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• {model.pipeline ?? "text-generation"} pipeline için uygun</p>
                  <p>• {formatNumber(model.downloads)} indirme</p>
                  <p>• Günlük büyüme {formatPercent(model.dailyGrowth)}</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={model.url} target="_blank" rel="noreferrer">
                  <ArrowUpRight className="h-4 w-4" />
                  Model sayfası
                </a>
              </Button>
              <Button asChild variant="outline"><Link href={`/models?compare=${encodeURIComponent(model.id)}`}><Download className="h-4 w-4" />Karşılaştırmaya ekle</Link></Button>
              <ModelFavoriteButton modelId={model.id} />
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <SectionHeader eyebrow="Benzer modeller" title="İlgili model adayları" />
          <div className="grid gap-4 md:grid-cols-2">
            {similar.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-base">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{item.organization}</p>
                  <p>{item.pipeline ?? "text-generation"}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/models/${item.id}`}>Detayı aç</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metrikler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">İndirme</span>
              <span className="font-medium">{formatNumber(model.downloads)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Like</span>
              <span className="font-medium">{formatNumber(model.likes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Günlük büyüme</span>
              <span className="font-medium">{formatPercent(model.dailyGrowth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Haftalık büyüme</span>
              <span className="font-medium">{formatPercent(model.weeklyGrowth)}</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
