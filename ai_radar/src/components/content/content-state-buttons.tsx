"use client";

import { Button } from "@/components/ui/button";
import type { ContentItem } from "@/types";
import { Bookmark, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ContentStateButtons({ content, compact = false }: { content: ContentItem; compact?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState({ isBookmarked: content.isBookmarked, isRead: content.isRead });
  const [pending, setPending] = useState(false);

  async function update(patch: Partial<typeof state>) {
    if (pending) return;
    const previous = state;
    setState({ ...state, ...patch });
    setPending(true);
    try {
      const response = await fetch(`/api/content/${content.id}/state`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
      if (!response.ok) throw new Error("İşlem başarısız.");
      router.refresh();
    } catch {
      setState(previous);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant={state.isBookmarked ? "default" : "outline"} size="sm" disabled={pending} onClick={() => update({ isBookmarked: !state.isBookmarked })}>
        <Bookmark className="h-4 w-4" /> {state.isBookmarked ? "Kaydedildi" : compact ? "Kaydet" : "Favoriye ekle"}
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => update({ isRead: !state.isRead })}>
        <CheckCircle2 className="h-4 w-4" /> {state.isRead ? "Okundu" : "Okundu işaretle"}
      </Button>
    </div>
  );
}
