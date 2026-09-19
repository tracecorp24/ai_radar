"use client";

import { GithubDeepDive } from "@/components/research/github-deep-dive";
import { PaperDeepDive } from "@/components/research/paper-deep-dive";
import { TagList } from "@/components/shared/tag-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ContentItem } from "@/types";
import { ArrowUpRight, Sparkles } from "lucide-react";

export function ContentDetailDialog({ content, startDeepDive = false }: { content: ContentItem; startDeepDive?: boolean }) {
  return <Dialog><DialogTrigger asChild><Button size="sm" variant={startDeepDive ? "secondary" : "default"}>{startDeepDive ? <><Sparkles className="h-4 w-4" /> DEEP DIVE</> : "Detayları gör"}</Button></DialogTrigger><DialogContent className="max-w-6xl max-h-[88vh] overflow-y-auto"><DialogHeader><div className="flex flex-wrap gap-2 pr-8"><Badge tone="subtle">{content.source}</Badge><Badge tone="subtle">{content.type}</Badge></div><DialogTitle className="editorial-title pr-8">{content.title}</DialogTitle><DialogDescription>{content.summary}</DialogDescription></DialogHeader><div className="mt-5 space-y-5"><TagList tags={content.tags} /><div className="grid gap-4 lg:grid-cols-2"><Card><CardContent className="p-4"><p className="text-sm font-medium">Yazarlar ve tarih</p><p className="mt-2 text-sm text-muted-foreground">{content.authors.join(", ") || "Belirtilmemiş"} · {new Date(content.publishedAt).toLocaleDateString("tr-TR")}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm font-medium">İçerik özeti</p><p className="mt-2 line-clamp-6 text-sm text-muted-foreground">{content.originalContent ?? content.summary}</p></CardContent></Card></div>{content.type === "paper" ? <PaperDeepDive paperId={content.id} initialDocument={content.paperDocument} autoStart={startDeepDive} /> : null}{content.source === "github" ? <GithubDeepDive contentId={content.id} initialDocument={content.repositoryDocument} autoStart={startDeepDive} /> : null}<Button asChild variant="outline" size="sm"><a href={content.url} target="_blank" rel="noreferrer">Orijinal kaynağı aç <ArrowUpRight className="h-4 w-4" /></a></Button></div></DialogContent></Dialog>;
}
