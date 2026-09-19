# Corpus System Architecture, Integration & Diagnostics Protocol

Bu doküman, **Corpus (AI Radar)** platformunun sistem mimarisini, entegre olduğu dış servisleri, haberleşme protokollerini ve sistem metriklerinin nasıl izlendiğini detaylandırır.

---

## 1. Sistem Haberleşme Mimarisi (Communication Architecture)

Sistem 3 temel bileşenden ve bu bileşenlerin birbirleriyle haberleştiği REST API protokollerinden oluşur:

```text
┌─────────────────────────┐        HTTP / REST API        ┌─────────────────────────┐
│     Next.js 15 App      │ ────────────────────────────> │     FastAPI Backend     │
│  (Frontend & Web Dash)  │ <──────────────────────────── │   (Python Async Core)   │
└────────────┬────────────┘                               └────────────┬────────────┘
             │                                                         │
             │ Local-First SQLite                                      │ SQLAlchemy Connection
             ▼                                                         ▼
┌─────────────────────────┐                               ┌─────────────────────────┐
│  Local Database (.data) │                               │ Supabase PostgreSQL DB  │
└─────────────────────────┘                               └─────────────────────────┘
```

1. **Frontend / Web Dashboard (Next.js 15 - Port 3000):**
   - Kullanıcı arayüzünü sunar.
   - Hızlı liste, arama ve trend işlemlerini local SQLite (`.data/savvy.sqlite`) üzerinde yürütür.
2. **Backend Engine (FastAPI - Port 8000):**
   - Asenkron veri işleme, LLM soyutlama adaptörleri ve derinlemesine sistem metriklerini yönetir.
   - Supabase PostgreSQL veritabanına SQLAlchemy ORM ile bağlanır.
3. **Canlı Yayın ve Tunnel (Cloudflare Tunnels):**
   - Canlı ortamda frontend ve backend Cloudflare Tunnel üzerinden HTTPS ile dış dünyaya güvenli şekilde sunulur.

---

## 2. Entegre Olunan Dış Servisler ve Web Siteleri

Platform, AI ekosistemindeki en güncel gelişmeleri toplamak için aşağıdaki harici API ve kaynaklarla entegredir:

| Servis / Kaynak | URL / Endpoint | Kullanım Amacı |
| :--- | :--- | :--- |
| **arXiv API** | `https://export.arxiv.org/api/query` | Yapay zekâ, makine öğrenimi ve bilgisayar bilimleri makalelerinin çekilmesi, PDF/TeX indirme |
| **GitHub REST API** | `https://api.github.com/search/repositories` | Yükselen açık kaynak AI projeleri, star/fork sayıları ve günlük star ivmesi (starsPerDay) |
| **Hugging Face API** | `https://huggingface.co/api/models`<br>`https://huggingface.co/api/daily_papers` | Popüler açık kaynak LLM modelleri ve günün öne çıkan günlük makaleleri |
| **Ollama Local API** | `http://127.0.0.1:11434/api/tags` | Kullanıcının kendi bilgisayarında çalışan yerel LLM modellerinin envanteri |
| **Supabase PostgreSQL** | `db.yiocifdseodhfqrmnuxf.supabase.co:5432` | Ürün test ve production veritabanı (500 MB Free Tier kota takibi) |
| **RSS / Atom Feeds** | Çeşitli yapay zekâ blogları ve bültenler | Blog yazıları, teknik bültenler ve topluluk paylaşımları |

---

## 3. Canlı Teşhis ve İzleme Protokolü (Diagnostics Protocol)

Hem AI asistanın (Antigravity/Claude) hem de sistem yöneticisinin sistem durumunu tek bir JSON çıktısıyla analiz edebilmesi için **Teşhis Protokolü** geliştirilmiştir:

- **Frontend Endpoint:** `GET /api/diagnostics`
- **Backend Endpoint:** `GET /api/v1/diagnostics`

### Teşhis Raporu İçeriği (JSON Şeması)

Bir teşhis isteği atıldığında aşağıdaki kritik metrikler anlık olarak üretilir:

1. **Database Metrics:**
   - `status`: Veritabanı canlılık durumu (`healthy` / `unhealthy`).
   - `size_mb`: PostgreSQL veritabanının kapladığı toplam alan (MB).
   - `table_counts`: `users`, `jobs`, `testers` tablolarındaki kayıt sayıları.
2. **LLM API Status:**
   - `openai_configured`: OpenAI API anahtarının varlığı (`true`/`false`).
   - `anthropic_configured`: Anthropic API anahtarının varlığı (`true`/`false`).
   - `gemini_configured`: Google Gemini API anahtarının varlığı (`true`/`false`).
   - `deepseek_configured`: DeepSeek API anahtarının varlığı (`true`/`false`).
3. **Frontend & Ingestion Metrics:**
   - `total_content_items`: Lokal veri havuzundaki toplam içerik sayısı.
   - `items_in_last_24h`: Son 24 saat içinde sisteme giren yeni içerik sayısı.
   - `trend_topics_count`: Aktif trend başlıklarının sayısı.
   - `trend_last_analyzed`: Otomatik trend analizinin en son çalıştığı zaman damgası.
4. **Server System Resources:**
   - `cpu_count` / `cpu_percent`: CPU çekirdek sayısı ve doluluğu.
   - `disk_free_gb` / `disk_percent`: Sunucudaki boş disk alanı (GB) ve kullanım oranı.
   - `python_version`: Sunucuda çalışan Python sürümü.
5. **Log & Alarm Taraması (`recent_alerts_logs`):**
   - Sunucu üzerindeki `app.log` dosyasında son oluşan `ERROR`, `WARNING` ve `CRITICAL` seviyesindeki log kayıtları.

---

## 4. Teşhis Raporu Nasıl Alınır?

Canlı ortamda sistem aksaklığı veya performans kontrolü için:
1. Tarayıcıdan veya cURL ile `https://<CANLI-DOMAIN>/api/diagnostics` adresine istek atılır.
2. Dönen JSON çıktısı AI asistana iletildiğinde, AI asistan sistemdeki veritabanı kotasını, eksik API key'lerini veya veri çekme gecikmelerini anında tespit eder.
