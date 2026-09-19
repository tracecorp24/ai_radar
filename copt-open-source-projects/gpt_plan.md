# COPT Radar — AI Araştırma ve Teknoloji Haber Dashboard’u

Sen kıdemli bir full-stack yazılım mimarı, frontend geliştirici ve UI/UX tasarımcısısın.

Senden **COPT Radar** isimli, modern bir teknoloji haber sitesi görünümünde çalışan bir web uygulaması oluşturmanı istiyorum.

Bu proje başlangıçta mock verilerle çalışan özgün ve kaliteli bir dashboard olacak. Daha sonra arXiv, Hugging Face, Ollama, AlphaSignal, RSSHub, changedetection.io, n8n ve LinkedIn kaynakları projeye parça parça bağlanacak.

Bu nedenle yalnızca güzel görünen bir arayüz değil; gerçek veri kaynaklarına kolayca geçirilebilecek temiz, modüler, tip güvenli ve genişletilebilir bir mimari oluştur.

---

# 1. Projenin temel amacı

COPT Radar, yapay zekâ ve teknoloji alanındaki güncel gelişmeleri tek bir platformda gösteren kişisel bir araştırma ve trend takip sistemi olacak.

Sistem ileride şu kaynaklardan veri toplayacak:

* arXiv
* Hugging Face Models
* Hugging Face Papers
* Ollama model kütüphanesi
* AlphaSignal
* RSS ve Atom kaynakları
* GitHub repository ve release bilgileri
* Belirlenen kişilerin LinkedIn gönderileri
* RSSHub tarafından oluşturulan feed’ler
* changedetection.io tarafından algılanan sayfa değişiklikleri
* n8n workflow’larından gelen içerikler

İlk sürümde gerçek API entegrasyonu yapma. Bunun yerine gerçekçi mock veriler kullan.

Ancak veri modellerini ve servis katmanını, daha sonra mock verilerin gerçek API veya Supabase verileriyle kolayca değiştirilebileceği şekilde tasarla.

---

# 2. Kullanılacak teknoloji seti

Projeyi şu teknolojilerle oluştur:

* Next.js
* App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Lucide Icons
* Recharts
* Framer Motion
* Zod
* date-fns

Mümkün olduğunca Server Component kullan.

Yalnızca etkileşim, state, animasyon veya browser API gerektiğinde Client Component kullan.

Kod kalitesi için:

* ESLint
* Prettier
* TypeScript strict mode

aktif olsun.

---

# 3. Genel tasarım hedefi

Arayüz klasik bir admin paneli gibi görünmemeli.

Şunlara benzer bir his vermeli:

* Modern teknoloji haber sitesi
* Premium araştırma platformu
* Finansal veri terminalinin sadeleştirilmiş hâli
* Editoryal haber sitesi
* AI araştırma keşif platformu

Tasarım özgün olmalı.

Hazır bir admin template’in birebir kopyası gibi görünmemeli.

Özellikle şu görsel karakteristikleri kullan:

* Güçlü editoryal tipografi
* Büyük başlıklar
* Bol boşluk
* Farklı boyutlarda haber kartları
* Grid tabanlı haber yerleşimi
* Hafif gölgeler
* İnce border kullanımı
* Dengeli radius değerleri
* Kaynaklara özel rozetler
* Önem puanına göre görsel vurgu
* Açık ve koyu tema
* Responsive tasarım
* Mobilde okunabilir haber akışı
* Ölçülü mikro animasyonlar

Renkleri aşırı kullanma.

Ana renk paleti:

* Koyu lacivert
* Füme
* Açık gri
* Beyaz
* Mavi-mor vurgu
* Başarı için yeşil
* Uyarı için turuncu
* Hata için kırmızı

Gradient kullanımını sınırlı ve kontrollü tut.

---

# 4. Marka ve isimlendirme

Uygulama adı:

COPT Radar

Kısa açıklama:

AI Research & Technology Intelligence

Alternatif Türkçe açıklama:

Yapay Zekâ Araştırma ve Teknoloji İstihbarat Platformu

Logo için başlangıçta metinsel bir logo kullan:

COPT Radar

Logo yanında küçük, soyut bir radar veya sinyal ikonu bulunabilir.

---

# 5. Sayfa yapısı

Şu route’ları oluştur:

```text
/
 /research
 /models
 /people
 /trends
 /bookmarks
 /sources
 /settings
```

Ayrıca dinamik detay sayfaları oluştur:

