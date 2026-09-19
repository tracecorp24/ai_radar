"use client";

import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

export function ModelFavoriteButton({ modelId }: { modelId: string }) {
  const [favorite, setFavorite] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => { fetch(`/api/models/${modelId}/state`).then((response) => response.json()).then((data) => setFavorite(Boolean(data.isFavorite))).catch(() => undefined); }, [modelId]);
  async function toggle() {
    setPending(true);
    const next = !favorite;
    setFavorite(next);
    try { const response = await fetch(`/api/models/${modelId}/state`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isFavorite: next }) }); if (!response.ok) throw new Error(); } catch { setFavorite(!next); } finally { setPending(false); }
  }
  return <Button variant={favorite ? "default" : "outline"} disabled={pending} onClick={toggle}><Heart className="h-4 w-4" />{favorite ? "Favoride" : "Favori"}</Button>;
}
