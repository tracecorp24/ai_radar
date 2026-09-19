import { SOURCE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ContentSource } from "@/types";

export function SourceBadge({ source, className }: { source: ContentSource; className?: string }) {
  const meta = SOURCE_META[source] ?? SOURCE_META.unknown;
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", meta.tone, className)}>{meta.label}</span>;
}

