import { Card, CardContent } from "@/components/ui/card";

export function LoadingSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="h-4 animate-pulse rounded-full bg-muted" />
        ))}
      </CardContent>
    </Card>
  );
}

export function LoadingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <LoadingSkeleton key={index} lines={index % 3 === 0 ? 6 : 4} />
      ))}
    </div>
  );
}

