import { NextResponse } from "next/server";

// ==============================================================================
// TRUSTLINE CRM 5.0 — META WHATSAPP CLOUD API / YCLOUD WEBHOOK HANDLER
// ==============================================================================

// 1. WEBHOOK DOĞRULAMA (Meta Developer Portal Webhook Verification)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN =
    process.env.WHATSAPP_VERIFY_TOKEN || "trustline_crm_meta_token_2026";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Doğrulama başarısız: Geçersiz token", { status: 403 });
}

// 2. GELEN WHATSAPP MESAJI İŞLEME & AI INTENT/VARLIK ÇIKARIMI
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Meta Webhook Payload Formatı
    let senderPhone = "";
    let senderName = "WhatsApp Müşterisi";
    let messageText = "";

    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = body.entry[0].changes[0].value.messages[0];
      const contactObj = body.entry[0].changes[0].value.contacts?.[0];

      senderPhone = msgObj.from ? `+${msgObj.from}` : "+90 533 000 00 00";
      senderName = contactObj?.profile?.name || "WhatsApp Müşterisi";
      messageText = msgObj.text?.body || "";
    } else if (body.message || body.text) {
      // YCloud veya doğrudan simülasyon formatı
      senderPhone = body.from || body.phone || "+90 533 000 00 00";
      senderName = body.name || body.senderName || "WhatsApp Müşterisi";
      messageText = body.message || body.text || "";
    }

    if (!messageText) {
      return NextResponse.json({ status: "ignored", reason: "Boş mesaj metni" });
    }

    // AI Intent & Entity Extraction (KKTC Kural & LLM Motoru)
    const lower = messageText.toLowerCase();

    // Dil Tespiti
    let language: "TR" | "EN" | "RU" = "TR";
    if (/[а-яА-ЯёЁ]/.test(messageText)) {
      language = "RU";
    } else if (
      lower.includes("looking for") ||
      lower.includes("bedroom") ||
      lower.includes("villa") ||
      lower.includes("budget") ||
      lower.includes("apartment") ||
      lower.includes("for sale")
    ) {
      language = "EN";
    }

    // KKTC İlçe Tespiti
    let region = "Girne";
    if (lower.includes("iskele") || lower.includes("long beach") || lower.includes("bogaz")) {
      region = "İskele / Long Beach";
    } else if (lower.includes("girne") || lower.includes("alsancak") || lower.includes("bellapais") || lower.includes("catalkoy")) {
      region = "Girne / Alsancak";
    } else if (lower.includes("magusa") || lower.includes("gazimagusa") || lower.includes("famagusta")) {
      region = "Gazimağusa / Merkez";
    } else if (lower.includes("lefkosa") || lower.includes("nicosia")) {
      region = "Lefkoşa / Merkez";
    }

    // Gayrimenkul Tipi
    let propertyType = "Daire";
    if (lower.includes("villa") || lower.includes("müstakil") || lower.includes("вилла")) {
      propertyType = "Villa";
    } else if (lower.includes("dükkan") || lower.includes("ticari") || lower.includes("ofis") || lower.includes("shop")) {
      propertyType = "Ticari";
    } else if (lower.includes("arsa") || lower.includes("tarla") || lower.includes("land")) {
      propertyType = "Arsa";
    }

    // Kategori (Alıcı vs Satıcı)
    let category: "BUYER" | "SELLER" | "TENANT" = "BUYER";
    if (lower.includes("satmak") || lower.includes("satıyorum") || lower.includes("portföyüm") || lower.includes("selling")) {
      category = "SELLER";
    } else if (lower.includes("kiralık") || lower.includes("kiralamak") || lower.includes("rent")) {
      category = "TENANT";
    }

    // Bütçe Çıkarımı (GBP Odaklı)
    let budget = 120000;
    const numMatches = messageText.match(/(\d+[\d\.,]*)\s*(k|bin|thousand|sterlin|gbp|pound|euro|tl)?/i);
    if (numMatches) {
      const rawNum = parseFloat(numMatches[1].replace(/,/g, ""));
      if (numMatches[2]?.toLowerCase() === "k" || numMatches[2]?.toLowerCase() === "bin") {
        budget = rawNum * 1000;
      } else if (rawNum > 1000) {
        budget = rawNum;
      }
    }

    // Çok Dilli Otomatik Yanıt Taslağı
    let autoReply = "";
    if (language === "TR") {
      autoReply = `Merhaba Sayın ${senderName}, Trustline Real Estate'e hoş geldiniz! ${region} bölgesinde aradığınız ${propertyType} kriterlerine uygun harika portföylerimiz mevcuttur. Sorumlu danışmanımız en kısa sürede sizinle iletişime geçecektir.`;
    } else if (language === "EN") {
      autoReply = `Hello ${senderName}, thank you for contacting Trustline Real Estate Northern Cyprus! We have received your inquiry for ${propertyType} in ${region} (budget approx. £${budget.toLocaleString()}). Our senior advisor will share our tailored portfolio with you shortly.`;
    } else if (language === "RU") {
      autoReply = `Здравствуйте, ${senderName}! Спасибо за обращение в агентство недвижимости Trustline Real Estate Северный Кипр. Мы подобрали отличные варианты (${propertyType} в регионе ${region}) по вашему бюджету. Наш специалист свяжется с вами в ближайшее время.`;
    }

    return NextResponse.json({
      status: "success",
      extracted: {
        senderName,
        senderPhone,
        channel: "whatsapp",
        language,
        category,
        region,
        propertyType,
        budget,
        budgetCurrency: "GBP",
        rawMessage: messageText,
        autoReply,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Webhook işleme hatası" },
      { status: 500 }
    );
  }
}
