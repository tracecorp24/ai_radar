import { ContentCard } from "@/components/content/content-card";
import { ContentStateButtons } from "@/components/content/content-state-buttons";
import { PaperDeepDive } from "@/components/research/paper-deep-dive";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { ScoreBadge } from "@/components/shared/score-badge";
import { TagList } from "@/components/shared/tag-list";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { getContentById, getSimilarContent } from "@/lib/services/content-service";
import { getTrendingModels } from "@/lib/services/model-service";
import { notFound } from "next/navigation";
import { FileDown, Globe } from "lucide-react";
import Link from "next/link";

export default async function ContentDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ deepDive?: string }> }) {
  const [{ id }, { deepDive }] = await Promise.all([params, searchParams]);
  const [content, similar, models] = await Promise.all([getContentById(id), getSimilarContent(id), getTrendingModels()]);

  if (!content) {
    notFound();
  }

  const relatedModels = models.filter((model) => content.tags.some((tag) => model.tags.includes(tag))).slice(0, 3);

  return (
    <div className="page-grid grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-8">
        <SectionHeader eyebrow="İçerik detay" title={content.title} description={content.summary} />

        <Card className="border-primary/20">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="subtle">{content.source}</Badge>
              <Badge tone="subtle">{content.type}</Badge>
              {content.isBookmarked ? <Badge tone="warning">Kaydedildi</Badge> : null}
              {content.isRead ? <Badge tone="success">Okundu</Badge> : <Badge tone="subtle">Okunmadı</Badge>}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span>Yayın: {formatDate(content.publishedAt)}</span>
              <span>İlk görülme: {formatDateTime(content.firstSeenAt)}</span>
              <span>Son güncelleme: {formatDateTime(content.updatedAt)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <ScoreBadge label="Önem" value={content.relevanceScore} />
              <ScoreBadge label="Yenilik" value={content.noveltyScore} tone="success" />
              <Badge tone="subtle">Zorluk: {content.difficulty ?? "—"}</Badge>
            </div>
            <TagList tags={content.tags} />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Türkçe özet</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">{content.summary}</CardContent>
              </Card>
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Orijinal içerik</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {content.originalContent ?? "Kaynak bu kayıt için tam metin sağlamadı; özet ve orijinal bağlantı kullanılabilir."}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Ana teknik katkılar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>• {content.title} etrafında açık bir problem tanımı</p>
                  <p>• Kaynaklar arası yeniden kullanılabilir bir değerlendirme çerçevesi</p>
                  <p>• Daha sonra gerçek API ile beslenebilecek temiz bir veri modeli</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Neden önemli?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Bu kayıt, {content.tags.slice(0, 3).join(", ")} alanlarında doğrudan etkili bir sinyal taşıyor.</p>
                  <p>Skorlar, ardından gerçek veri kaynakları ile otomatik hesaplanmaya hazır.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Kullanım alanları</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  Araştırma notları, içerik özeti, model seçimi, ekip içi paylaşım ve takip listesi.
                </CardContent>
              </Card>
              <Card className="bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Sınırlamalar</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  Bu kayıt local SQLite veritabanında saklanır ve kaynak yeniden çalıştırıldığında güncellenir.
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={content.url} target="_blank" rel="noreferrer">
                  <Globe className="h-4 w-4" />
                  Orijinal kaynağı aç
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={content.arxiv?.pdfUrl ?? content.url} target="_blank" rel="noreferrer">
                  <FileDown className="h-4 w-4" />
                  PDF’i aç
                </a>
              </Button>
              {content.arxiv?.htmlUrl ? <Button variant="outline" asChild><a href={content.arxiv.htmlUrl} target="_blank" rel="noreferrer">HTML sürümünü aç</a></Button> : null}
              <ContentStateButtons content={content} />
            </div>
          </CardContent>
        </Card>

        {content.type === "paper" ? <PaperDeepDive paperId={content.id} initialDocument={content.paperDocument} autoStart={deepDive === "1"} /> : null}

        <section className="space-y-4">
          <SectionHeader eyebrow="Benzer içerikler" title="İlgili sinyaller" />
          <div className="grid gap-4 md:grid-cols-2">
            {similar.map((item) => (
              <ContentCard key={item.id} content={item} linkToDetail />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader eyebrow="İlgili modeller" title="Bu içerikle bağlantılı model adayları" />
          <div className="grid gap-4 md:grid-cols-2">
            {relatedModels.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <CardTitle className="text-base">{model.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>{model.organization}</p>
                  <p>{model.pipeline ?? "text-generation"}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/models/${model.id}`}>Model sayfasına git</Link>
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
            <CardTitle className="text-base">Bilgi paneli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Kaynak</span>
              <span className="font-medium">{content.source}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tür</span>
              <span className="font-medium">{content.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Yazarlar</span>
              <span className="font-medium text-right">{content.authors.join(", ")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">İlk görülme</span>
              <span className="font-medium">{formatDateTime(content.firstSeenAt)}</span>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
