"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { SearchItem } from "@/lib/services/search-service";
import { Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json();
        setResults(data.items ?? []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 120 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  return (
    <>
      <Button variant="outline" className="hidden md:inline-flex" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
        Ara
        <span className="ml-2 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground">Ctrl K</span>
      </Button>
      <Button variant="outline" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Ara">
        <Search className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Savvy&#39;de ara</DialogTitle>
            <DialogDescription>İçerikler, modeller, kişiler, kaynaklar ve etiketler arasında hızlı arama.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ara: MCP, RAG, Sara Kim, arXiv..."
            />
            <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
              {loading ? <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Aranıyor...</div> : results.length ? (
                results.map((item) => (
                  <Link
                    key={`${item.category}-${item.id}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3 transition hover:border-primary/40 hover:bg-accent"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        <Badge tone="subtle">{item.category}</Badge>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>
                    <Sparkles className="mt-1 h-4 w-4 text-primary opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Sonuç bulunamadı. Farklı bir anahtar kelime deneyin.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
