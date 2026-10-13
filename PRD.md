# Trustline CRM 4 — Ürün Gereksinimleri Dokümanı (PRD)

> **Proje Adı:** Trustline CRM  
> **Sürüm:** 4.0.0 (Next.js 15 + Supabase Modernizasyonu)  
> **Hedef Kitle:** Gayrimenkul Brokerları, Ofis Yöneticileri ve Emlak Danışmanları  
> **Temel Amaç:** Emlak ofisinin tüm müşteri havuzunu, portföylerini, kira takip süreçlerini, finansal komisyon paylaşımlarını ve WhatsApp/Meta üzerinden gelen yapay zekâ destekli potansiyel talepleri tek bir modern, hızlı ve güvenli platformda toplamak.

---

## 1. Yönetici Özeti ve Vizyon

Mevcut prototip (`Trustline CRM v3.14.1`), iteratif olarak geliştirilmiş kapsamlı bir gayrimenkul iş mantığına sahiptir. Ancak eski sistemdeki monolitik Vanilla JS mimarisi, saf SQL sorgularının dağınıklığı ve medya dosyalarının doğrudan veritabanında `BYTEA` olarak saklanması sürdürülebilirliği zorlaştırmaktadır.

**Yeni Sürüm (v4.0.0) Vizyonu:**
Eski sistemdeki tüm emlak iş kurallarını, algoritmalarını ve izin modellerini koruyarak; **Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase (PostgreSQL + CDN Storage + Realtime) ve Prisma ORM** üzerine sıfırdan, pırıl pırıl, modüler ve yüksek performanslı bir mimari kurmaktır.

---

## 2. Hedef Teknoloji Mimarisi (Tech Stack)

| Katman | Teknoloji | Görevi ve Gerekçesi |
|---|---|---|
| **Fullstack Framework** | **Next.js 15 (App Router)** | React Server Components (RSC) ile hızlı sayfa yüklemeleri, Server Actions ile güvenli API işlemleri. |
| **Programlama Dili** | **TypeScript 5.x** | Uçtan uca tip güvenliği, sıfır çalışma zamanı nesne hatası. |
| **Veritabanı** | **Supabase (PostgreSQL)** | Yönetilen bulut veritabanı, Row-Level Security (RLS) ve Realtime abonelikler. |
| **Dosya & Medya** | **Supabase Storage** | Mülk fotoğrafları, sözleşme dekontları ve profil avatarları için CDN tabanlı güvenli depolama. |
| **ORM / Veri Katmanı** | **Prisma ORM** | `schema.prisma` ile açık ve ilişkisel şema tanımı; `npx prisma studio` ile görsel veri yönetimi. |
| **Stil & Arayüz** | **Tailwind CSS + Lucide Icons** | Özel lacivert/turkuaz/zümrüt tema, cam (glassmorphism) kartlar, modern mikro-animasyonlar. |
| **Form & Validasyon** | **React Hook Form + Zod** | İstemci ve sunucu tarafında çift katmanlı veri doğrulama. |
| **Kimlik & Oturum** | **Supabase Auth / HttpOnly Sessions** | Şifrelenmiş çerezler, CSRF koruması, 8 saatlik sunucu taraflı oturumlar. |

---

## 3. Kullanıcı Rolleri ve Yetki Matrisi

Sistem katı bir iki seviyeli yetki modeline dayanır:

### 3.1. Broker / Yönetici (`admin`)
- Tüm kayıtları (tüm danışmanların müşterilerini, portföylerini, görüşmelerini) görür ve düzenler.
- Kullanıcı ekler, yetkilerini belirler, pasifleştirir veya geçici şifre atar.
- Kira Takip, Finans/Komisyon, Danışman Performans Raporları, Mesaj Kutusu (Meta/AI) ve Veri Koruma (Çöp Kutusu / Birleştirme) modüllerine tam erişim hakkına sahiptir.
- Müşteri silme veya kalıcı arşivleme işlemlerini sadece Broker yapabilir.

