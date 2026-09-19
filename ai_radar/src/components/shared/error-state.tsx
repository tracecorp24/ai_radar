import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

export function ErrorState({
  title = "Bir hata oluştu",
  description = "İçerik yüklenemedi. Lütfen tekrar deneyin.",
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-rose-500/30 bg-rose-500/5">
      <CardContent className="flex flex-col items-start gap-4 p-8">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw className="h-4 w-4" />
            Tekrar dene
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

