import { getPreference } from "@/lib/local-db";
import { CLEVER_MODELS_BASE_URL, DEFAULT_EMBEDDING_MODEL, DEFAULT_LLM_MODEL, type LlmProvider } from "@/lib/llm/catalog";

export type StoredLlmConfig = { provider: LlmProvider; model: string; embeddingModel?: string; baseUrl: string; apiKey?: string };

export const DEFAULT_LLM_CONFIG: StoredLlmConfig = {
  provider: "clever",
  model: DEFAULT_LLM_MODEL,
  embeddingModel: DEFAULT_EMBEDDING_MODEL,
  baseUrl: CLEVER_MODELS_BASE_URL
};

export function getLlmConfig() {
  const stored = getPreference<StoredLlmConfig>("llm.config", DEFAULT_LLM_CONFIG);
  const environmentKey = stored.provider === "clever" ? process.env.CLEVER_MODELS_API_KEY : process.env.LLM_API_KEY;
  return { ...DEFAULT_LLM_CONFIG, ...stored, embeddingModel: stored.embeddingModel || DEFAULT_EMBEDDING_MODEL, apiKey: stored.apiKey || environmentKey };
}

function responseMessage(body: unknown) {
  if (!body || typeof body !== "object") return undefined;
  const record = body as { error?: { message?: string } | string; message?: string };
  return typeof record.error === "string" ? record.error : record.error?.message ?? record.message;
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function isRetryableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError" || error.name === "TimeoutError" || /fetch failed|network|connection|socket|econnreset|econnrefused/i.test(error.message);
}

async function postJson(url: string, body: unknown, apiKey: string) {
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000), cache: "no-store" });
    } catch (error) {
      if (!isRetryableError(error) || attempt === 2) throw error;
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 350 * 2 ** attempt));
      continue;
    }
    const parsed = await response.json().catch(() => null);
    if (response.ok) return parsed;
    const error = new Error(responseMessage(parsed) ?? `AI isteği başarısız (${response.status}).`);
    if (!isRetryableStatus(response.status) || attempt === 2) throw error;
    lastError = error;
    await new Promise((resolve) => setTimeout(resolve, 350 * 2 ** attempt));
  }
  throw lastError instanceof Error ? lastError : new Error("AI bağlantısı kurulamadı.");
}

export async function requestLlm(prompt: string, options: { system?: string; maxTokens?: number } = {}) {
  const config = getLlmConfig();
  if (!config.apiKey) throw new Error("Seçili AI sağlayıcısı için API anahtarı bulunamadı.");
  let body: { choices?: Array<{ message?: { content?: string } }> } | null;
  try {
    body = await postJson(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      model: config.model,
      messages: [...(options.system ? [{ role: "system", content: options.system }] : []), { role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: Math.min(Math.max(options.maxTokens ?? 600, 32), 4_096)
    }, config.apiKey) as { choices?: Array<{ message?: { content?: string } }> } | null;
  } catch (error) {
    if (!isRetryableError(error)) throw error;
    throw new Error(`AI bağlantısı kurulamadı (${config.provider}, ${config.model}). ${error instanceof Error ? error.message : "Sunucuya erişilemedi."}`, { cause: error });
  }
  const content = body?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI sağlayıcısı boş yanıt döndürdü.");
  return { content, model: config.model, provider: config.provider };
}

export async function requestEmbeddings(inputs: string[]) {
  const config = getLlmConfig();
  if (!config.apiKey) throw new Error("Embedding modeli için API anahtarı bulunamadı.");
  if (!inputs.length) return { vectors: [] as number[][], model: config.embeddingModel };
  const body = await postJson(`${config.baseUrl.replace(/\/$/, "")}/embeddings`, { model: config.embeddingModel, input: inputs }, config.apiKey) as { data?: Array<{ index: number; embedding: number[] }> } | null;
  const vectors = [...(body?.data ?? [])].sort((a, b) => a.index - b.index).map((entry) => entry.embedding);
  if (vectors.length !== inputs.length || vectors.some((vector) => !Array.isArray(vector) || !vector.length)) throw new Error("Embedding sağlayıcısı eksik vektör döndürdü.");
  return { vectors, model: config.embeddingModel };
}