### 3.2. Gayrimenkul Danışmanı (`agent`)
- **Kapsam İlkesi:** Yalnızca **kendisine atanmış** müşterileri, portföyleri ve takipleri görebilir.
- Ekip yönetimi, işlem geçmişi (audit logs), kira takibi ve veri koruma ekranlarına erişemez.
- Kendisine açık olan modüllere (Müşteriler, Portföyler, Ajanda, Satış Süreci, Finans) Broker izin verdiği ölçüde erişebilir.

| Modül / İşlem | Broker (Yönetici) | Danışman |
|---|---|---|
| Ekip & Kullanıcı Yönetimi | ✅ Tam Yetki | ❌ Erişim Yok |
| İşlem Geçmişi (Audit Logs) | ✅ Tam Yetki | ❌ Erişim Yok |
| Kira Takip & Dekontlar | ✅ Tam Yetki | ❌ Erişim Yok |
| Danışman Raporları | ✅ Tüm Ekip | ❌ Erişim Yok |
| AI Mesaj Kutusu & Onay Masası | ✅ Tam Yetki | ❌ Erişim Yok |
| Çöp Kutusu & Müşteri Birleştirme | ✅ Tam Yetki | ❌ Erişim Yok |
| Müşteriler & Portföyler | ✅ Tüm Kayıtlar | 🔒 Yalnızca Kendisine Atananlar |
| Görüşme Notları & Ajanda | ✅ Tüm Kayıtlar | 🔒 Erişebildiği Müşteriler |
| Satış Süreci (Pipeline) | ✅ Tüm Fırsatlar | 🔒 Yalnızca Kendi Fırsatları |
| CSV İçe Aktarma | ✅ Evet | 🔒 Yalnızca Yetki Verilirse (Kendi adına) |
| Şifre & Profil Değiştirme | ✅ Kendi Hesabı | ✅ Kendi Hesabı |

---

## 4. Modül ve Fonksiyonel Gereksinimler

Sistem 15 ana modülden oluşur:

### 4.1. Dashboard ("Bugün Ne Yapmalıyım?")
- **Günün Özeti:** Tarih (Türkiye saati / Europe/Istanbul), kullanıcı karşılama mesajı.
- **Canlı Sayaçlar:** 
  - Bugün AI'den Eklenen Broker Onaylı Müşteri Sayısı.
  - Aktif Müşteri, Sıcak Müşteri, Zamanı Gelen Takip, Aktif Portföy sayıları.
- **Geciken ve Bugün Yapılacaklar Listesi:** Vadesi geçmiş veya bugüne planlanmış randevular ve aramalar.
- **Gelecek 7 Gün:** Önümüzdeki haftanın randevu programı.
- **İlişki Takibi Alarmı (14 Gün Kuralı):** Son 14 gündür görüşme notu veya takibi girilmemiş bekleyen müşterilerin otomatik uyarı listesi. Tek tıkla "Telefonla Ara", "WhatsApp Aç" veya "Görüşme Notu Ekle" aksiyonları.

### 4.2. Müşteri İlişkileri (Customers & VIP)
- **Kategoriler:** `Alıcı adayı` (buyer), `Satıcı` (seller), `Kiracı` (tenant).
- **Müşteri Kartı Verileri:** Ad Soyad, Telefon, WhatsApp, E-posta, Instagram kullanıcı adı, Kaynak (Manuel, CSV, Meta, YCloud), Bölge tercihi, Gayrimenkul tipi, Bütçe ve Para birimi (`TRY`, `USD`, `EUR`, `GBP`), Sıcaklık (`hot`, `warm`, `cold`), Satış Aşaması, Sorumlu Danışman.
- **VIP Etiketi:** Tek tıkla VIP müşteri işaretleme ve filtrelere ekleme.
- **Mükerrerlik Koruması:** Telefon, WhatsApp veya Instagram kullanıcı adı mükerrer olamaz (benzersiz indeksler).
- **Hızlı Aksiyonlar:** Doğrudan `tel:` linki, `https://wa.me/` linki, Hızlı Görüşme Notu açma, Randevu/Yer Gösterme bağlama.

