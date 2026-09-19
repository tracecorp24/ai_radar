# Bulut ve Sunucu Taşınabilirlik Matrisi (Vendor-Agnostic Portability Matrix)

Bu doküman, uygulamanızı **kodlarda tek bir satır bile değiştirmeden** farklı bulut veya sunucu sağlayıcılarına nasıl taşıyabileceğinizi açıklar.

---

## Sağlayıcı Geçiş Tablosu

| Sağlayıcı | Veritabanı (`DATABASE_URL`) | Depolama (`S3_ENDPOINT`) | Konteyner Çalıştırma |
| :--- | :--- | :--- | :--- |
| **Lokal (Geliştirme)** | `postgresql://postgres:postgres@localhost:5432/ai_db` | Local Storage (`uploads/`) | `docker-compose up` |
| **Hetzner / VPS** | PostgreSQL Docker container veya Hetzner Managed DB | MinIO / Local Disk | `docker-compose up -d` |
| **AWS** | AWS RDS PostgreSQL | AWS S3 (`s3.amazonaws.com`) | AWS ECS / EC2 |
| **Cloudflare** | Neon / Supabase PostgreSQL | Cloudflare R2 (`r2.cloudflarestorage.com`) | Cloudflare Tunnel / VPS |
| **GCP (Google Cloud)** | Cloud SQL for PostgreSQL | Google Cloud Storage (S3 API) | Google Cloud Run / GKE |
| **Railway / Render** | Railway PostgreSQL | Railway S3 Plugin | Automatic Docker Build |

---

## Taşınabilirlik İlkeleri (Portability Rules)

1. **İş Mantığında SDK Kullanmama:** Kod içerisinde `boto3`, `google-cloud-storage` veya `aws-sdk` gibi özel kütüphanelere doğrudan bağımlı olmayın. Daima [`BaseStorageProvider`](file:///c:/Users/108097/Desktop/ai_radar_dashboard/backend/app/services/storage/base.py) arayüzünü kullanın.
2. **Veritabanı İzolasyonu:** SQL sorguları yazmak yerine SQLAlchemy ORM ve Repository desenini kullanın.
3. **Konfigürasyon:** Sağlayıcı bilgilerini yalnızca `.env` dosyasındaki ortam değişkenleri üzerinden iletin.