```text
/content/[id]
/models/[id]
/people/[id]
```

404 ve genel hata görünümü de hazırla.

---

# 6. Ana navigasyon

Üst navigasyon barında şunlar bulunsun:

* COPT Radar logosu
* Ana Sayfa
* Araştırmalar
* Modeller
* Kişiler
* Trendler
* Kaydedilenler
* Kaynaklar
* Global arama butonu
* Tema değiştirme butonu
* Bildirim ikonu
* Kullanıcı/avatar alanı

Masaüstünde yatay navigasyon kullan.

Mobilde hamburger menü kullan.

Navigasyon sticky olsun.

Scroll edildiğinde hafif blur ve border efekti oluşsun.

---

# 7. Ana sayfa

Ana sayfa bir haber ve teknoloji portalı gibi görünmeli.

Şu bölümleri oluştur:

## 7.1 Günün öne çıkan gelişmesi

Büyük bir hero haber kartı oluştur.

Alanlar:

* Kaynak
* İçerik türü
* Başlık
* Kısa Türkçe özet
* Yayın zamanı
* Etiketler
* Önem puanı
* Yenilik puanı
* Orijinal kaynağı aç butonu
* Detayları gör butonu

Hero alanında soyut ve hafif bir arka plan görseli veya CSS tabanlı dekorasyon kullanılabilir.

Haricî görsel zorunlu olmasın.

## 7.2 Günün özeti

AI tarafından hazırlanmış gibi görünen kısa bir editoryal özet alanı oluştur.

Örnek yapı:

* Bugün öne çıkan üç gelişme
* En hızlı yükselen konu
* En çok konuşulan model
* Takip edilmesi gereken araştırma

## 7.3 Trend konu etiketleri

Örnek etiketler:

* Agentic AI
* RAG
* MCP
* Multi-Agent
* Local LLM
* Multimodal
* Evaluation
* AI Safety
* Tool Calling
* Reasoning Models
* Embeddings
* Vector Databases

Her etikette isteğe bağlı trend yüzdesi veya içerik sayısı göster.

## 7.4 Son gelişmeler

İçerikleri haber kartları şeklinde göster.

Kart tipleri birbirinden farklı olabilir:

* Büyük haber kartı
* Standart haber kartı
* Kompakt liste kartı
* Görselsiz araştırma kartı
* Model metrik kartı
* Kişi gönderisi kartı

## 7.5 Trend modeller

Hugging Face ve Ollama modellerini gösteren bir bölüm oluştur.

Her model kartında:

* Model adı
* Organizasyon
* Kaynak
* Pipeline türü
* Parametre veya boyut bilgisi
* İndirme sayısı
* Son 24 saatlik büyüme
* Like sayısı
* Son güncelleme tarihi
* Trend skoru

## 7.6 Takip edilen kişiler

Belirlenen kişilerin son gönderilerini gösteren yatay veya dikey kart listesi oluştur.

Alanlar:

* Profil adı
* Profil fotoğrafı yerine mock avatar
* Platform
* Gönderi özeti
* Yayın tarihi
* Yeni gönderi rozeti
* Gönderiyi aç butonu

## 7.7 Kaynak sağlık durumu

Kompakt bir sistem durumu paneli oluştur.

Kaynak örnekleri:

* arXiv
* Hugging Face
* Ollama
* AlphaSignal
* LinkedIn
* RSSHub
* changedetection.io
* n8n

Durumlar:

* Aktif
* Bekliyor
* Hata
* Devre dışı

Her kaynak için:

* Son kontrol zamanı
* Son bulunan içerik sayısı
* Hata varsa kısa açıklama
* Durum rozeti

---

# 8. Araştırmalar sayfası

`/research` sayfasında makale odaklı bir görünüm oluştur.

Filtreler:

* Kaynak
* Kategori
* Tarih aralığı
* Yazar
* Etiket
* Önem puanı
* Yenilik puanı
* Zorluk seviyesi
* Okundu/okunmadı
* Favori durumu

Görünüm seçenekleri:

* Grid
* Liste
* Kompakt

Makale kartında:

* Başlık
* Yazarlar
* Kaynak
* Yayın tarihi
* Abstract özeti
* Türkçe AI özeti
* Ana teknik katkılar
* Etiketler
* Önem puanı
* Yenilik puanı
* Zorluk seviyesi
* PDF bağlantısı
* Orijinal sayfa bağlantısı
* Kaydet butonu