### 4.3. Portföy Yönetimi (Properties)
- **Kayıt Bilgileri:** Başlık, İlan Türü (Satılık / Kiralık), Gayrimenkul Tipi (Daire, Villa, Arsa, Ticari vb.), Bölge, Fiyat ve Para Birimi, m² (Brüt/Net), Oda Sayısı, Durum (`available`, `reserved`, `sold`, `rented`, `archived`), Adres, Mülk Sahibi Ad & Telefon, Anahtar Sorumlusu, Yetki Sözleşmesi Başlangıç/Bitiş Tarihi, Danışman Notları.
- **Fiyat Geçmişi:** Fiyat veya para birimi her değiştiğinde eski fiyat, yeni fiyat, değiştiren kullanıcı ve zaman damgası `property_price_history` tablosuna otomatik kaydedilir.
- **Fotoğraf Galerisi:** Supabase Storage üzerinde saklanır. EXIF ve konum verileri güvenlik için temizlenir. "Müşteri Paylaşımına Uygun" bayrağı ile seçilen fotoğraflar broşüre aktarılır.
- **Müşteri Broşürü Oluşturucu:** Tek tıkla müşteriye özel şık emlak broşürü görünümü. **Kritik Güvenlik Kuralı:** Broşürde mülk sahibi bilgileri, tam açık adres ve ofis içi danışman notları kesinlikle yer almaz.

### 4.4. Akıllı Eşleştirme Motoru (Matchmaker)
- Müşteri kartında otomatik olarak uygun mülkleri; Portföy kartında ise mülke uygun potansiyel müşterileri listeler.
- **Deterministik Kriterler:**
  1. Aynı para birimi (`TRY` ile `TRY`, `GBP` ile `GBP`).
  2. Bütçe uyumu (Müşteri bütçesi >= Portföy fiyatı).
  3. Bölge ve Gayrimenkul tipi uyumu.
  4. Niyet uyumu (Satın alma ↔ Satılık, Kiralama ↔ Kiralık).

### 4.5. Satış Süreci (Pipeline Kanban)
- **Aşamalar:**
  1. `Yeni lead` (new)
  2. `İlk temas` (contacted)
  3. `İhtiyaç analizi` (qualified)
  4. `Portföy paylaşıldı` (listing_sent)
  5. `Randevu` (appointment)
  6. `Yer gösterimi` (showing)
  7. `Teklif` (offer)
  8. `Kazanıldı` (won)
  9. `Kaybedildi` (lost)
- Sürükle-bırak (Drag-and-drop) veya aşama butonları ile fırsat ilerletme.
- Kazanıldı/Kaybedildi durumlarında kapanış tarihi ve sonuç açıklaması kaydı.

### 4.6. Takvim & Ajanda (Calendar & Workflows)
- **Aylık ve Günlük Takvim Görünümü:** Randevular, yer gösterimleri ve telefon aramaları.
- **İşlem Türleri:** Arama (`call`), Görüşme (`meeting`), Yer Gösterme (`showing`), Diğer (`other`).
- **Yer Gösterme Sonucu Kaydı:** Katıldı/Görüşüldü, Gelmedi/Ulaşılamadı, Beğendi, İlgilenmedi, Teklif Verdi.
- **Erteleme / Tamamlama:** "Yarına Ertele" butonu (saat/tarih atomik güncellenir) ve "Tamamlandı" işaretleme.

### 4.7. Kira Takip Çizelgesi (Rentals & Ledger)
- **Yıllık 12 Aylık Matris:** Ocak-Aralık sütunlarında her kiracı için kira tutarı, para birimi ve vade günü.
- **Vade Günü Kuralı:** 29, 30 ve 31. günler Şubat ve kısa aylarda ayın son gününe otomatik kaydırılır.
- **Kısmi Ödeme & Dekont Defteri:** 
  - Ödendi kutusu anında kaydeder.
  - Kısmi tahsilatta borç sıfırlanana kadar "Geciken kira" uyarısı aktif kalır.
  - Her aya ait banka dekontu (PDF / JPG / PNG) yüklenebilir ve indirilebilir.
