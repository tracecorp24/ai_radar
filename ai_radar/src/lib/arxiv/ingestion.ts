import { runSourceIngestion } from "@/lib/ingestion/pipeline";
import { getSources } from "@/lib/services/source-service";
export async function runArxivSync() { await getSources(); const result = await runSourceIngestion("builtin-arxiv"); return { count: result.count, total: result.source.totalItems, items: result.items }; }
