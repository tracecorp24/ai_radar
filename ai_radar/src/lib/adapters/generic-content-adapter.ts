import type { ContentItem, ContentSource, ContentType } from "@/types";

export interface ContentAdapter<T> {
  normalize(input: T): ContentItem;
}

export interface GenericExternalContent {
  id: string;
  source: ContentSource;
  type: ContentType;
  title: string;
  summary: string;
  url: string;
  authors?: string[];
  tags?: string[];
  publishedAt?: string;
  trendScore?: number;
  trendReasons?: string[];
  arxiv?: ContentItem["arxiv"];
  github?: ContentItem["github"];
}

export function normalizeGenericContent(input: GenericExternalContent): ContentItem {
  return {
    id: input.id,
    source: input.source,
    type: input.type,
    externalId: input.id,
    title: input.title,
    summary: input.summary,
    url: input.url,
    authors: input.authors ?? [],
    publishedAt: input.publishedAt ?? new Date().toISOString(),
    firstSeenAt: input.publishedAt ?? new Date().toISOString(),
    tags: input.tags ?? [],
    relevanceScore: 0,
    noveltyScore: 0,
    trendScore: input.trendScore,
    trendReasons: input.trendReasons,
    arxiv: input.arxiv,
    github: input.github,
    isBookmarked: false,
    isRead: false
  };
}
