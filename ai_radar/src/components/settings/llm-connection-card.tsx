"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CLEVER_MODELS_BASE_URL, DEFAULT_EMBEDDING_MODEL, DEFAULT_LLM_MODEL, EMBEDDING_MODELS, LLM_MODELS, type LlmModelOption, type LlmProvider } from "@/lib/llm/catalog";
import { KeyRound, LoaderCircle, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type LlmConfig = {
  provider: LlmProvider;
  model: string;
  embeddingModel: string;
  baseUrl: string;
  apiKey: string;
  isConfigured: boolean;
  keyHint?: string;
  models: LlmModelOption[];
  embeddingModels: Array<{ id: string; label: string }>;
};

const DEFAULTS: LlmConfig = {
  provider: "clever",
  model: DEFAULT_LLM_MODEL,
  embeddingModel: DEFAULT_EMBEDDING_MODEL,
  baseUrl: CLEVER_MODELS_BASE_URL,
  apiKey: "",
  isConfigured: false,
  models: LLM_MODELS,
  embeddingModels: EMBEDDING_MODELS
};

export function LlmConnectionCard() {
  const [config, setConfig] = useState(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [prompt, setPrompt] = useState("Bugünün AI gündemini araştırırken hangi üç sinyale öncelik vermeliyim?");
  const [answer, setAnswer] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/llm/config")
      .then((response) => response.json())
      .then((data: Omit<LlmConfig, "apiKey">) => setConfig((current) => ({ ...current, ...data })))
      .catch(() => setError("AI yapılandırması okunamadı."));
  }, []);

  function selectProvider(provider: LlmProvider) {
    if (provider === "clever") {
      setConfig((current) => ({ ...current, provider, model: DEFAULT_LLM_MODEL, baseUrl: CLEVER_MODELS_BASE_URL }));
    } else if (provider === "openai") {
      setConfig((current) => ({ ...current, provider, model: "gpt-4.1-mini", baseUrl: "https://api.openai.com/v1" }));
    } else {
      setConfig((current) => ({ ...current, provider }));
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const response = await fetch("/api/llm/config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: config.provider, model: config.model, embeddingModel: config.embeddingModel, baseUrl: config.baseUrl, ...(config.apiKey ? { apiKey: config.apiKey } : {}) })
      });
      const data = await response.json() as Omit<LlmConfig, "apiKey"> & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Bağlantı ayarları kaydedilemedi.");
      setConfig((current) => ({ ...current, ...data, apiKey: "" }));
      setSaved(true);
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Bağlantı ayarları kaydedilemedi.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function testRequest() {
    setTesting(true);
    setAnswer("");
    setError("");
    try {
      if (!(await save())) return;
      const response = await fetch("/api/llm/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json() as { content?: string; model?: string; error?: string };
      if (!response.ok || !data.content) throw new Error(data.error ?? "AI isteği tamamlanamadı.");
      setAnswer(data.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "AI isteği tamamlanamadı.");
    } finally {
      setTesting(false);
    }
  }

  const groups = [...new Set(config.models.map((model) => model.group))];
  return (
    <Card className="border-primary/20">
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> AI ve model yapılandırması</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">Clever Models varsayılan olarak seçilidir. İstekler sunucu üzerinden yapılır; API anahtarı tarayıcıya gönderilmez.</p>
        </div>
        <Badge tone={config.isConfigured ? "success" : "subtle"}>{config.isConfigured ? `Hazır · ${config.keyHint}` : "Anahtar bekleniyor"}</Badge>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="llm-provider">Sağlayıcı</Label>
          <Select id="llm-provider" value={config.provider} onChange={(event) => selectProvider(event.target.value as LlmProvider)}>
            <option value="clever">Clever Models (OmniRouter)</option>
            <option value="openai">OpenAI</option>
            <option value="azure-openai">Azure OpenAI</option>
            <option value="compatible">OpenAI uyumlu API</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="llm-model">Model</Label>
          {config.provider === "clever" ? (
            <Select id="llm-model" value={config.model} onChange={(event) => setConfig({ ...config, model: event.target.value })}>
              {groups.map((group) => <optgroup key={group} label={group}>{config.models.filter((model) => model.group === group).map((model) => <option key={model.id} value={model.id}>{model.label}{model.context ? ` · ${model.context.toLocaleString("tr-TR")} token` : ""}</option>)}</optgroup>)}
            </Select>
          ) : <Input id="llm-model" value={config.model} onChange={(event) => setConfig({ ...config, model: event.target.value })} placeholder="Model kimliği" />}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="embedding-model">Embedding modeli · semantik arama ve kategoriler</Label>
          {config.provider === "clever" ? <Select id="embedding-model" value={config.embeddingModel} onChange={(event) => setConfig({ ...config, embeddingModel: event.target.value })}>{config.embeddingModels.map((model) => <option key={model.id} value={model.id}>{model.label} · {model.id}</option>)}</Select> : <Input id="embedding-model" value={config.embeddingModel} onChange={(event) => setConfig({ ...config, embeddingModel: event.target.value })} placeholder="Embedding model kimliği" />}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="llm-base-url">API temel URL’si</Label>
          <Input id="llm-base-url" value={config.baseUrl} onChange={(event) => setConfig({ ...config, baseUrl: event.target.value })} />
          {config.provider === "clever" ? <p className="text-xs text-muted-foreground">Yerel OmniRouter: port 20128 · OpenAI uyumlu chat completions</p> : null}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="llm-api-key"><KeyRound className="mr-1 inline h-3.5 w-3.5" /> API anahtarı</Label>
          <Input id="llm-api-key" type="password" autoComplete="new-password" value={config.apiKey} onChange={(event) => setConfig({ ...config, apiKey: event.target.value })} placeholder={config.isConfigured ? "Kayıtlı anahtarı değiştirmek için yazın" : "sk-…"} />
        </div>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Button onClick={save} disabled={saving || testing}>{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}{saving ? "Kaydediliyor…" : "Yapılandırmayı kaydet"}</Button>
          {saved ? <span className="text-sm text-emerald-500">AI yapılandırması kaydedildi.</span> : null}
        </div>
        <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4 md:col-span-2">
          <div><p className="font-medium">Gerçek AI isteğini dene</p><p className="text-sm text-muted-foreground">Bu işlem ayarları kaydeder ve seçili modele canlı bir istek gönderir.</p></div>
          <Label htmlFor="llm-test-prompt">İstek</Label>
          <Textarea id="llm-test-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4_000} />
          <Button variant="secondary" onClick={testRequest} disabled={testing || saving || prompt.trim().length < 2}>{testing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{testing ? "AI yanıtlıyor…" : "İstek gönder"}</Button>
          {answer ? <div className="rounded-xl border bg-background p-4"><p className="mb-2 text-xs font-medium uppercase tracking-wide text-primary">AI yanıtı · {config.model}</p><p className="whitespace-pre-wrap text-sm leading-6">{answer}</p></div> : null}
        </div>
        {error ? <p role="alert" className="text-sm text-destructive md:col-span-2">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
