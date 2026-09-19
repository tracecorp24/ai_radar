export type LlmProvider = "clever" | "openai" | "azure-openai" | "compatible";

export type LlmModelOption = { id: string; label: string; group: string; context?: number };

export const CLEVER_MODELS_BASE_URL = "http://localhost:20128/v1";
export const DEFAULT_LLM_MODEL = "af/anthropic/claude-3.7-sonnet";
export const DEFAULT_EMBEDDING_MODEL = "mistral/mistral-embed";

export const EMBEDDING_MODELS = [
  { id: "mistral/mistral-embed", label: "Mistral Embed" },
  { id: "mistral/mistral-embed-2312", label: "Mistral Embed 2312" },
  { id: "mistral/codestral-embed", label: "Codestral Embed" },
  { id: "mistral/codestral-embed-2505", label: "Codestral Embed 2505" }
];

export const LLM_MODELS: LlmModelOption[] = [
  { id: "af/anthropic/claude-3.7-sonnet", label: "Claude 3.7 Sonnet", group: "Clever · API.airforce", context: 200_000 },
  { id: "af/x-ai/grok-3", label: "Grok-3", group: "Clever · API.airforce", context: 131_072 },
  { id: "af/moonshot/kimi-k2.6", label: "Kimi K2.6", group: "Clever · API.airforce", context: 262_144 },
  { id: "af/google/gemini-2.5-flash", label: "Gemini 2.5 Flash", group: "Clever · API.airforce", context: 1_048_576 },
  { id: "af/deepseek/deepseek-v3", label: "DeepSeek V3", group: "Clever · API.airforce", context: 262_144 },
  { id: "af/qwen/qwen3-32b", label: "Qwen3 32B", group: "Clever · API.airforce", context: 128_000 },
  { id: "af/x-ai/grok-2-1212", label: "Grok-2 1212", group: "Clever · API.airforce", context: 131_072 },
  { id: "mistral/mistral-large-latest", label: "Mistral Large 3", group: "Clever · Mistral" },
  { id: "mistral/mistral-medium-3-5", label: "Mistral Medium 3.5", group: "Clever · Mistral" },
  { id: "mistral/mistral-small-latest", label: "Mistral Small 4", group: "Clever · Mistral" },
  { id: "mistral/devstral-latest", label: "Devstral 2", group: "Clever · Mistral" },
  { id: "mistral/codestral-latest", label: "Codestral", group: "Clever · Mistral" },
  { id: "nara/tencent-hy3", label: "Tencent Hy3", group: "Clever · NaraRouter", context: 1_000_000 },
  { id: "nara/mistral-large", label: "Mistral Large", group: "Clever · NaraRouter", context: 252_000 },
  { id: "nara/mistral-medium-3-5", label: "Mistral Medium 3.5", group: "Clever · NaraRouter", context: 256_000 }
];

export function isAllowedLlmBaseUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}
