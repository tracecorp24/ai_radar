import type { ContentAdapter } from "./generic-content-adapter";
import { normalizeGenericContent } from "./generic-content-adapter";

export interface ArxivPaper {
  id: string;
  title: string;
  abstract: string;
  url: string;
  authors: string[];
  publishedAt: string;
  categories?: string[];
  pdfUrl?: string;
  htmlUrl?: string;
  texUrl?: string;
  version?: string;
}

export const arxivAdapter: ContentAdapter<ArxivPaper> = {
  normalize(input) {
    return normalizeGenericContent({
      id: input.id,
      source: "arxiv",
      type: "paper",
      title: input.title,
      summary: input.abstract,
      url: input.url,
      authors: input.authors,
      tags: input.categories,
      publishedAt: input.publishedAt,
      trendScore: 0,
      arxiv: {
        absUrl: input.url,
        pdfUrl: input.pdfUrl ?? input.url.replace("/abs/", "/pdf/") + ".pdf",
        htmlUrl: input.htmlUrl,
        texUrl: input.texUrl,
        categories: input.categories ?? [],
        version: input.version
      }
    });
  }
};
