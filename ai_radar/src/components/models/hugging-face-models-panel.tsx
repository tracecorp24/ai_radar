import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/formatters";
import type { ModelItem } from "@/types";
import { ArrowRight, Boxes, Download, Heart } from "lucide-react";
import Link from "next/link";

export function HuggingFaceModelsPanel({ models }: { models: ModelItem[] }) {
  return (
    <Card>
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Boxes className="h-4 w-4 text-violet-400" />
            Hugging Face modelleri
          </CardTitle>
          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
            <Link href="/models">
              Tümü
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Trend skoruna göre yükselen modeller</p>
      </CardHeader>
      <CardContent className="space-y-1">
        {models.length ? (
          models.slice(0, 5).map((model, index) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="group flex items-start gap-2 rounded-xl px-2 py-2.5 transition hover:bg-muted/60"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-semibold text-violet-400">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium group-hover:text-primary">
                  {model.name}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="truncate">{model.organization}</span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {formatNumber(model.downloads)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatNumber(model.likes)}
                  </span>
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400">
                {model.trendScore}
              </span>
            </Link>
          ))
        ) : (
          <p className="rounded-xl border border-dashed px-3 py-5 text-center text-xs leading-5 text-muted-foreground">
            Hugging Face kaynağı çalıştırıldığında yükselen modeller burada görünecek.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
