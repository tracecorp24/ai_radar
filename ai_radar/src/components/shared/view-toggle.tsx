import { Button } from "@/components/ui/button";

export type ViewMode = "grid" | "list" | "compact";

export function ViewToggle({
  value,
  onChange
}: {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-background p-1">
      {(["grid", "list", "compact"] as const).map((mode) => (
        <Button
          key={mode}
          variant={value === mode ? "default" : "ghost"}
          size="sm"
          className="h-8 rounded-lg px-3 capitalize"
          onClick={() => onChange(mode)}
        >
          {mode}
        </Button>
      ))}
    </div>
  );
}

