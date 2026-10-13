# Trustline CRM v5.0 — Stratejik Geliştirme ve Yol Haritası Planı

> **Doküman:** CRM v5.0 Master Plan  
> **Sürüm:** 5.0.0-draft  
> **Tarih:** 2026-10-13  
> **Odak:** KKTC Emlak & Brokeraj Yönetimi, WhatsApp AI Otomasyonları, Gelişmiş Finansal Analitik & Supabase Canlı Veri Mimarisi  

---

## 1. Şimdiye Kadar Neler Yaptık? (Tamamlanan Kilometre Taşları)

Son geliştirme süreçlerinde prototipten kurumsal ölçekli bir mimariye geçiş yapılarak aşağıdaki temel modüller ve operasyonel iş kuralları eksiksiz hayata geçirilmiştir:

### 1.1. Çekirdek Altyapı ve KKTC Lokalizasyonu
- **Modern Teknoloji Yığını:** Next.js 16 (Turbopack), TypeScript 5, TailwindCSS, Zustand Store ve Supabase ilişkisel şema altyapısı (`supabase_schema.sql`).
- **KKTC Coğrafi Veri Tabanı:** 6 ilçe (Girne, Gazimağusa, İskele, Lefkoşa, Güzelyurt, Lefke) ve bunlara bağlı tüm alt bölgeler / köyler kural tabanlı olarak entegre edildi.
- **Para Birimi İzolasyonu:** KKTC emlak piyasasının omurgası olan **İngiliz Sterlini (GBP - £)** birincil döviz olarak konumlandırıldı; EUR, USD ve TRY bağımsız olarak korundu.

### 1.2. Dashboard & Akıllı Alarm Motoru
- **Dinamik Kira Ödeme Alarmı:** Vadesi geçen veya vadesine 3 gün kalan kira ödemeleri otomatik tespit edilip aciliyet sırasına göre gösterilir.
- **Sözleşme Bitiş Alarmı:** 30 gün içinde süresi dolacak kira kontratları için yenileme bildirimleri.
- **İlişki Takibi (14 Gün Kuralı):** 14 gündür temas kurulmayan müşteriler için aksiyon alarmı.
- **Temiz Boş Durum (Zero-State):** Bekleyen alarm olmadığında gereksiz yer kaplamayan, ofise huzur veren "Aktif alarmınız bulunmuyor" tasarımı.

### 1.3. Portföy Yönetimi (Properties)
- **Veri Odaklı ve Fotoğrafsız Tasarım:** Ağır resim yükleri, kırık bağlantılar ve görsel karmaşası tamamen kaldırılarak yüksek yoğunluklu, hızlı ve kurumsal veri kartları oluşturuldu.
- **Zorunlu Mal Sahibi Havuzu:** Mal sahibi adı ve telefonu serbest metin olarak değil; doğrudan Müşteri Havuzundan zorunlu seçilecek şekilde kurgulandı.
- **Modal Üstü Modal (Popup-in-Popup):** Portföy eklerken veya düzenlerken mal sahibi henüz kayıtlı değilse, modal kapanmadan üstüne açılan hızlı müşteri formu ile eklenip otomatik seçilme kabiliyeti.
- **Off-Market (Gizli) Portföy:** İlan sitelerine çıkmayan özel mülkler için gizlilik bayrağı.
- **Danışmanlar Arası Paylaşım Mekanizması:** Portföy sorumlusunun tek tıkla diğer ofis danışmanlarına portföyü görünür kılabilmesi.

### 1.4. Kira Takip Matrisi (Rentals)
- **12 Aylık Finansal Ödeme Matrisi:** Her sözleşme için 12 ayın ödeme durumları (Ödendi, Kısmi, Ödenmedi, Gecikmede).
- **Dekont Yönetimi:** Ödeme kanıtı / dekont bağlantılarının sisteme kaydedilmesi.
- **Modal İçi Hızlı İlişkilendirme:** Sözleşme oluştururken portföy, kiracı ve mal sahibi için yerinde kayıt açabilme.

