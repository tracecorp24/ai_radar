import { getPreference, setPreference } from "@/lib/local-db";
import { DEFAULT_LLM_CONFIG, type StoredLlmConfig } from "@/lib/llm/client";
import { DEFAULT_EMBEDDING_MODEL, EMBEDDING_MODELS, isAllowedLlmBaseUrl, LLM_MODELS, type LlmProvider } from "@/lib/llm/catalog";
import { NextRequest, NextResponse } from "next/server";

function publicConfig(config: StoredLlmConfig) {
  const effectiveKey = config.apiKey || (config.provider === "clever" ? process.env.CLEVER_MODELS_API_KEY : process.env.LLM_API_KEY);
  return {
    provider: config.provider,
    model: config.model,
    embeddingModel: config.embeddingModel || DEFAULT_EMBEDDING_MODEL,
    baseUrl: config.baseUrl,
    isConfigured: Boolean(effectiveKey),
    keyHint: effectiveKey ? `${effectiveKey.slice(0, 3)}••••${effectiveKey.slice(-4)}` : undefined,
    models: LLM_MODELS,
    embeddingModels: EMBEDDING_MODELS
  };
}

export function GET() {
  return NextResponse.json(publicConfig(getPreference<StoredLlmConfig>("llm.config", DEFAULT_LLM_CONFIG)));
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null) as Partial<StoredLlmConfig> & { clearApiKey?: boolean } | null;
  if (!body || !["clever", "openai", "azure-openai", "compatible"].includes(String(body.provider))) {
    return NextResponse.json({ error: "Geçersiz LLM sağlayıcısı." }, { status: 400 });
  }
  if (typeof body.model !== "string" || !body.model.trim() || typeof body.baseUrl !== "string" || !isAllowedLlmBaseUrl(body.baseUrl)) {
    return NextResponse.json({ error: "Model ve geçerli bir HTTPS ya da yerel OmniRouter URL’si gerekli." }, { status: 400 });
  }
  if (body.apiKey !== undefined && (typeof body.apiKey !== "string" || body.apiKey.length > 500)) {
    return NextResponse.json({ error: "Geçersiz API anahtarı." }, { status: 400 });
  }
  if (body.embeddingModel !== undefined && (typeof body.embeddingModel !== "string" || !body.embeddingModel.trim())) {
    return NextResponse.json({ error: "Geçerli bir embedding modeli gerekli." }, { status: 400 });
  }
  const current = getPreference<StoredLlmConfig>("llm.config", DEFAULT_LLM_CONFIG);
  const provider = body.provider as LlmProvider;
  const apiKey = body.clearApiKey ? undefined : body.apiKey?.trim() || current.apiKey;
  const saved = setPreference<StoredLlmConfig>("llm.config", {
    provider,
    model: body.model.trim(),
    embeddingModel: body.embeddingModel?.trim() || current.embeddingModel || DEFAULT_EMBEDDING_MODEL,
    baseUrl: body.baseUrl.replace(/\/$/, ""),
    ...(apiKey ? { apiKey } : {})
  });
  return NextResponse.json(publicConfig(saved));
}
