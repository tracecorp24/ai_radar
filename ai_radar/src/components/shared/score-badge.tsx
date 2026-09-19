import { Badge } from "@/components/ui/badge";

export function ScoreBadge({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" | "danger" }) {
  return (
    <Badge tone={tone}>
      {label}: {value}
    </Badge>
  );
}

