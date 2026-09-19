"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeTrendActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/trends/analyze", { method: "POST" });
      if (!response.ok) throw new Error("Trend analizi yenilenemedi.");
      setMessage("Trendler güncellendi");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Trend analizi yenilenemedi.");
    } finally { setLoading(false); }
  }

  return <div className="flex flex-col items-end gap-1"><Button onClick={refresh} disabled={loading} variant="outline"><RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "Analiz ediliyor..." : "Trendleri güncelle"}</Button>{message ? <span className="text-xs text-muted-foreground" role="status">{message}</span> : null}</div>;
}