---

# 9. Modeller sayfası

`/models` sayfası AI modellerini göstermeli.

Filtreler:

* Kaynak
* Organizasyon
* Pipeline
* Model boyutu
* Lisans
* Güncellenme tarihi
* Trend skoru
* İndirme büyümesi

Kart veya tablo görünümü oluştur.

Model alanları:

* Model adı
* Organizasyon
* Model ID
* Kaynak
* Pipeline
* Parametre boyutu
* Quantization
* Context length
* Lisans
* İndirme sayısı
* Like sayısı
* Günlük büyüme
* Haftalık büyüme
* Son güncelleme
* Trend skoru
* Model sayfasına git

Bir karşılaştırma özelliği için şimdilik yalnızca UI hazırlayabilirsin.

En fazla üç model seçilebilsin.

---

# 10. Kişiler sayfası

`/people` sayfasında takip edilen kişiler gösterilsin.

Her kişi için:

* İsim
* Rol
* Şirket veya kurum
* Platform
* Takip durumu
* Son kontrol zamanı
* Son gönderi tarihi
* Yeni gönderi sayısı
* İlgi alanları
* Profil detayına git

Detay sayfasında gönderi geçmişi timeline şeklinde gösterilsin.

LinkedIn entegrasyonu henüz yapılmayacak.

Mock veriler kullan.

---

# 11. Trendler sayfası

`/trends` sayfasında grafikler ve analiz kartları oluştur.

Grafikler:

* Günlere göre içerik sayısı
* En hızlı yükselen konular
* Kaynaklara göre içerik dağılımı
* Model indirme büyümesi
* Etiket yoğunluğu
* Haftalık makale artışı
* Kaynak sağlık geçmişi

Recharts kullan.

Grafikler responsive olsun.

Ayrıca şu insight kartlarını ekle:

* Haftanın en hızlı yükselen konusu
* En çok güncellenen model
* En yüksek yenilik puanlı makale
* En aktif takip edilen kişi
* Kaynaklar arası ortak trend

---

# 12. Kaydedilenler sayfası

`/bookmarks` sayfasında kullanıcı tarafından kaydedilen içerikler gösterilsin.

İçerikler şu koleksiyonlara ayrılabilsin:

* Daha sonra oku
* Önemli
* Araştırılacak
* Proje fikri
* Model denemeleri
* Arşiv

Şimdilik state veya mock data kullan.

Kalıcı backend bağlantısı yapma.

---

# 13. Kaynaklar sayfası

`/sources` sayfasında kaynak yönetimi görünümü oluştur.

Kaynak kartında:

* Kaynak adı
* Kaynak türü
* URL
* Aktif/pasif durumu
* Son kontrol zamanı
* Son başarılı çalışma
* Bulunan toplam içerik
* Yeni içerik sayısı
* Son hata
* Manuel çalıştır butonu
* Ayar butonu

“Yeni kaynak ekle” dialog’u hazırla.

Alanlar:

* Kaynak adı
* Kaynak türü
* URL
* Kontrol sıklığı
* Etiketler
* Aktif/pasif

Bu form henüz gerçek backend’e kayıt yapmayacak.

Mock işlemler kullan.

---

# 14. Ayarlar sayfası

`/settings` sayfasında şu bölümleri oluştur:

* Genel görünüm
* Tema
* Dil
* Varsayılan görünüm
* Trend ağırlıkları
* İlgi alanları
* Bildirim tercihleri
* Veri kaynakları
* AI sağlayıcı tercihleri
* Gizlilik
* Veri dışa aktarma
* Sistem bilgileri

AI sağlayıcı seçenekleri:

* Gemini
* Groq
* Ollama
* OpenRouter

API key input alanları yalnızca görsel prototip olarak bulunabilir.

Gerçek API anahtarı saklama veya frontend’e gömme.

---

# 15. Global arama

Navigasyondaki arama butonu bir Command Palette açsın.

Klavye kısayolu:

```text
Ctrl + K
```

Arama kategorileri:

* İçerikler
* Modeller
* Kişiler
* Kaynaklar
* Etiketler

Mock arama kullan.

Kullanıcı yazdıkça sonuçları filtrele.

---

# 16. İçerik detay sayfası

`/content/[id]` sayfasında şu alanları göster:

