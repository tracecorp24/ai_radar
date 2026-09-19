/** Mock data is already local; do not delay every server render. */
export async function simulateLatency() {
  return Promise.resolve();
}

export function sortByScore<T extends { relevanceScore?: number; trendScore?: number; publishedAt?: string }>(
  items: T[],
  key: "relevanceScore" | "trendScore" | "publishedAt",
  direction: "desc" | "asc" = "desc"
) {
  return [...items].sort((a, b) => {
    const aValue = key === "publishedAt" ? new Date(a.publishedAt ?? 0).getTime() : Number(a[key] ?? 0);
    const bValue = key === "publishedAt" ? new Date(b.publishedAt ?? 0).getTime() : Number(b[key] ?? 0);
    return direction === "desc" ? bValue - aValue : aValue - bValue;
  });
}
