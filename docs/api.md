# API Dokümantasyon Rehberi

## API Standartları

- **Protokol:** RESTful API over HTTP/HTTPS
- **Veri Biçimi:** JSON (`Content-Type: application/json`)
- **Sürüm:** `/api/v1`

## Temel Endpoint'ler

### 1. Sistem Sağlık Durumu

- **HTTP Metodu:** `GET`
- **URL:** `/health` ve `/api/v1/health`
- **Yanıt (200 OK):**
  ```json
  {
    "status": "healthy",
    "app_name": "Vendor-Independent AI Product",
    "version": "0.1.0",
    "environment": "development"
  }
  ```

### 2. Interactive Swagger UI Dokümantasyonu

Uygulama çalışırken otomatik olarak aşağıdaki adreste sunulur:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **OpenAPI Spec:** `http://localhost:8000/api/v1/openapi.json`

### 3. Kapsamlı Sistem Teşhis ve Metrik Protokolü (Diagnostics)

- **HTTP Metodu:** `GET`
- **URL (Frontend):** `/api/diagnostics`
- **URL (Backend):** `/api/v1/diagnostics`
- **Detaylı Dokümantasyon:** [system_communication_and_diagnostics.md](file:///c:/Users/108097/Desktop/ai_radar_dashboard/docs/system_communication_and_diagnostics.md)
- **Açıklama:** Veritabanı canlılık durumu, PostgreSQL disk alanı (MB), LLM API key durumları, sunucu CPU/RAM/Disk kullanımı, son 24 saatlik içerik sayıları ve son uygulama hatalarını tek bir JSON nesnesinde raporlar.
