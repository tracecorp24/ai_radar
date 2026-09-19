"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaperDocument } from "@/types";
import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export function PaperDocumentBuilder({ paperId, initialDocument, onReady, autoStart = false }: { paperId: string; initialDocument?: PaperDocument; onReady?: () => void; autoStart?: boolean }) {
  const [document, setDocument] = useState(initialDocument);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const build = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/research/papers/${encodeURIComponent(paperId)}/document`, { method: "POST" });
      const data = await response.json() as { document?: PaperDocument; error?: string };
      if (!response.ok || !data.document) throw new Error(data.error ?? "Makale işlenemedi.");
      setDocument(data.document);
      onReady?.();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Makale işlenemedi."); }
    finally { setLoading(false); }
  }, [onReady, paperId]);
  useEffect(() => { if (autoStart && !started.current) { started.current = true; void build(); } }, [autoStart, build]);
  useEffect(() => {
    if (document?.status !== "queued" && document?.status !== "processing") return;
    const interval = window.setInterval(() => {
      void fetch(`/api/research/papers/${encodeURIComponent(paperId)}/document`).then(async (response) => {
        const data = await response.json() as { document?: PaperDocument };
        if (!response.ok || !data.document) return;
        setDocument((current) => {
          if (data.document?.status === "ready" && current?.status !== "ready") onReady?.();
          return data.document;
        });
      }).catch(() => undefined);
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [document?.status, onReady, paperId]);
  return <Card className="border-primary/20 bg-primary/5">
    <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Yerel bilgi tabanı</p><CardTitle className="mt-1">TeX/PDF için derin inceleme</CardTitle><p className="mt-2 text-sm leading-6 text-muted-foreground">Yeni arXiv makaleleri arka planda işlenir: TeX kaynağı varsa güvenli biçimde yerel arşive alınır, yoksa PDF ayrıştırılır. Başlık ve özet akışı bu işlemden beklemez.</p></div><Button onClick={build} disabled={loading || document?.status === "processing"}>{loading || document?.status === "processing" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : document?.status === "ready" ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}{document?.status === "ready" ? "DEEP DIVE’ı yenile" : document?.status === "queued" ? "Kuyrukta" : document?.status === "processing" ? "İşleniyor" : "Şimdi işle"}</Button></CardHeader>
    {error ? <CardContent className="pt-0 text-sm text-destructive">{error}</CardContent> : null}
    {document?.status === "queued" || document?.status === "processing" ? <CardContent className="pt-0 text-sm text-muted-foreground">{document.status === "queued" ? "Arka plan kuyruğunda; scheduler bir sonraki turda işleyecek." : "Kaynak indiriliyor ve yerel bilgi tabanı hazırlanıyor."}</CardContent> : null}
    {document?.status === "ready" ? <CardContent className="flex flex-wrap gap-2 pt-0 text-sm"><Badge tone="success">Hazır</Badge><Badge tone="subtle">{document.sourceKind === "tex" ? "TeX kaynağı" : "PDF yedeği"}</Badge>{document.sourceFileCount ? <Badge tone="subtle">{document.sourceFileCount} kaynak dosya</Badge> : null}<Badge tone="subtle">{document.pageCount ?? 0} sayfa</Badge><Badge tone="subtle">{document.characterCount?.toLocaleString("tr-TR") ?? 0} karakter</Badge><Badge tone="subtle">{document.appendixCount ?? 0} ek bölümü</Badge><Badge tone="subtle">{document.referenceCount ?? 0} kaynak</Badge><Badge tone="subtle">{document.citationLocations?.length ?? 0} atıf konumu</Badge></CardContent> : null}
  </Card>;
}
