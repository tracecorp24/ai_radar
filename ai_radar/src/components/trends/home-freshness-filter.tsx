"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Clock3 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const FRESHNESS_OPTIONS = [
  { days: 7, label: "Son 1 hafta" },
  { days: 30, label: "Son 1 ay" },
  { days: 90, label: "Son 3 ay" },
  { days: 365, label: "Son 1 yıl" }
];

export function HomeFreshnessFilter({ value, resultCount }: { value: number; resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updatePeriod(days: number) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("period", String(days));
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-background/70 px-3 py-2 shadow-sm" title={`${resultCount} içerik bu dönem içinde`}>
      <Clock3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Label htmlFor="home-freshness" className="sr-only">Tazelik filtresi</Label>
      <Select
        id="home-freshness"
        value={value}
        onChange={(event) => updatePeriod(Number(event.target.value))}
        className="h-7 min-w-32 border-0 bg-transparent p-0 text-xs font-medium focus:ring-0"
      >
        {FRESHNESS_OPTIONS.map((option) => (
          <option key={option.days} value={option.days}>{option.label}</option>
        ))}
      </Select>
      <span className="hidden border-l pl-2 text-xs text-muted-foreground sm:inline">{resultCount}</span>
    </div>
  );
}
