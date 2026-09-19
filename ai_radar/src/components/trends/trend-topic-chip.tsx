import { Badge } from "@/components/ui/badge";

export function TrendTopicChip({ name, growth, count, isNew = false }: { name: string; growth: number; count: number; isNew?: boolean }) {
  return (
    <Badge tone="subtle" className="justify-between gap-2 px-3 py-2 text-xs">
      <span>{name}</span>
      <span className="text-primary">
        {isNew ? "Yeni" : `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`} · {count}
      </span>
    </Badge>
  );
}
