import type { ContentAdapter } from "./generic-content-adapter";
import { normalizeGenericContent } from "./generic-content-adapter";

export interface RssEntry {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt?: string;
  categories?: string[];
}

export const rssAdapter: ContentAdapter<RssEntry> = {
  normalize(input) {
    return normalizeGenericContent({
      id: input.id,
      source: "rss",
      type: "article",
      title: input.title,
      summary: input.description,
      url: input.url,
      tags: input.categories,
      publishedAt: input.publishedAt
    });
  }
};