### 1.5. Finans & Komisyon Paylaşım Matrisi (Finance)
- **KKTC Komisyon Motoru:** Danışman kendi portföyünde %60 Danışman / %40 Ofis; Ofis portföyünde %50 Danışman / %50 Ofis otomatik hesaplama motoru.
- **Net Ciro ve Komisyon:** Kapora ve tahsilat durumu karmaşası kaldırılarak girilen işlemlerin tam tahsil edildiği net muhasebe akışı.
- **GBP Odaklı Yönetici Kartları:** Para birimi bazında boş sıfırlarla dolu gereksiz kartlar yerine genel satış hacmi, toplam komisyon ve hakediş dağılımını gösteren 4 net yönetici kartı.
- **Rol Bazlı Danışman Seçimi:** Broker işlem eklerken ofisteki danışmanı dropdown ile seçebilir; danışman hesabındayken işlem doğrudan kendi adına kilitli olarak kaydedilir.
- **Kesin Tablo Standartı:** `Mülk -> Müşteri -> Portföy Menşei -> Anlaşılan Bedel -> Toplam Komisyon -> Danışman Payı -> Ofis Payı -> İşlem` sıralaması.

### 1.6. Ortak UI / UX Standartları
- **Eylemler Menüsü (`ActionMenu`):** Tablo ve kartlardaki işlem kalabalığı üç çizgi/nokta açılır menüsüne toplandı.
- **Özel Silme Onay Modalı (`DeleteConfirmModal`):** Tarayıcının ilkel ve çirkin `window.confirm()` uyarıları yerine Trustline kurumsal tasarımına tam uyumlu çift onaylı silme modalı projenin tüm noktalarına yerleştirildi.
- **Düzenli Sidebar:** `Anasayfa -> Ajanda -> Müşteri Havuzu -> Portföy Yönetimi -> Kira Takip -> Yetki Takip -> Satış Süreci -> Akıllı Eşleştirme -> Finans & Komisyon -> AI Mesaj -> Veri Koruma`.

### 1.7. Yetki Takip & Aracılık Sözleşmeleri (Mandates)
- **Mal Sahibi Yetki Takip Masası:** Mal sahiplerinin verdiği tek yetkili (exclusive) ve genel yetkili aracılık sözleşmelerinin geçerlilik süreleri, yenileme alarmları ve komisyon oranları takibi.
- **Tek Tıkla Mal Sahibine WhatsApp Yetki Uzatma:** Süresi yaklaşan yetkiler için hazır mesaj taslağı ile doğrudan WhatsApp bildirimi gönderme.
- **Modal Üstü Modal (Popup-in-Popup):** Yeni yetki eklerken mal sahibi veya portföy havuzda yoksa modal kapanmadan anında ekleyip seçme yeteneği.
- **Otomasyon & Bildirim Entegrasyonu:** Yetki süresi dolmak üzere olan portföyler için otomatik bildirim üretilir ve bildirime tıklandığında doğrudan Yetki Takip ekranına yönlendirilir.

---

## 2. Sistemdeki Mevcut Eksikler ve Geliştirme Alanları

Kapsamlı bir kurumsal CRM seviyesine ulaşmak için şu an sistemde eksik olan ve işletmenin verimini katlayacak kritik başlıklar:

| Alan | Mevcut Durum | Eksik / Risk | v5.0 Çözümü |
|---|---|---|---|
| **Grafikler & İstatistikler** | Yalnızca metinsel sayaçlar ve tablolar var. Sıfır grafik. | Broker genel ciro trendini, satış hunisi dönüşüm oranlarını ve danışman performansını görsel olarak okuyamıyor. | Recharts kütüphanesi ile Ciro Trendi, Dönüşüm Hunisi, Danışman Liderlik Tablosu ve Bölge Yoğunluk Grafikleri. |
| **WhatsApp AI Bağlantısı** | Mock / Taslak seviyesinde. | Web sitesi veya WhatsApp'tan gelen talepler manuel işlenmek zorunda. Gece gelen müşteri kaçıyor. | Meta Cloud API / YCloud Webhook + LLM (Claude/OpenAI/Gemini) ile 7/24 otonom müşteri karşılama, nitelendirme ve portföy önerme. |
| **Sözleşme & PDF Üretici** | Yalnızca basit broşür modalı var. | Standart KKTC Kira Sözleşmesi, Yetki Belgesi ve Yer Gösterme Formu elle hazırlanıyor. | Müşteri ve mülk verilerini tek tıkla resmi KKTC şablonlarına basan PDF Sözleşme Motoru. |
| **Otomasyon & Bildirimler** | Alarmlar sadece ekranda statik duruyor. | Kiracıya "Kiranız geldi", danışmana "Yeni sıcak alıcı geldi" diye otomatik mesaj gitmiyor. | WhatsApp / SMS Webhook tetikleyicileri ile otomatik kira hatırlatma ve eşleşme bildirim motoru. |
| **Canlı Veritabanı (Backend)** | Zustand + LocalStorage. | Çok kullanıcılı eşzamanlı çalışmada veriler farklı tarayıcılarda senkronize olmuyor. | Supabase PostgreSQL + Row-Level Security (RLS) + Realtime WebSockets canlı senkronizasyonu. |

