import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber, formatPercent } from "@/lib/formatters";
import type { ModelItem } from "@/types";
import { ArrowUpRight, Download, Heart } from "lucide-react";
import Link from "next/link";
import { SourceBadge } from "../shared/source-badge";
import { ScoreBadge } from "../shared/score-badge";
import { TagList } from "../shared/tag-list";

export function ModelCard({ model }: { model: ModelItem }) {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source={model.source === "other" ? "other" : model.source} />
          <Badge tone="subtle">{model.pipeline ?? "text-generation"}</Badge>
        </div>
        <div className="space-y-1 min-w-0">
          <CardTitle className="editorial-title break-words [word-break:break-word]">{model.name}</CardTitle>
          <CardDescription className="truncate">{model.organization}</CardDescription>
          <p className="text-xs text-muted-foreground truncate" title={model.modelId}>{model.modelId}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{model.description}</p>
        <TagList tags={model.tags.slice(0, 4)} compact />
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Parametre</p>
            <p className="font-medium">{model.parameterSize ?? "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Context</p>
            <p className="font-medium">{model.contextLength ? `${model.contextLength.toLocaleString("tr-TR")} token` : "—"}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">İndirme</p>
            <p className="font-medium">{formatNumber(model.downloads)}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Büyüme</p>
            <p className="font-medium">{formatPercent(model.dailyGrowth)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScoreBadge label="Trend" value={model.trendScore} tone="success" />
          <Badge tone="subtle">
            <Download className="mr-1 h-3 w-3" />
            {formatNumber(model.downloads)}
          </Badge>
          <Badge tone="subtle">
            <Heart className="mr-1 h-3 w-3" />
            {formatNumber(model.likes)}
          </Badge>
          <Badge tone="subtle">{formatDate(model.updatedAt)}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={`/models/${model.id}`}>
              Model sayfası
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={model.url} target="_blank" rel="noreferrer">
              Kaynağı aç
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

