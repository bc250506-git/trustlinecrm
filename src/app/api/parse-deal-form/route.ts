import { NextRequest, NextResponse } from "next/server";

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

    const systemPrompt = `Sen bir uzman gayrimenkul veri çıkarma (OCR ve form analizi) asistanısın.
Sana Trustline Real Estate şirketine ait fiziki "İŞLEM SONRASI OFİS RAPORU" isimli formun taranmış veya fotoğraflanmış bir görseli veriliyor.
Görseldeki el yazılarını, basılı metinleri, işaretli onay kutularını (checkbox) ve rakamları titizlikle oku.

Aşağıdaki JSON şemasına birebir uygun, SADECE saf geçerli bir JSON çıktısı üret (markdown kod blokları veya açıklama metni olmadan doğrudan { ... }):

{
  "advisorName": "GD ADI SOYADI veya Satış GD alanında yazan danışman adı soyadı (örn: Volkan Kanıgür)",
  "portfolioNo": "İŞLEM / PORTFÖY NO alanındaki kod (örn: TRL-24-101)",
  "reportDate": "RAPOR TARİHİ (YYYY-MM-DD veya orijinal metin)",
  "dealType": "01 alanındaki Satış işaretliyse 'sale', Kiralama işaretliyse 'rent' (varsayılan: 'sale')",
  "propertyAddress": "01 GAYRİMENKUL BİLGİLERİ -> ADRES alanında yazan tam metin (örn: Girne Merkez 2+1 Daire)",
  "propertyType": "İşaretli olan: Daire, Villa, Ofis, Apartman, Arsa, Dükkan",
  "landArea": "Arazi m² alanında yazan değer",
  "landType": "Arsa türü: Ticari veya Villalık",
  "sellerName": "02 TARAFLAR -> MÜLK SAHİBİ ADI SOYADI",
  "sellerPhone": "MÜLK SAHİBİ TELEFON",
  "mandateDate": "YETKİ BELGESİ ALINAN TARİH",
  "buyerName": "ALICI / KİRACI ADI SOYADI",
  "buyerPhone": "ALICI / KİRACI TELEFON",
  "depositDate": "DEPOZİTO TARİHİ",
  "closingDate": "İŞLEM KAPATMA TARİHİ (YYYY-MM-DD veya orijinal tarih)",
  "dealDuration": "SATIŞ / KİRALAMA SÜRESİ",
  "leadSource": "03 ALICININ ULAŞTIĞI KANAL (Branda, Telefon, Tavsiye, Web, Sosyal medya, Saha çalışması, İlan siteleri, YouTube, Reklam alanları)",
  "currency": "04 İŞLEM BİLGİLERİ -> Para birimi (GBP, TRY, USD, EUR) - yazmıyorsa 'GBP'",
  "listingPrice": 0, // SATIŞ / KİRALAMA FİYATI (sayı olarak)
  "closingPrice": 0, // KAÇA SATILDI / KİRALANDI (gerçekleşen fiyat, sayı olarak)
  "commissionAmount": 0, // ANLAŞILAN HİZMET BEDELİ (komisyon tutarı, sayı olarak)
  "collectionDateMethod": "TAHSİLAT TARİHİ / YÖNTEMİ",
  "portfolioOrigin": "05 PORTFÖY TÜRÜ: Kendi portföyü ise 'advisor', Ofis portföyü ise 'office', Ortak ise 'partner'",
  "partnerAdvisorName": "ORTAK OFİS / DANIŞMAN ADI",
  "partnerPhone": "ORTAK İLETİŞİM BİLGİSİ",
  "advisorRate": 0, // Satış GD % oranı
  "advisorAmount": 0, // Satış GD Tutarı
  "partnerRate": 0, // Ortak % oranı
  "partnerAmount": 0, // Ortak Tutarı
  "officeRate": 0, // OFİS PAYI % oranı
  "officeAmount": 0, // OFİS PAYI Tutarı
  "notes": "Formdaki NOTLAR alanında yazan açıklamalar"
}

Rakamları noktalama işaretlerinden arındırıp sayısal (number) olarak ver (örn: "120.000 GBP" -> listingPrice: 120000, currency: "GBP").
Okuyamadığın alanları boş dize ("") veya 0 olarak bırak.`;

    // Gemini Vision API modelleri (gemini-3-flash-preview ve gemini-3.6-flash)
    const modelsToTry = [
      "gemini-3-flash-preview",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest",
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
          lastError = `Gemini API (${model}) hatası: ${res.status} - ${errText}`;
          continue;
        }

        const data = await res.json();
        const candidateText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: lastError || "Görsel yapay zeka tarafından çözümlenemedi.",
      },
      { status: 502 }
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