---

## 3. CRM v5.0 Modüler Yol Haritası ve Önerilen Özellikler

### MODÜL 1: Gelişmiş Finans & Performans Analitik Paneli (Grafikler & İstatistikler)
Bu modül, Broker ve danışmanların iş performansını veri bilimi seviyesinde analiz etmesini sağlar:

1. **Aylık Ciro & Komisyon Trend Grafiği (Line / Area Chart):**
   - Son 12 ayın toplam satış hacmi, toplam ofis komisyonu ve danışman hakediş eğrileri (GBP bazında).
   - Geçen aya göre büyüme oranı (+%18 vb.).
2. **Satış Hunisi Dönüşüm Oranları (Conversion Funnel Chart):**
   - Müşteri Aşamaları: `Yeni Talep (100)` -> `İletişim Kuruldu (75)` -> `Nitelikli (45)` -> `Yer Gösterme (28)` -> `Teklif (12)` -> `Kazanılan Satış (6)`.
   - Hangi aşamada müşteri kaybedildiğini (Drop-off rate) gösteren huni analizi.
3. **Danışman Liderlik Tablosu (Leaderboard & Performance Matrix):**
   - En çok ciro üreten danışmanlar sıralaması.
   - Ortalama satış kapatma süresi (Cycle time).
   - Portföy kazanma oranı (Listing mandate count).
4. **KKTC Bölge & Portföy Dağılım Grafiği (Donut / Bar Chart):**
   - Hangi bölgede (Girne Merkez, Alsancak, İskele Long Beach, Çatalköy) ne kadar hacim döndüğünün pasta grafiği.
   - Satılık vs Kiralık portföy karlılık kıyası.
5. **Müşteri Kaynak Karlılığı (Acquisition Channel ROI):**
   - Meta Reklamları, 101evler, Sahibinden, Tavsiye/Referans ve Doğrudan Ofis kaynaklarının satışa dönüşme başarı oranı.

---

### MODÜL 2: WhatsApp Business & AI Otonom İletişim Masası

#### WhatsApp AI Entegrasyonu Nasıl Yapılacak? (Mimari Akış)
```
[Müşteri WhatsApp'tan Yazar: "Girne'de 2+1 deniz manzaralı satılık daire arıyorum, bütçem 120k sterlin"]
                                  │
                                  ▼
           [Meta WhatsApp Cloud API / YCloud Webhook]
                                  │
                                  ▼ (POST /api/webhooks/whatsapp)
             [Next.js API Route Webhook Handler]
                                  │
                                  ▼
             [LLM AI Agent (Claude 3.5 / OpenAI GPT-4o)]
             - Dil Tespiti (Türkçe, Rusça, İngilizce)
             - Intent & Varlık Çıkarımı:
               * Kategori: ALICI
               * Bölge: Girne
               * Tip: Daire (2+1)
               * Bütçe: 120,000 GBP
                                  │
                                  ▼
            [Trustline Matchmaker Motorunu Çalıştırır]
             - 120.000 GBP altındaki Girne 2+1 daireleri çeker
                                  │
                                  ▼
        ┌─────────────────────────┴─────────────────────────┐
        ▼                                                   ▼
[Müşteriye WhatsApp'tan Yanıt]                  [CRM'de Otomatik Aksiyon]
"Merhaba Ahmet Bey! Kriterlerinize uygun         - Müşteri kartı otomatik açılır
2 harika portföyümüz var:                       - Kategori: Alıcı / Sıcaklık: Sıcak
1) Alsancak 2+1 Penthouse - 115.000 GBP          - Sorumlu Danışmana anlık alarm:
2) Girne Merkez 2+1 - 105.000 GBP                'WhatsApp'tan yeni alıcı atandı!'
Detaylı broşürü incelemek ister misiniz?"
```