* Başlık
* Kaynak
* İçerik türü
* Yayın tarihi
* İlk görülme tarihi
* Son güncelleme tarihi
* Yazarlar
* Etiketler
* Türkçe özet
* Orijinal abstract veya içerik
* Ana teknik katkılar
* Neden önemli?
* Kullanım alanları
* Sınırlamalar
* Önem puanı
* Yenilik puanı
* Zorluk seviyesi
* Benzer içerikler
* İlgili modeller
* Orijinal kaynağı aç
* PDF’i aç
* Favoriye ekle
* Okundu olarak işaretle

Sağ tarafta sticky bilgi paneli kullanılabilir.

---

# 17. Veri modelleri

Aşağıdaki TypeScript modellerini oluştur.

## ContentItem

```typescript
export type ContentSource =
  | "arxiv"
  | "huggingface"
  | "ollama"
  | "alphasignal"
  | "linkedin"
  | "github"
  | "rss"
  | "other";

export type ContentType =
  | "paper"
  | "model"
  | "article"
  | "post"
  | "release"
  | "newsletter";

export interface ContentItem {
  id: string;
  source: ContentSource;
  type: ContentType;
  externalId: string;
  title: string;
  summary: string;
  originalContent?: string;
  url: string;
  imageUrl?: string;
  authors: string[];
  organization?: string;
  publishedAt: string;
  firstSeenAt: string;
  updatedAt?: string;
  tags: string[];
  relevanceScore: number;
  noveltyScore: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  isBookmarked: boolean;
  isRead: boolean;
  isFeatured?: boolean;
}
```

## ModelItem

```typescript
export interface ModelItem {
  id: string;
  source: "huggingface" | "ollama" | "other";
  modelId: string;
  name: string;
  organization: string;
  description: string;
  url: string;
  pipeline?: string;
  parameterSize?: string;
  quantization?: string;
  contextLength?: number;
  license?: string;
  downloads: number;
  likes: number;
  dailyGrowth: number;
  weeklyGrowth: number;
  trendScore: number;
  updatedAt: string;
  tags: string[];
}
```

## PersonItem

```typescript
export interface PersonItem {
  id: string;
  name: string;
  role: string;
  organization?: string;
  platform: "linkedin" | "x" | "github" | "other";
  profileUrl: string;
  avatarUrl?: string;
  topics: string[];
  lastCheckedAt?: string;
  lastPostAt?: string;
  newPostCount: number;
  isActive: boolean;
}
```

## SourceStatus

```typescript
export interface SourceStatus {
  id: string;
  name: string;
  type: string;
  url?: string;
  status: "active" | "waiting" | "error" | "disabled";
  lastCheckedAt?: string;
  lastSuccessfulRunAt?: string;
  totalItems: number;
  newItems: number;
  lastError?: string;
  checkIntervalMinutes: number;
}
```

---

# 18. Mock veri yapısı

Mock verileri ayrı dosyalarda tut:

```text
src/data/mock-content.ts
src/data/mock-models.ts
src/data/mock-people.ts
src/data/mock-sources.ts
src/data/mock-trends.ts
```

En az:

* 20 içerik
* 10 model
* 8 kişi
* 8 kaynak
* 14 günlük trend verisi

oluştur.

Veriler gerçekçi ve yapay zekâ alanına uygun olsun.

Başlıklar birbirinin aynısı olmasın.

Örnek konular:

* Agentic memory
* Multi-agent orchestration
* MCP güvenliği
* RAG değerlendirme
* Reasoning models
* Local LLM
* Embedding modelleri
* AI benchmark
* Tool calling
* Long-context models
* Multimodal agents
* AI automation

---

# 19. Servis ve veri erişim katmanı

UI bileşenleri mock verileri doğrudan import etmesin.

Bir servis katmanı oluştur:

```text
src/lib/services/content-service.ts
src/lib/services/model-service.ts
src/lib/services/person-service.ts
src/lib/services/source-service.ts
```

Örneğin:

```typescript
export async function getFeaturedContent(): Promise<ContentItem> {
  // İlk sürümde mock veri döndür.
}

export async function getLatestContent(): Promise<ContentItem[]> {
  // İlk sürümde mock veri döndür.
}
```

Bu katman ileride Supabase veya FastAPI çağrılarıyla değiştirilebilsin.

Servis fonksiyonlarının dışındaki UI kodu veri kaynağının mock mu gerçek mi olduğunu bilmesin.

---

# 20. Bileşen yapısı

Tekrar kullanılabilir bileşenler oluştur.

Önerilen klasör yapısı:

