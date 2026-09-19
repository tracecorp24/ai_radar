import type { ContentAdapter } from "./generic-content-adapter";
import { normalizeGenericContent } from "./generic-content-adapter";

export interface HuggingFaceModelCard {
  id: string;
  modelId: string;
  name: string;
  description: string;
  url: string;
  pipeline?: string;
  authors?: string[];
  tags?: string[];
  updatedAt?: string;
}

export const huggingFaceAdapter: ContentAdapter<HuggingFaceModelCard> = {
  normalize(input) {
    return normalizeGenericContent({
      id: input.id,
      source: "huggingface",
      type: "model",
      title: input.name,
      summary: input.description,
      url: input.url,
      authors: input.authors,
      tags: input.tags,
      publishedAt: input.updatedAt
    });
  }
};

