# Vendor-Bağımsız AI / Web Ürün Mimarisi

Bu repository, cloud sağlayıcısına (AWS, GCP, Hetzner, Cloudflare vb.) bağımlı olmadan geliştirilen ve konumlandırılabilen modüler AI/Web ürünü monoreposudur.

## Mimari Özellikleri

- **Backend:** Python 3.10+ & FastAPI (Asenkron REST API)
- **Database:** PostgreSQL + SQLAlchemy ORM + Alembic Migrations
- **Frontend:** Next.js / React (Dashboard & UI)
- **Containerization:** Docker & Docker Compose
- **Security:** JWT Authentication + OAuth2 / Password Hashing (Passlib/Bcrypt)
- **AI Adapter Layer:** OpenAI, OpenRouter, Anthropic, Gemini sağlayıcılarından bağımsız soyutlama katmanı

## Monorepo Klasör Yapısı

```text
ai_radar_dashboard/
├── backend/                # Python + FastAPI backend uygulaması
│   ├── app/                # Çekirdek uygulama kodları
│   │   ├── api/            # API Endpoint yönlendiricileri (routers)
│   │   ├── core/           # Konfigürasyon, güvenlik ve ayarlar
│   │   ├── db/             # Veritabanı bağlantısı ve oturum yönetimi
│   │   ├── models/         # SQLAlchemy veritabanı modelleri
│   │   ├── schemas/        # Pydantic veri doğrulama şemaları
│   │   ├── services/       # İş mantığı ve AI servisleri
│   │   ├── repositories/   # Veri erişim katmanı (Data Access)
│   │   └── main.py         # FastAPI giriş noktası
│   ├── tests/              # Pytest birim ve entegrasyon testleri
│   ├── migrations/         # Alembic veritabanı migrasyonları
│   └── requirements.txt    # Python bağımlılıkları
├── ai_radar/               # Frontend Dashboard uygulaması
├── infrastructure/         # Nginx, Docker ve dağıtım betikleri
├── docs/                   # Mimari ve API dokümantasyonu
├── uygulama_plani/         # Adım adım test ve production planı
├── .env.example            # Örnek çevre değişkenleri dosyası
├── .gitignore              # Git tarafından yoksayılacak dosyalar
└── README.md               # Proje ana rehberi
```

## Hızlı Başlangıç (Geliştirme Ortamı)

### 1. Backend Kurulumu

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Swagger API dokümantasyonuna erişmek için: `http://localhost:8000/docs`
Sağlık kontrolü için: `http://localhost:8000/health`
