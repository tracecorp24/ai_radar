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
      <CardContent className={cn("relative flex items-end justify-between gap-4 bg-gradient-to-br p-5", tones[tone])}>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {delta ? <p className="text-xs text-muted-foreground">{delta}</p> : null}
        </div>
        {icon ? <div className="rounded-2xl border border-border bg-background/80 p-3 text-primary">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}

