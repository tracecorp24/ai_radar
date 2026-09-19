"use client";

import { PaperCitationTree } from "@/components/research/paper-citation-tree";
import { PaperDocumentBuilder } from "@/components/research/paper-document-builder";
import type { PaperDocument } from "@/types";
import { useState } from "react";

export function PaperDeepDive({ paperId, initialDocument, autoStart = false }: { paperId: string; initialDocument?: PaperDocument; autoStart?: boolean }) {
  const [startSignal, setStartSignal] = useState(initialDocument?.status === "ready" ? 1 : 0);
  return <div className="space-y-8">
    <PaperDocumentBuilder paperId={paperId} initialDocument={initialDocument} autoStart={autoStart} onReady={() => setStartSignal((value) => value + 1)} />
    <PaperCitationTree paperId={paperId} startSignal={startSignal} hideStartButton />
  </div>;
}