- **Sözleşme Bitiş Alarmı:** Bitişe 5 gün kala başlayan ve bitiş sonrası kırmızı yanan bildirim bandı.

### 4.8. Finans & Komisyon Paylaşımı (Finance)
- **Kayıtlar:** Başlık, İlgili Müşteri, İlgili Portföy, Para Birimi, İstenen Fiyat, Son Teklif, Anlaşılan Tutar, Kapora, Beklenen Komisyon, Tahsil Edilen Komisyon, Ödeme Vadesi, Kapanış Tarihi.
- **Otomatik Paylaşım Motoru:**
  - **Danışmanın Kendi Portföyü:** **%60 Danışman / %40 Ofis**
  - **Ofis Portföyü:** **%50 Danışman / %50 Ofis**
- **Para Birimi Ayrımı:** Döviz cinsleri (TRY, GBP, EUR, USD) birbirine eklenmez; her para birimi kendi bağımsız toplam kartında raporlanır.

### 4.9. AI Mesaj Masası (Meta & YCloud WhatsApp Inbox)
- **Kanallar:** WhatsApp (Meta Cloud API & YCloud Business), Instagram Direct, Facebook Messenger.
- **Konuşma Gruplama (Debounce):** Aynı kişiden gelen mesajlar son mesajdan 60 saniye sonra bir araya getirilir (son 7 gün, maksimum 20 mesaj, 8.000 karakter).
- **Yapay Zekâ Analizi:** OpenAI modeli mesajdan isim, talep türü (alıcı/satıcı/kiracı), bölge, emlak tipi ve bütçeyi çıkarır; talep kanıtı (alıntı) ile özetler.
- **Broker Onay Masası:** 
  - Yapay zekâ asla broker onayı olmadan müşteri oluşturamaz.
  - Seçenekler: *1) Yeni Müşteri Oluştur*, *2) Mevcut Müşteriye Bağla*, *3) Bağlı Müşterinin Seçilen Alanlarını Güncelle*, *4) Atla / Yok Say*.

### 4.10. Veri Koruma & Güvenlik Araçları (Data Tools)
- **Çöp Kutusu (Trash):** Soft-delete mantığı ile silinen müşteri ve portföyler normal listelerden gizlenir, istendiğinde tek tıkla geri yüklenir.
- **Müşteri Birleştirme (Customer Merge):** İki mükerrer profil seçilir; biri kapatılırken görüşmeleri, takipleri ve finans kayıtları hedefe aktarılır. Eski profillerin tam kopyası broker denetim arşivinde (`customer_merges`) saklanır.
- **Toplu CSV Aktarımı:** 500 satırlık müşteri CSV dosyaları önizleme tablosunda doğrulanır, hatalı satırlar listelenir, mükerrerler atlanır.

---

## 5. Veritabanı Modelleri (Prisma Schema Tasarımı)

Supabase PostgreSQL üzerinde çalışacak ana modeller:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserRole {
  ADMIN
  AGENT
}

enum PipelineStage {
  NEW
  CONTACTED
  QUALIFIED
  LISTING_SENT
  APPOINTMENT
  SHOWING
  OFFER
  WON
  LOST
}

enum Currency {
  TRY
  USD
  EUR
  GBP
}

enum CustomerCategory {
  BUYER
  SELLER
  TENANT
}

enum PropertyStatus {
  AVAILABLE
  RESERVED
  SOLD
  RENTED
  ARCHIVED
}

model User {
  id                  String       @id @default(uuid())
  name                String
  username            String       @unique
  email               String       @unique
  passwordHash        String
  role                UserRole     @default(AGENT)
  active              Boolean      @default(true)
  mustChangePassword  Boolean      @default(false)
  avatarUrl           String?
  permissions         Json         @default("{\"scope\":\"own\",\"customers\":true,\"properties\":true,\"followups\":true,\"pipeline\":true,\"import\":false,\"finance\":false}")
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  assignedCustomers   Customer[]   @relation("CustomerAssignee")
  assignedProperties  Property[]   @relation("PropertyAssignee")
  followUps           FollowUp[]   @relation("FollowUpAssignee")
  createdFollowUps    FollowUp[]   @relation("FollowUpCreator")
  interactions        Interaction[]
  auditLogs           AuditLog[]
  deals               Deal[]
}

