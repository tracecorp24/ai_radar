import { LoadingGridSkeleton } from "@/components/shared/loading-skeleton";

export default function Loading() {
  return (
    <div className="page-grid space-y-6">
      <div className="h-28 animate-pulse rounded-3xl bg-muted/60" />
      <LoadingGridSkeleton count={6} />
    </div>
  );
}