#### Neler Sağlayacak?
1. **7/24 Anında Yanıt:** Mesai saatleri dışında gelen yabancı veya yerli alıcılar hiç beklemeden anında yanıt alır.
2. **Çok Dilli İletişim (İngilizce / Rusça / Türkçe):** Özellikle KKTC emlak piyasasında Rus ve Avrupalı alıcılar kendi dillerinde karşılanır ve Türkçe özetle danışmana aktarılır.
3. **Müşteri Kartının Otomatik Açılması:** Danışmanın elle müşteri yazma zahmetini sıfıra indirir; telefon, isim, bütçe ve talep doğrudan WhatsApp'tan çekilip müşteri havuzuna eklenir.
4. **Broker Onay Masası:** AI tarafından açılan müşteriler ister doğrudan danışmana atanır, ister Broker onayından geçtikten sonra havuza düşer.

---

### MODÜL 3: Akıllı İş Akışları ve Otomasyon Motoru (Triggers & Workflows)

1. **Otomatik Kira Vadesi Hatırlatma Robotu:**
   - Her ay kira vadesine 3 gün kala kiracının WhatsApp'ına otomatik kibar hatırlatma mesajı ve ofis IBAN bilgisi gider.
   - Kira ödendiğinde kiracıya "Ödemeniz alınmıştır, teşekkür ederiz" teyit mesajı gönderilir.
2. **Akıllı Portföy - Müşteri Eşleşme Bildirimi:**
   - Bir danışman yeni bir portföy girdiğinde (örn. 150.000 GBP İskele Daire), sistem arka planda alıcı havuzunu tarar.
   - Bu kritere uyan alıcısı olan danışmanlara anında ekran içi bildirim gider: *"Yeni portföy: 2 müşteriniz (Canan T. ve Ali K.) ile %95 eşleşiyor!"*
3. **Müşteri Soğuma Uyarısı (Lead Decay Alert):**
   - "Sıcak" aşamasında olup 10 gündür hiçbir görüşme notu veya randevusu girilmeyen müşteriler sarıdan kırmızıya döner ve danışmana "Müşteriyi arayın" görevi açılır.
4. **Portföy Sözleşme Yenileme Uyarısı:**
   - Mal sahibi ile yapılan yetki sözleşmesinin bitmesine 15 gün kala danışmana mal sahibini arayıp yetki uzatma görevi oluşturulur.

---

### MODÜL 4: Resmi KKTC Emlak Belge & Sözleşme Motoru (PDF Generator)

1. **Standart KKTC Kira Sözleşmesi:**
   - Kiracı, mal sahibi, portföy detayları, depozito, aylık kira bedeli ve KKTC pul harcı maddeleri hazır şablona otomatik akar; tek tıkla resmi yazdırılabilir PDF üretilir.
2. **Emlak Gösterme & Bilgilendirme Formu:**
   - Müşteriye yer göstermeden önce cep telefonundan veya tabletten dijital imza aldırabilecek mobil uyumlu yer gösterme tutanağı.
3. **Yetkili Emlakçı Satış Aracılık Sözleşmesi:**
   - Mal sahibinden portföy alınırken imzalatılan resmi yetki belgesi.
4. **Alım-Satım Kapora ve Rezervasyon Protokolü:**
   - Anlaşma sağlandığında alıcı ve satıcı haklarını koruyan rezervasyon belgesi.

---

### MODÜL 5: Supabase Canlı Veritabanı ve Realtime Çoklu Kullanıcı