model Customer {
  id              String            @id @default(uuid())
  fullName        String
  phone           String?           @unique
  whatsapp        String?           @unique
  instagramHandle String?
  email           String?
  source          String            @default("manual")
  category        CustomerCategory  @default(BUYER)
  temperature     String            @default("warm")
  isVip           Boolean           @default(false)
  region          String?
  propertyType    String?
  budget          Decimal?
  budgetCurrency  Currency          @default(TRY)
  notes           String?
  stage           PipelineStage     @default(NEW)
  assignedToId    String?
  assignedTo      User?             @relation("CustomerAssignee", fields: [assignedToId], references: [id])
  lastContactAt   DateTime?
  deletedAt       DateTime?
  mergedIntoId    String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  interactions    Interaction[]
  followUps       FollowUp[]
  deals           Deal[]
}

model Property {
  id                String          @id @default(uuid())
  title             String
  region            String
  propertyType      String          @default("Daire")
  listingType       String          @default("sale") // sale | rent
  price             Decimal
  currency          Currency        @default(TRY)
  area              Decimal?
  rooms             String?
  status            PropertyStatus  @default(AVAILABLE)
  address           String?
  ownerName         String?
  ownerPhone        String?
  keyHolder         String?
  location          String?
  mandateStart      DateTime?
  mandateEnd        DateTime?
  notes             String?
  publicDescription String          @default("")
  assignedToId      String?
  assignedTo        User?           @relation("PropertyAssignee", fields: [assignedToId], references: [id])
  deletedAt         DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  photos            PropertyPhoto[]
  priceHistory      PropertyPriceHistory[]
  followUps         FollowUp[]
  deals             Deal[]
}

model PropertyPhoto {
  id          String    @id @default(uuid())
  propertyId  String
  property    Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  url         String
  shareable   Boolean   @default(false)
  createdAt   DateTime  @default(now())
}

model PropertyPriceHistory {
  id          BigInt    @id @default(autoincrement())
  propertyId  String
  property    Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  oldPrice    Decimal?
  oldCurrency Currency?
  price       Decimal
  currency    Currency
  actorId     String?
  createdAt   DateTime  @default(now())
}

model Rental {
  id          String    @id @default(uuid())
  sourceKey   String?   @unique
  data        Json      // Kiracı, ev sahibi, kira tutarı, vadeler, ödemeler
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  receipts    RentalReceipt[]
}

model RentalReceipt {
  id          String    @id @default(uuid())
  rentalId    String
  rental      Rental    @relation(fields: [rentalId], references: [id], onDelete: Cascade)
  dueDate     String
  fileUrl     String
  mimeType    String
  createdAt   DateTime  @default(now())

  @@unique([rentalId, dueDate])
}

