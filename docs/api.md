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
