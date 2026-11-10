import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Vercel Serverless Function 60 saniye zaman aşımı izni

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = "image/jpeg" } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: "Görsel verisi (base64) bulunamadı." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY ortam değişkeni tanımlı değil." },
        { status: 500 }
      );
    }

    // Base64 başlığını (data:image/...;base64,) temizle
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, "");

    const systemPrompt = `Sen Trustline Real Estate için uzman bir gayrimenkul veri çıkarma (OCR ve form analizi) asistanısın.
Sana Trustline şirketine ait fiziki "İŞLEM SONRASI OFİS RAPORU" evrakının taranmış veya fotoğraflanmış bir görseli veriliyor.

Bu form şirkette İKİ FARKLI FORMATTA doldurulmuş olabilir:

---
FORMAT 1: NUMARALI BÖLÜMLERDEN OLUŞAN FORM ("İŞLEM SONRASI OFİS RAPORU - TRUSTLINE REAL ESTATE by Volkan Affan Kanıgür")
- Başlık: "GD ADI SOYADI", "İŞLEM / PORTFÖY NO", "RAPOR TARİHİ".
- 01 GAYRİMENKUL BİLGİLERİ: Satış veya Kiralama kutucukları, ADRES, Mülk Türü (Ofis, Daire, Villa, Apartman, Arsa, Dükkan), Arazi m², Arsa türü (Ticari, Villalık).
- 02 TARAFLAR VE İŞLEM TARİHLERİ: Mülk Sahibi Adı/Tel, Yetki Belgesi Alınan Tarih, Alıcı/Kiracı Adı/Tel, Depozito Tarihi, İşlem Kapatma Tarihi, Satış Süresi.
- 03 ALICININ ULAŞTIĞI KANAL: Branda, Telefon, Tavsiye, Web, Sosyal medya, Saha çalışması, İlan siteleri, YouTube, Yüz yüze sunum, Etkinlik, Portföy videosu, Reklam alanları.
- 04 İŞLEM BİLGİLERİ: Para Birimi, Satış/Kiralama Fiyatı, Kaça Satıldı/Kiralandı, Anlaşılan Hizmet Bedeli, Tahsilat Tarihi/Yöntemi, Notlar.
- 05 PORTFÖY TÜRÜ VE PAYLAŞIM: Kendi portföyü, Ofis portföyü, Ortak. Satış GD Payı (% ve Tutar), Ortak Payı (% ve Tutar), Ofis Payı (% ve Tutar).

---
FORMAT 2: TABLO / KUTU IZGARASI DÜZENİNDEKİ FORM ("TRUSTLINE ESTATE LTD. İŞLEM SONRASI OFİS RAPORU")
- Üst Çubuk:
  - "GD Adı Soyadı": Danışmanın adı soyadı.
  - "SATILIK" [ ] veya "KİRALIK" [ ] kutucuğu: Hangisi işaretliyse veya doldurulmuşsa dealType ('sale' veya 'rent').
  - "TARİH:": Raporun veya işlemin tarihi.
- İŞLEM YAPILAN GAYRİMENKUL ÖN BİLGİLERİ:
  - Sol Tablo: OFİS, DAİRE, VİLLA (YÜZME HAVUZU), APARTMAN, ARSA (TİCARİ, VİLLALIK), DÜKKAN, ARAZİ M2 kutucukları. Hangisi seçilmiş veya doldurulmuşsa propertyType, landArea, landType.
  - Sağ Kutu: "ADRES:" alanı gayrimenkulün açık adresi (propertyAddress).
- MÜLK SAHİBİ BİLGİLERİ:
  - "ADI SOYADI": Mülk sahibi (sellerName).
  - "TEL": Mülk sahibi telefon (sellerPhone).
  - "YETKİ BELGESİ ALINAN TARİH": (mandateDate).
  - "DEPOZİTO TARİHİ": (depositDate).
- ALICIN BİLGİLERİ (veya ALICI BİLGİLERİ):
  - "ADI SOYADI": Alıcı / kiracı (buyerName).
  - "TEL": Alıcı / kiracı telefon (buyerPhone).
  - "İŞLEM KAPATMA TARİHİ": (closingDate).
  - "SATIŞ SÜRESİ (GÜN/HAFTA/AY)": (dealDuration).
- İŞLEM BİLGİLERİ (Sol Kutu):
  - "SATIŞ / KİRALAMA FİYATI": İlan fiyatı (listingPrice).
  - "KAÇA SATILDI/KİRALANDI": Gerçekleşen fiyat (closingPrice).
  - "ALINAN HİZMET BEDELİ": Komisyon tutarı (commissionAmount).
  - "NOTLAR": İşlem notları.
- ALICI HANGİ KANALDAN ULAŞTI (Sağ Kutu):
  - BRANDA, TELEFON, TAVSİYE, WEB, SOSYAL MEDYA, SAHA ÇALIŞMASI, YOUTUBE, YÜZYÜZE SUNUM, ETKİNLİK, İLAN SİTELERİNDEN, PORTFÖY VİDEOSU, REKLAM ALANLARINDA.
- OFİS İÇİ PAYLAŞIM (STG) / ALT BÖLÜM:
  - "TOPLAM HİZMET BEDELİ": Toplam komisyon tutarı.
  - "PORTFÖY GD": Portföy danışmanının adı ve miktarı (MİKTAR).
  - "SATIŞ GD": Satış danışmanının adı ve miktarı (MİKTAR).
  - Eğer hem Portföy GD hem Satış GD yazılmışsa ve farklı kişilerse portfolioOrigin='advisor', sharingType='internal', partnerAdvisorName=Portföy GD adı, partnerAmount=Portföy GD Miktarı, advisorAmount=Satış GD Miktarı.
- BROKER (VOLKAN AFFAN KANIGÜR) & ÖZEL NOTLAR:
  - Özel notlar varsa formun "notes" alanına ekle.

---
Görseldeki el yazılarını, basılı metinleri, kutucuk işaretlerini (tik, çarpı, daire, nokta veya boyama) ve rakamları titizlikle oku.

ÇOK ÖNEMLİ KURAL (KENAR VE DİPNOTLAR):
Kağıdın kenar boşluklarına (marjinlere), form kutularının dışına, sayfanın sağına, soluna, üstüne veya altına sonradan el yazısıyla iliştirilmiş herhangi bir not, açıklama, telefon veya hatırlatma varsa bunu ASLA atlama. Bu metinleri de eksiksiz okuyup "notes" alanına "Kenar Notu: ..." şeklinde ekle.

Aşağıdaki JSON şemasına birebir uygun, SADECE saf geçerli bir JSON çıktısı üret (markdown kod blokları veya açıklama metni olmadan doğrudan { ... }):

{
  "advisorName": "Satış GD veya GD Adı Soyadı alanındaki danışman adı soyadı",
  "portfolioNo": "İşlem veya Portföy No varsa yaz, yoksa boş dize",
  "reportDate": "Rapor Tarihi veya üstteki Tarih alanı (örn: 19.10.2026 veya YYYY-MM-DD)",
  "dealType": "Satılık işaretliyse 'sale', Kiralık işaretliyse 'rent' (varsayılan: 'sale')",
  "propertyAddress": "Gayrimenkul adresi",
  "propertyType": "Daire, Villa, Ofis, Apartman, Arsa, Dükkan",
  "landArea": "Arazi m² varsa değeri",
  "landType": "Ticari veya Villalık",
  "sellerName": "Mülk Sahibi Adı Soyadı",
  "sellerPhone": "Mülk Sahibi Telefon",
  "mandateDate": "Yetki Belgesi Alınan Tarih",
  "buyerName": "Alıcı / Kiracı Adı Soyadı",
  "buyerPhone": "Alıcı / Kiracı Telefon",
  "depositDate": "Depozito Tarihi",
  "closingDate": "İşlem Kapatma Tarihi",
  "dealDuration": "Satış / Kiralama Süresi (örn: 2 gün, 1 ay)",
  "leadSource": "Alıcının Ulaştığı Kanal (Branda, Telefon, Tavsiye, Web, Sosyal medya, Saha çalışması, İlan siteleri, YouTube, Yüz yüze sunum, Etkinlik, Portföy videosu, Reklam alanları)",
  "currency": "Para birimi (GBP, TRY, USD, EUR) - yazmıyorsa 'GBP'",
  "listingPrice": 0,
  "closingPrice": 0,
  "commissionAmount": 0,
  "collectionDateMethod": "Tahsilat Tarihi / Yöntemi",
  "portfolioOrigin": "Kendi portföyü ise 'advisor', Ofis ise 'office', Ortak ise 'partner'",
  "partnerAdvisorName": "Portföy GD veya Ortak Danışman Adı",
  "partnerPhone": "Ortak İletişim Bilgisi",
  "advisorRate": 0,
  "advisorAmount": 0,
  "partnerRate": 0,
  "partnerAmount": 0,
  "officeRate": 0,
  "officeAmount": 0,
  "notes": "Notlar, Özel Notlar ve kağıdın kenarına/dışına iliştirilmiş tüm el yazısı ek açıklamalar"
}

Rakamları para birimlerinden ve noktalama işaretlerinden arındırıp sayısal (number) olarak ver (örn: "800 GBP" -> 800).
Okuyamadığın alanları boş dize ("") veya 0 olarak bırak.`;

    // Hızlı ve yüksek kotalı aktif Gemini Vision modelleri (sırayla denenir)
    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3-flash-preview",
      "gemini-3.6-flash",
    ];
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const geminiPayload = {
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiPayload),
        });

        if (!res.ok) {
          const errText = await res.text();
          lastError = `Gemini (${model}) hatası: ${res.status} - ${errText.slice(0, 150)}`;
          // 503 veya 429 yoğunluk/kota anlık ise biraz bekle ve sonraki modele geç
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }

        const data = await res.json();
        const candidateText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!candidateText) {
          lastError = `Gemini (${model}) boş yanıt döndürdü.`;
          continue;
        }

        // JSON bloğunu ayıkla
        let jsonStr = candidateText.trim();
        if (jsonStr.includes("```")) {
          const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) {
            jsonStr = match[1];
          }
        }
        const firstBrace = jsonStr.indexOf("{");
        const lastBrace = jsonStr.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(jsonStr);
        return NextResponse.json({ success: true, data: parsed, usedModel: model });
      } catch (e: any) {
        lastError = e?.message || String(e);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: lastError || "Görsel yapay zeka tarafından çözümlenemedi. Lütfen tekrar deneyin.",
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Sunucu hatası oluştu.",
      },
      { status: 500 }
    );
  }
}