model FollowUp {
  id          String    @id @default(uuid())
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  propertyId  String?
  property    Property? @relation(fields: [propertyId], references: [id], onDelete: SetNull)
  title       String
  kind        String    @default("call") // call, meeting, showing, other
  dueAt       DateTime
  status      String    @default("open") // open, done, cancelled
  outcome     String    @default("pending")
  feedback    String    @default("")
  assignedToId String?
  assignedTo  User?     @relation("FollowUpAssignee", fields: [assignedToId], references: [id])
  createdById String?
  createdBy   User?     @relation("FollowUpCreator", fields: [createdById], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Deal {
  id                  String    @id @default(uuid())
  title               String
  customerId          String
  customer            Customer  @relation(fields: [customerId], references: [id])
  propertyId          String
  property            Property  @relation(fields: [propertyId], references: [id])
  currency            Currency  @default(TRY)
  stage               String    @default("offer")
  askingPrice         Decimal   @default(0)
  offeredPrice        Decimal   @default(0)
  agreedPrice         Decimal   @default(0)
  deposit             Decimal   @default(0)
  commissionExpected  Decimal   @default(0)
  commissionReceived  Decimal   @default(0)
  portfolioOrigin     String    // advisor (%60/%40) | office (%50/%50)
  paymentDue          DateTime?
  closingDate         DateTime?
  notes               String?
  createdById         String?
  createdBy           User?     @relation(fields: [createdById], references: [id])
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model Interaction {
  id          String    @id @default(uuid())
  customerId  String
  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  channel     String    // whatsapp, instagram, phone, manual, email
  direction   String    @default("inbound")
  body        String?
  occurredAt  DateTime  @default(now())
  createdById String?
  createdBy   User?     @relation(fields: [createdById], references: [id])
  metadata    Json      @default("{}")
}

model AuditLog {
  id          BigInt    @id @default(autoincrement())
  actorId     String?
  actor       User?     @relation(fields: [actorId], references: [id])
  action      String
  entityType  String
  entityId    String?
  detail      Json      @default("{}")
  createdAt   DateTime  @default(now())
}
```

---

## 6. Güvenlik ve Mimari Prensipler

1. **Katı Veri İzolasyonu:** Danışmanlar hiçbir API veya arayüz yoluyla diğer danışmanların müşterilerini, kira sözleşmelerini veya ofis finansal rakamlarını sorgulayamaz.
2. **Kira & Finans Broker Özeldir:** Kira takvimine ve komisyon dağılımlarına sadece Broker rolü erişebilir (yetki verilmiş danışmanlar sadece kendi işlemlerini görür).
3. **Müşteri Broşürü İzolasyonu:** Müşteri ile paylaşılmak üzere üretilen emlak broşürü URL'lerinde mal sahibi adı, cep telefonu, mülkün kapı/daire numarası ve danışman iç notları asla API yanıtına dahil edilmez.
4. **Fotoğraf Sanitizasyonu:** Yüklenen görseller EXIF (konum, cihaz vb.) bilgilerinden arındırılır ve Supabase Storage'a optimize edilmiş biçimde yüklenir.
5. **Yapay Zekâ Otonomisi Sınırı:** Gelen hiçbir mesaj yapay zekâ tarafından doğrudan müşteri veritabanına otomatik yazılamaz; her işlem Broker onay arayüzünden (`Inbox`) geçmek zorundadır.

---

## 7. Uygulama ve Geliştirme Yol Haritası

- [x] **Adım 0:** Next.js 15 projesinin (`trustline-crm/`) oluşturulması ve bağımlılıkların yüklenmesi.
- [ ] **Adım 1:** Supabase bağlantısının (`.env.local`) yapılması ve Prisma şemasının veritabanına uygulanması (`npx prisma db push`).
- [ ] **Adım 2:** Kimlik doğrulama, Oturum Çerezleri ve Rol tabanlı Layout (Broker vs Danışman Kenar Çubuğu) inşası.
- [ ] **Adım 3:** Portföy ve Müşteri modülleri, Dinamik Eşleştirme Motoru ve Müşteri Broşürü ekranı.
- [ ] **Adım 4:** Kanban Satış Süreci (Pipeline) ve Ajanda/Takvim modülleri.
- [ ] **Adım 5:** Kira Takip Matrisi, Dekont Yükleme Defteri ve Gecikme Alarmları.
- [ ] **Adım 6:** Finans & Komisyon Paylaşımı (60/40 ve 50/50 motoru).
- [ ] **Adım 7:** Meta & YCloud Mesaj Masası (OpenAI Analizi & Broker Karar Formu).
- [ ] **Adım 8:** Veri Koruma (Çöp Kutusu, Müşteri Birleştirme ve CSV İçe Aktarma).

---
*Bu doküman projenin kök dizininde `trustline-crm/PRD.md` olarak kaydedilmiştir ve geliştirme sürecinde tek kaynak gerçek (single source of truth) olarak referans alınacaktır.*
