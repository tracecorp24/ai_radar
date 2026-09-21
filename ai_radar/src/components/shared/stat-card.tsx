import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "default"
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones = {
    default: "from-primary/10 to-transparent",
    success: "from-emerald-500/10 to-transparent",
    warning: "from-amber-500/10 to-transparent",
    danger: "from-rose-500/10 to-transparent"
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className={cn("relative flex items-end justify-between gap-3 bg-gradient-to-br p-4 sm:p-5", tones[tone])}>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-xs sm:text-sm text-muted-foreground">{label}</p>
          <p className="line-clamp-2 text-lg font-semibold leading-tight tracking-tight sm:text-2xl break-words [word-break:break-word]">{value}</p>
          {delta ? <p className="text-xs text-muted-foreground">{delta}</p> : null}
        </div>
        {icon ? <div className="shrink-0 rounded-2xl border border-border bg-background/80 p-2.5 sm:p-3 text-primary">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}

