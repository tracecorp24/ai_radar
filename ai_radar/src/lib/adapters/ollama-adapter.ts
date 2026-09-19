import type { ContentAdapter } from "./generic-content-adapter";
import { normalizeGenericContent } from "./generic-content-adapter";

export interface OllamaLibraryItem {
  id: string;
  name: string;
  description: string;
  url: string;
  family?: string;
  tags?: string[];
  updatedAt?: string;
}

export const ollamaAdapter: ContentAdapter<OllamaLibraryItem> = {
  normalize(input) {
    return normalizeGenericContent({
      id: input.id,
      source: "ollama",
      type: "model",
      title: input.name,
      summary: input.description,
      url: input.url,
      tags: input.tags ?? (input.family ? [input.family] : []),
      publishedAt: input.updatedAt
    });
  }
};

