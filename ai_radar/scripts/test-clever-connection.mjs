import fs from "node:fs";

const line = fs.readFileSync(".env.local", "utf8").split(/\r?\n/).find((entry) => entry.startsWith("CLEVER_MODELS_API_KEY="));
if (!line) throw new Error("CLEVER_MODELS_API_KEY bulunamadı.");
const apiKey = line.slice(line.indexOf("=") + 1).replaceAll('"', "");
const response = await fetch("http://localhost:20128/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "af/anthropic/claude-3.7-sonnet",
    messages: [{ role: "user", content: "Yalnızca TAMAM yaz." }],
    max_tokens: 16,
    temperature: 0,
    stream: false
  })
});
const text = await response.text();
let body;
try { body = JSON.parse(text); } catch { body = undefined; }
console.log(JSON.stringify({
  status: response.status,
  contentType: response.headers.get("content-type"),
  responseLength: text.length,
  properties: body && typeof body === "object" ? Object.keys(body) : [],
  hasChoices: Boolean(body?.choices),
  error: body?.error?.message ?? null,
  plainText: body ? null : text.slice(0, 80)
}, null, 2));
if (!response.ok || !body?.choices?.[0]?.message?.content) process.exit(1);

const embeddingResponse = await fetch("http://localhost:20128/v1/embeddings", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: "mistral/mistral-embed", input: ["semantic search test", "AI araştırma makalesi"] })
});
const embeddingBody = await embeddingResponse.json().catch(() => undefined);
console.log(JSON.stringify({
  embeddingStatus: embeddingResponse.status,
  embeddingModel: embeddingBody?.model ?? "mistral/mistral-embed",
  vectorCount: embeddingBody?.data?.length ?? 0,
  dimensions: embeddingBody?.data?.[0]?.embedding?.length ?? 0,
  error: embeddingBody?.error?.message ?? null
}, null, 2));
if (!embeddingResponse.ok || embeddingBody?.data?.length !== 2) process.exit(1);
