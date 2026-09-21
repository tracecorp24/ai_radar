"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CitationTreeNode, PaperCitationAnalysis } from "@/types";
import { ChevronDown, ChevronRight, GitBranch, LoaderCircle, Network, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function Questions({ questions, compact = false }: { questions: PaperCitationAnalysis["questions"]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const shown = compact && !open ? questions.slice(0, 1) : questions;
  return <div className="space-y-2">
    {shown.map((entry) => <div key={entry.question} className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm"><p className="font-medium">{entry.question}</p><p className="mt-1 leading-6 text-muted-foreground">{entry.answer}</p></div>)}
    {compact && questions.length > 1 ? <Button variant="ghost" size="sm" className="h-auto px-1 text-xs" onClick={() => setOpen((value) => !value)}>{open ? "Soruları daralt" : `Diğer ${questions.length - 1} soruyu göster`}</Button> : null}
  </div>;
}

function CitationBranch({ node, level = 1 }: { node: CitationTreeNode; level?: number }) {
  const [open, setOpen] = useState(level === 1);
  const [childrenOpen, setChildrenOpen] = useState(false);
  return <div className="relative pl-3 sm:pl-6 before:absolute before:left-1.5 sm:before:left-2 before:top-0 before:h-full before:w-px before:bg-primary/25">
    <div className="absolute left-1.5 sm:left-2 top-6 h-px w-3 sm:w-4 bg-primary/25" />
    <Card className="border-primary/15 bg-muted/15">
      <CardHeader className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle className="text-sm leading-5">{node.title}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{[node.authors.slice(0, 2).join(", "), node.year].filter(Boolean).join(" · ") || "Kaynak bilgisi sınırlı"}</p></div>
          <Button variant="ghost" size="icon" className="shrink-0" aria-label={`${node.title} ayrıntılarını ${open ? "gizle" : "göster"}`} onClick={() => setOpen((value) => !value)}>{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</Button>
        </div>
        <p className="rounded-md bg-primary/5 p-2 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Neye atıf yapıyor?</span> {node.citationReason}</p>
      </CardHeader>
      {open ? <CardContent className="space-y-3 p-4 pt-0">
        <Questions questions={node.questions} compact />
        {node.url ? <a className="text-xs font-medium text-primary underline-offset-4 hover:underline" href={node.url} target="_blank" rel="noreferrer">Kaynak kaydını aç</a> : null}
        {node.children.length ? <div><Button variant="outline" size="sm" onClick={() => setChildrenOpen((value) => !value)}><GitBranch className="h-3.5 w-3.5" />{childrenOpen ? "Alt atıfları gizle" : `${node.children.length} alt atfı aç`}</Button>{childrenOpen ? <div className="mt-3 space-y-3">{node.children.map((child) => <CitationBranch key={child.id} node={child} level={level + 1} />)}</div> : null}</div> : null}
      </CardContent> : null}
    </Card>
  </div>;
}

export function PaperCitationTree({ paperId, startSignal, hideStartButton = false }: { paperId: string; startSignal?: number; hideStartButton?: boolean }) {
  const [analysis, setAnalysis] = useState<PaperCitationAnalysis>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAnalysis = useCallback(async (force = false) => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/research/papers/${encodeURIComponent(paperId)}/analysis${force ? "?refresh=1" : ""}`);
      const data = await response.json() as { analysis?: PaperCitationAnalysis; error?: string };
      if (!response.ok || !data.analysis) throw new Error(data.error ?? "Atıf ağı oluşturulamadı.");
      setAnalysis(data.analysis);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Atıf ağı oluşturulamadı."); }
    finally { setLoading(false); }
  }, [paperId]);
  useEffect(() => { if (startSignal) void loadAnalysis(); }, [loadAnalysis, startSignal]);

  return <section className="space-y-4" aria-labelledby="citation-tree-title">
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Derin araştırma</p><CardTitle id="citation-tree-title" className="mt-1">Makale ve atıf ağacı</CardTitle><p className="mt-2 text-sm leading-6 text-muted-foreground">İlk 10 soru, tek başına okunduğunda problemini, tezini, yöntemini, kanıtını, yeniliğini ve sınırlarını anlatacak bir okuma haritasıdır. Atıf yapılan çalışmalar aşağı doğru dallanır; her alt makalede 4 temel soru ve atıf bağlamı vardır.</p></div>
        {!hideStartButton ? <Button onClick={() => loadAnalysis(Boolean(analysis))} disabled={loading}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : analysis ? <RefreshCw className="h-4 w-4" /> : <Network className="h-4 w-4" />}{analysis ? "Yenile" : "Ağı oluştur"}</Button> : null}
      </CardHeader>
      {error ? <CardContent className="pt-0 text-sm text-destructive">{error}</CardContent> : null}
    </Card>
    {loading ? <Card><CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" /> Atıf ağacının alt kırılımları hazırlanıyor…</CardContent></Card> : null}
    {analysis ? <>
      <Card><CardContent className="space-y-4 p-5"><div className="flex flex-wrap gap-2"><Badge tone={analysis.answerSource === "ai" ? "success" : "subtle"}>{analysis.answerSource === "ai" ? `AI cevapları · ${analysis.answerModel ?? "seçili model"}` : "Yerel yedek cevaplar"}</Badge><Badge tone="subtle">10 sabit araştırma sorusu</Badge></div><div className="flex flex-wrap gap-2"><Badge tone="subtle">Anahtar kelimeler</Badge>{analysis.keywords.map((keyword) => <Badge key={keyword} tone="subtle">{keyword}</Badge>)}</div><div className="flex flex-wrap gap-2"><Badge tone="success">Teknolojiler</Badge>{analysis.technologies.map((technology) => <Badge key={technology} tone="success">{technology}</Badge>)}</div><Questions questions={analysis.questions} /><p className="text-xs text-muted-foreground">Kaynak: {analysis.source === "semantic-scholar" ? "Semantic Scholar atıf verisi" : "Yerel makale metni; dış atıf verisi alınamadı"}</p></CardContent></Card>
      <div className="space-y-3"><div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" /><h3 className="font-semibold">Atıf verilen makaleler</h3></div>{analysis.citations.length ? analysis.citations.map((node) => <CitationBranch key={node.id} node={node} />) : <Card><CardContent className="p-4 text-sm text-muted-foreground">Bu makale için erişilebilir atıf kaydı bulunamadı. Ana makale analizi yine de yukarıda gösteriliyor.</CardContent></Card>}</div>
    </> : null}
  </section>;
}
