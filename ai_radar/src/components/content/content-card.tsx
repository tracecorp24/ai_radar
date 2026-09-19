import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/types";
import { BookMarked, Clock3, Flame, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { SourceBadge } from "../shared/source-badge";
import { ScoreBadge } from "../shared/score-badge";
import { TagList } from "../shared/tag-list";
import { ContentDetailDialog } from "./content-detail-dialog";
import { ContentStateButtons } from "./content-state-buttons";

export function ContentCard({ content, variant = "default", className, linkToDetail = false }: { content: ContentItem; variant?: "featured" | "default" | "compact" | "list"; className?: string; linkToDetail?: boolean }) {
  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";
  const isList = variant === "list";
  return <Card className={cn("group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft", isFeatured && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent", isCompact && "shadow-none", linkToDetail && "cursor-pointer hover:border-primary/30", className)}>
    {linkToDetail ? <Link href={`/content/${content.id}`} aria-label={`${content.title} detayına git`} className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" /> : null}
    <CardHeader className={cn("space-y-3", isCompact && "p-4", isList && "p-4", linkToDetail && "pointer-events-none relative z-10")}><div className="flex flex-wrap items-center gap-2"><SourceBadge source={content.source} /><Badge tone="subtle">{content.type}</Badge>{content.trendPhase === "hot" ? <Badge tone="warning"><Flame className="mr-1 h-3 w-3" />Hot · yükseliyor</Badge> : null}{content.trendPhase === "trending" ? <Badge tone="success"><TrendingUp className="mr-1 h-3 w-3" />Trend · yerleşmiş</Badge> : null}{content.isFeatured ? <Badge tone="success"><Sparkles className="mr-1 h-3 w-3" />Öne çıkan</Badge> : null}</div><div className="space-y-2"><CardTitle className={cn("editorial-title leading-tight", isFeatured && "text-2xl sm:text-3xl")}>{content.title}</CardTitle><CardDescription className={cn("line-clamp-3", isFeatured && "text-base leading-7")}>{content.summary}</CardDescription></div></CardHeader>
    <CardContent className={cn("space-y-4", isCompact && "p-4 pt-0", isList && "p-4 pt-0", linkToDetail && "pointer-events-none relative z-10")}><div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>{content.authors.join(", ")}</span><span>•</span><span>{formatDate(content.publishedAt)}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatDate(content.firstSeenAt)}</span></div>{!isCompact ? <TagList tags={content.tags.slice(0, isFeatured ? 5 : 4)} compact /> : null}<div className="flex flex-wrap items-center gap-2"><ScoreBadge label="Önem" value={content.relevanceScore} tone="default" /><ScoreBadge label="Yenilik" value={content.noveltyScore} tone="success" />{content.trendScore !== undefined ? <ScoreBadge label="Trend" value={content.trendScore} tone="warning" /> : null}{content.isBookmarked ? <Badge tone="warning"><BookMarked className="mr-1 h-3 w-3" />Kaydedildi</Badge> : null}</div>
      {!isCompact ? <div className={cn("flex flex-wrap gap-2", linkToDetail && "pointer-events-auto relative z-20")}><ContentDetailDialog content={content} />{(content.type === "paper" && content.arxiv?.pdfUrl) || content.source === "github" ? <ContentDetailDialog content={content} startDeepDive /> : null}<Button asChild variant="outline" size="sm"><a href={content.url} target="_blank" rel="noreferrer">Orijinal kaynağı aç</a></Button>{content.arxiv?.pdfUrl ? <Button asChild variant="outline" size="sm"><a href={content.arxiv.pdfUrl} target="_blank" rel="noreferrer">PDF</a></Button> : null}{content.arxiv?.htmlUrl ? <Button asChild variant="outline" size="sm"><a href={content.arxiv.htmlUrl} target="_blank" rel="noreferrer">HTML</a></Button> : null}</div> : null}
      {!isCompact ? <div className={cn(linkToDetail && "pointer-events-auto relative z-20")}><ContentStateButtons content={content} compact={isList} /></div> : null}
    </CardContent>
  </Card>;
}
