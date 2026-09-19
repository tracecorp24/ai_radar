import type { ContentAdapter } from "./generic-content-adapter";
import { normalizeGenericContent } from "./generic-content-adapter";

export interface LinkedInPost {
  id: string;
  author: string;
  text: string;
  url: string;
  postedAt: string;
  topics?: string[];
}

export const linkedinAdapter: ContentAdapter<LinkedInPost> = {
  normalize(input) {
    return normalizeGenericContent({
      id: input.id,
      source: "linkedin",
      type: "post",
      title: `${input.author} post`,
      summary: input.text,
      url: input.url,
      authors: [input.author],
      tags: input.topics,
      publishedAt: input.postedAt
    });
  }
};