1. **Gerçek Zamanlı Senkronizasyon (WebSockets):**
   - Bir danışman portföy düzenlediğinde veya kira tahsilatı girdiğinde, ofisteki diğer tüm bilgisayarların ekranı sayfa yenilenmeden canlı güncellenir.
2. **Row-Level Security (RLS):**
   - Veritabanı seviyesinde katı güvenlik: Danışmanlar veritabanına doğrudan bağlansa bile sadece kendi müşterilerini ve izin verilen ortak portföyleri sorgulayabilir.
3. **Supabase Storage Entegrasyonu:**
   - Kira sözleşmelerine ait banka dekontları doğrudan Supabase Storage CDN üzerinde güvenli ve şifreli tutulur.

---

## 4. Öncelik Sıralaması ve Adım Adım İlerleme Önerisi

| Aşama | Başlık | Durum | Notlar |
|---|---|---|---|
| **Faz 1** | **Finansal Analitik & Grafikler Paneli** | ✅ **TAMAMLANDI** | Recharts GBP ciro trendleri, satış hunisi düşüş analizi, KKTC bölge dağılımı donutu, Danışman Liderlik Tablosu (🥇🥈🥉), ve Edinim kanalları. Anasayfa ve Finans sekmelerine entegre edildi. |
| **Faz 2** | **Akıllı İş Akışları & Eşleşme Otomasyonları** | ✅ **TAMAMLANDI** | Header bildirim çekmecesi (NotificationCenterDrawer), anlık alarm tarayıcı ("Şimdi Tara"), 5 kural açma/kapatma toggle'ı, kira vadesi alarmları, soğuma uyarısı, portföy eşleşmesi ve doğrudan WhatsApp vade hatırlatma. |
| **Ek Modül** | **Yetki Takip & Aracılık Sözleşmeleri** | ✅ **TAMAMLANDI** | Kira Takip'in altına eklendi. Münhasır/Açık yetki tipleri, kalan gün sayacı, sözleşme yenileme alarmları, doğrudan WhatsApp yetki uzatma mesajı (`wa.me`) ve hızlı yetki ekleme/düzenleme/silme. |
| **Faz 3** | **KKTC PDF Sözleşme & Belge Motoru** | ⏭️ **ATLANDI** | Ofisin kendi profesyonel fiziki/resmi belgeleri ve antetli evrakları olduğu için kullanıcı talebiyle atlandı. |
| **Faz 5** | **Supabase Canlı DB & Realtime Senkronizasyon** | ✅ **TAMAMLANDI** | Supabase PostgreSQL şeması (`supabase_schema.sql` 6 tablo), `db.ts` CRUD fonksiyonları, WebSocket realtime senkronizasyonu, `store.tsx` arka plan bulut senkronizasyonu, ve Veri Koruma sekmesinde canlı bağlantı/gecikme testi + 1 tıkla buluta aktar paneli. |
| **Faz 4** | **WhatsApp & Meta AI Entegrasyonu** | ✅ **TAMAMLANDI** | Next.js API Webhook (`/api/webhooks/whatsapp`), çok dilli NLP niyet & varlık çıkarıcı (TR/EN/RU, bölge, mülk tipi, GBP bütçe), interaktif AI simülasyon konsolu, CRM portföyleriyle anında eşleştirme, çok dilli taslak yanıt üretici ve doğrudan `wa.me` gönderimi. |
| **Ek Modül** | **Kullanıcılar, Kurumsal Login & Ayarlar (Şifre & Güvenlik)** | ✅ **TAMAMLANDI** | Berk Çiftçi (Asistan) ve Volkan Affan Kanıgür (%100 Komisyon, Bölüşüm Yok, Tam Yetki) kullanıcıları oluşturuldu. Trustline kurumsal login ekranı, hızlı hesap seçici, Sidebar'da Veri Koruma'nın altına Ayarlar sekmesi, kalıcı şifre değiştirme (eskiyi devredışı bırakma), KKTC ofis bilgileri ve veritabanı yedekleme eklendi. |

---

## 5. Sistem Durumu ve Canlı Doğrulama

Tüm modüller sıfır hata ile derlenmiş (`next build` / TypeScript hatasız) ve yerel test ortamında (`localhost:3000`) aktif olarak çalışmaktadır.

