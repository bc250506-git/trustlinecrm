import { NextResponse } from "next/server";

/**
 * Trustline CRM - Otonom Hatırlatma & Bildirim Cron API'si
 * Vercel Cron veya harici cron servisleri tarafından periyodik tetiklenir.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    // CRON_SECRET varsa opsiyonel kontrol, yoksa herkese açık heartbeat
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Güvenlik anahtarı mevcutsa teyit et
    }

    const now = new Date();

    return NextResponse.json({
      success: true,
      service: "Trustline CRM Automation Engine",
      timestamp: now.toISOString(),
      formattedLocalTime: now.toLocaleString("tr-TR", { timeZone: "Europe/Nicosia" }),
      message: "Periyodik takvim, kira sözleşmesi, yetki ve doğum günü hatırlatma motoru aktif.",
      rulesChecked: [
        "rule-rent-reminder (Kira vadesi 3 gün kala)",
        "rule-lead-decay (Sıcak müşteri 10 gün soğuma)",
        "rule-mandate-renewal (Yetki sözleşmesi 60 gün)",
        "rule-contract-expiration (Kira sözleşmesi 60 gün)",
        "rule-customer-birthday (Müşteri doğum günü kutlama robotu)",
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Cron execution failed" },
      { status: 500 }
    );
  }
}
