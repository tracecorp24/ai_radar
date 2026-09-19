# Sistem Evrim Haritası & Ölçeklenme Rehberi

Bu doküman, ürününüzün ilk test aşamasından milyondan fazla kullanıcıya ulaşan büyük bir platforma dönüşürken geçeceği mimari aşamaları açıklar.

---

## 🟢 Aşama 1: MVP (İlk Test Aşaması)

```text
               Kullanıcılar
                    │
                    ▼
               Cloudflare
                    │
                    ▼
           Docker Compose (Tek Sunucu)
          ┌─────────┴──────────┐
          ▼                    ▼
     React Frontend        FastAPI
                               │
                     ┌─────────┴──────────┐
                     ▼                    ▼
                PostgreSQL            OpenRouter
```
- **Durum:** Tek bir VPS (Hetzner / DigitalOcean) üzerinde `docker-compose up` ile çalışır.
- **Kapasite:** Günlük 1.000 - 10.000 istek.

---

## 🟡 Aşama 2: Büyüme Aşaması (Ölçeklenen Mimarisi)

```text
                  FastAPI API
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   PostgreSQL       Redis          S3 Storage
                       │
                       ▼
                 Job Worker
                       │
                       ▼
                 AI Providers
```
- **Durum:** Veritabanı ve Redis ayrıştırılır, Job Worker bağımsız bir servis olarak ölçeklenir.
- **Kapasite:** Günlük 100.000 - 500.000 istek.

---

## 🔴 Aşama 3: Kurumsal ve Ağır AI Aşaması (GPU / ML Cluster)

```text
                     FastAPI
                        │
                      Queue
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        CPU Worker             GPU Worker
                                   │
                                   ▼
                           Yerel Llama 3 / vLLM
```
- **Durum:** Kendi GPU sunucularınız üzerinde yerel açık kaynak AI modelleri (Llama 3, Mistral) çalıştırılır.
