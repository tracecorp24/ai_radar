# Dağıtım ve Production Rehberi (Deployment)

## Dağıtım Stratejisi

Projemiz **vendor-bağımsız** olarak tasarlandığından aşağıdaki tüm ortamlarda aynı Docker imajları ile çalıştırılabilir:

1. **Local / On-Premise:** Docker Compose ile tek komutla ayağa kaldırılabilir.
2. **Cloud Virtual Machines (VPS):** Hetzner, DigitalOcean, AWS EC2, GCP Compute Engine veya Azure VM üzerinde Nginx Reverse Proxy arkasında çalışır.
3. **PaaS (Platform as a Service):** Render, Railway, Fly.io gibi ortamlara tek bir `Dockerfile` ile dağıtılabilir.

## Geliştirme Ortamı Komutları

```powershell
# Backend Sanal Ortam Aktivasyonu ve Test
cd backend
.\.venv\Scripts\activate
pytest

# API Sunucusunu Çalıştırma
uvicorn app.main:app --reload --port 8000
```
