import type { ContentItem } from "@/types";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function containsTopicTerm(text: string, term: string) {
  const normalizedText = text.toLocaleLowerCase("en");
  const normalizedTerm = term.trim().toLocaleLowerCase("en");
  if (!normalizedTerm) return false;
  const phrase = normalizedTerm.split(/[\s-]+/).map(escapeRegExp).join("[\\s-]+");
  return new RegExp(`(?:^|[^a-z0-9])${phrase}(?=$|[^a-z0-9])`, "i").test(normalizedText);
}

export function matchesAnyTopicTerm(text: string, terms: readonly string[]) {
  return terms.some((term) => containsTopicTerm(text, term));
}

export function parseTopics(input: string | string[], limit = 5) {
  const values = Array.isArray(input) ? input : input.split(/[,;\n]+/);
  return [...new Map(values.map((value) => value.trim()).filter((value) => value.length >= 2).map((value) => [value.toLocaleLowerCase("en"), value])).values()].slice(0, limit);
}

export function matchedTopics(item: Pick<ContentItem, "title" | "summary" | "tags">, topics: string[]) {
  const text = `${item.title} ${item.summary} ${item.tags.join(" ")}`;
  return topics.filter((topic) => {
    const terms = topic.toLocaleLowerCase("en").split(/\s+/).filter((term) => term.length > 1);
    return terms.length > 0 && terms.every((term) => containsTopicTerm(text, term));
  });
}
