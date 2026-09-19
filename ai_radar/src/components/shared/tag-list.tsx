import { Badge } from "@/components/ui/badge";

export function TagList({ tags, compact = false }: { tags: string[]; compact?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} tone="subtle" className={compact ? "px-2 py-0.5 text-[11px]" : ""}>
          {tag}
        </Badge>
      ))}
    </div>
  );
}