```text
src/
├── app/
│   ├── page.tsx
│   ├── research/
│   ├── models/
│   ├── people/
│   ├── trends/
│   ├── bookmarks/
│   ├── sources/
│   ├── settings/
│   ├── content/[id]/
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
│
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── content/
│   ├── models/
│   ├── people/
│   ├── trends/
│   ├── sources/
│   ├── search/
│   └── shared/
│
├── data/
├── lib/
│   ├── services/
│   ├── schemas/
│   ├── constants/
│   ├── utils/
│   └── formatters/
│
├── types/
└── hooks/
```

Örnek bileşenler:

* Header
* MobileNavigation
* Footer
* HeroStory
* ContentCard
* CompactContentCard
* ResearchCard
* ModelCard
* PersonPostCard
* SourceStatusCard
* TrendTopicChip
* ScoreBadge
* SourceBadge
* TagList
* EmptyState
* ErrorState
* LoadingSkeleton
* SearchCommand
* FilterBar
* ViewToggle
* SectionHeader
* StatCard

---

# 21. Durum tasarımları

Her veri listesi için şu durumları hazırla:

## Loading

Skeleton bileşenleri kullan.

## Empty

Kullanıcıya neden veri olmadığını ve ne yapabileceğini anlatan şık empty state göster.

## Error

Hata mesajı ve tekrar dene butonu göster.

## Success

Normal içerik görünümü.

Bu durumlar tasarımın doğal parçası olmalı.

---

# 22. Responsive tasarım

Uygulama şu ekranlarda düzgün çalışmalı:

* Mobil
* Tablet
* Laptop
* Büyük masaüstü ekran

Mobilde:

* Grid tek sütuna düşmeli.
* Hero kartı sadeleşmeli.
* Filtreler drawer veya sheet içinde açılmalı.
* Navigasyon hamburger menü olmalı.
* Grafikler yatay taşmamalı.
* Başlık boyutları kontrollü küçülmeli.

---

# 23. Erişilebilirlik

Şunlara dikkat et:

* Semantic HTML
* Klavye navigasyonu
* Uygun aria-label kullanımı
* Yeterli renk kontrastı
* Focus state
* Buton ve link ayrımı
* Form label’ları
* Reduced motion tercihi

---

# 24. Performans

Şunları uygula:

* Gereksiz Client Component kullanma.
* Büyük bileşenleri gerektiğinde lazy load et.
* Grafik bileşenlerini gerektiğinde dinamik import et.
* Liste render işlemlerinde stabil key kullan.
* Görseller için Next.js Image kullan.
* Layout shift oluşturmamaya çalış.
* Mock verileri gereksiz yere client bundle’a taşıma.
* Animasyonları hafif tut.

---

# 25. Güvenlik kuralları

İlk sürüm mock data kullansa bile şu kurallara uy:

* API key frontend koduna yazma.
* Gerçek secret oluşturma.
* `.env.example` oluştur.
* `.env.local` dosyasını `.gitignore` içine ekle.
* `NEXT_PUBLIC_` değişkenlerinin gizli olmadığını README’de açıkla.
* Kullanıcı tarafından girilen HTML’i doğrudan render etme.
* Haricî URL’lerde güvenli link özellikleri kullan.

---

# 26. README

Kapsamlı bir `README.md` oluştur.

README şu başlıkları içersin:

* Proje nedir?
* Temel özellikler
* Kullanılan teknolojiler
* Kurulum
* Çalıştırma
* Build alma
* Klasör yapısı
* Veri modelleri
* Mock veri sistemi
* Gerçek backend’e geçiş planı
* Supabase entegrasyon planı
* arXiv entegrasyon planı
* Hugging Face entegrasyon planı
* n8n entegrasyon planı
* RSSHub entegrasyon planı
* changedetection.io entegrasyon planı
* Güvenlik notları
* Gelecek geliştirmeler

Kurulum komutları açık şekilde yazılsın:

```bash
npm install
npm run dev
npm run lint
npm run build
```

---

# 27. Gelecek entegrasyonlara hazırlık

Kodun içine gerçek entegrasyonları şimdi ekleme.

Ancak aşağıdaki adaptör yapısını hazırla:

```text
src/lib/adapters/
├── arxiv-adapter.ts
├── huggingface-adapter.ts
├── ollama-adapter.ts
├── linkedin-adapter.ts
├── rss-adapter.ts
└── generic-content-adapter.ts
```

