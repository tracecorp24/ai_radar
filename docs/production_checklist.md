# Prodüksiyon Yayına Alma Kontrol Listesi (Production Readiness Checklist)

Canlı ortama (Production) çıkmadan önce aşağıdaki kontrollerin tamamlandığından emin olun.

---

## 🔑 Güvenlik (Security)

- [x] Ortam değişkenleri (`.env`) Git deposundan hariç tutuldu (`.gitignore`).
- [x] `SECRET_KEY` en az 32 karakterli güçlü ve rastgele bir anahtar ile değiştirildi.
- [x] HTTPS / SSL sertifikası (Let's Encrypt veya Cloudflare SSL) aktif edildi.
- [x] CORS izin verilen alan adları (`BACKEND_CORS_ORIGINS`) kısıtlandı.
- [x] Kullanıcı parolaları Bcrypt algoritması ile hash'lenerek saklanıyor.
- [x] API Hız Sınırlaması (`RateLimiter`) dakikada 60 istek ile aktif.
- [x] Yüklenen dosyalarda boyut (maks 10 MB) ve uzantı doğrulaması yapılıyor.

---

## 🗄️ Veritabanı (Database)

- [x] Alembic veritabanı migrasyonları uygulandı (`alembic upgrade head`).
- [x] Veritabanı bağlantı havuzu (`pool_pre_ping=True`) kopmaları önleyecek şekilde ayarlandı.
- [x] Otomatik günlük veritabanı yedekleme betiği (`backup_db.py`) ayarlandı.
- [x] Test ve Production veritabanları tamamen birbirinden ayrıldı.

---

## 🤖 AI Maliyet & Performans (AI Cost & Performance)

- [x] Kullanıcı başına günlük maksimum 50 AI isteği limiti (`AICostGuard`) aktif.
- [x] AI API anahtarlarının geçerliliği kontrol edildi.
- [x] Uzun süren AI görevleri için arkaplan işçi mimarisi (`JobWorker`) kullanılıyor.

---

## 🐳 Konteyner ve Orkestrasyon (Infrastructure)

- [x] Dockerfile imajları optimize edildi (Multi-stage build).
- [x] Docker Compose restart politikası (`restart: always`) eklendi.
- [x] `/health` derinlemesine sağlık kontrol endpoint'i monitoring sistemine bağlandı.
- [x] Nginx Reverse Proxy ile port 80/443 yönlendirmesi yapıldı.
