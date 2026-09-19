# Mimari Prensipleri ve Tasarım Dokümanı

## Mimari Prensipler

1. **Vendor Bağımsızlığı (Vendor-Agnostic Core):** Uygulamanın çekirdek veri yapıları, API rotaları ve iş mantığı (business logic) hiçbir bulut sağlayıcısına (AWS, Cloudflare, Hetzner, GCP) veya belirli bir LLM sağlayıcısına (OpenAI, Anthropic) sıkı sıkıya bağlı değildir.
2. **Katmanlı Mimari (Layered Architecture):**
   - **Presentation Layer (Frontend & REST API):** React/Next.js ve FastAPI endpoint'leri.
   - **Service / Business Layer:** Uygulama iş mantığı ve AI soyutlama adaptörleri.
   - **Data Access / Repository Layer:** SQLAlchemy ve PostgreSQL entegrasyonu.
   - **Infrastructure Layer:** Nginx, Docker ve CI/CD süreçleri.
3. **Tip Güvenliği ve Doğrulama:** Pydantic şemaları ve TypeScript tip tanımları ile uçtan uca veri doğrulaması.

## AI Adaptör Katmanı Tasarımı

```text
               ┌──────────────────────┐
               │    FastAPI Service   │
               └──────────┬───────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │  Base LLM Adapter    │
               │  (Interface)         │
               └──────────┬───────────┘
     ┌────────────────────┼────────────────────┐
     ▼                    ▼                    ▼
┌──────────┐        ┌───────────┐        ┌──────────┐
│ OpenAI   │        │ Anthropic │        │ Gemini   │
│ Adapter  │        │ Adapter   │        │ Adapter  │
└──────────┘        └───────────┘        └──────────┘
```