Her adaptör ileride dış kaynaktan gelen veriyi ortak `ContentItem` modeline çevirecek.

Şimdilik yalnızca interface ve örnek dönüşüm fonksiyonları oluşturabilirsin.

Örnek:

```typescript
export interface ContentAdapter<T> {
  normalize(input: T): ContentItem;
}
```

---

# 28. Kodlama ilkeleri

Şunlara uy:

* Kod tekrarından kaçın.
* Bileşenleri gereksiz yere aşırı parçalama.
* Büyük sayfa bileşenlerinde mantığı alt bileşenlere ayır.
* `any` kullanma.
* TypeScript strict mode ile uyumlu yaz.
* Sabit değerleri constants dosyasında tut.
* Tarih ve sayı formatlama işlemlerini yardımcı fonksiyonlara taşı.
* Hataları sessizce yutma.
* Anlaşılır isimler kullan.
* Gereksiz yorum yazma.
* Karmaşık mantıkta kısa ve faydalı yorumlar kullan.
* Dosyaları tek sorumluluk ilkesine uygun tut.

---

# 29. Yapılmaması gerekenler

Şunları yapma:

* Hazır admin dashboard template’ini kopyalama.
* Sayfanın her yerini kartlarla doldurma.
* Aşırı gradient kullanma.
* Her alana animasyon ekleme.
* Mock veriyi bileşenlerin içine gömme.
* API key’i frontend’e koyma.
* Sahte backend yazıp çalışıyormuş gibi gösterme.
* Gereksiz state yönetim kütüphanesi ekleme.
* Redux kullanma.
* İlk sürümde authentication ekleme.
* İlk sürümde gerçek scraping yapma.
* İlk sürümde n8n veya Supabase kurma.
* İlk sürümde LinkedIn otomasyonu yapma.

---

# 30. Kabul kriterleri

Proje tamamlandığında aşağıdaki şartların tamamı sağlanmalı:

* `npm install` başarılı olmalı.
* `npm run dev` ile proje çalışmalı.
* `npm run lint` hata vermemeli.
* `npm run build` başarılı olmalı.
* Bütün route’lar açılmalı.
* Mobil görünüm çalışmalı.
* Dark mode çalışmalı.
* Global arama çalışmalı.
* Filtre UI’ları çalışmalı.
* Mock veriler servis katmanından gelmeli.
* Loading, empty ve error state’ler bulunmalı.
* Grafikler responsive olmalı.
* İçerik detay sayfası çalışmalı.
* Model detay sayfası çalışmalı.
* Kişi detay sayfası çalışmalı.
* Tasarım modern bir teknoloji haber platformu gibi görünmeli.
* Kod gerçek backend entegrasyonuna hazır olmalı.
* README eksiksiz olmalı.

---

# 31. Çalışma yöntemi

Aşağıdaki sırayla ilerle:

1. Mevcut klasörü incele.
2. Proje yoksa Next.js projesi oluştur.
3. Bağımlılıkları kur.
4. Veri modellerini oluştur.
5. Mock verileri oluştur.
6. Servis katmanını oluştur.
7. Ana layout ve navigasyonu oluştur.
8. Ana sayfayı oluştur.
9. Diğer sayfaları oluştur.
10. Detay sayfalarını oluştur.
11. Grafik ve filtreleri ekle.
12. Responsive tasarımı tamamla.
13. Loading, error ve empty state’leri ekle.
14. Lint ve build hatalarını düzelt.
15. README’yi oluştur.
16. Son olarak proje yapısını ve çalıştırma komutlarını özetle.

Her önemli aşamadan sonra uygulamanın build durumunu kontrol et.

Çalışmayan veya yarım bırakılmış kod üretme.

Bir paket güncel Next.js sürümüyle uyumsuzsa daha uygun ve güncel bir alternatif kullan.

---

# 32. İlk teslim kapsamı

İlk teslim yalnızca frontend ve mock data prototipi olacak.

İlk teslimde:

* Gerçek API çağrısı yapılmayacak.
* Supabase bağlanmayacak.
* n8n bağlanmayacak.
* RSSHub çalıştırılmayacak.
* changedetection.io bağlanmayacak.
* LinkedIn scraping yapılmayacak.
* Gerçek AI API kullanılmayacak.

Ancak bütün mimari bu entegrasyonlara hazır olacak.

Sonuç olarak bana çalışan, özgün, profesyonel ve genişletilebilir bir **COPT Radar AI araştırma haber dashboard’u** teslim et.
