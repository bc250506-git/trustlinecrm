"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  MessageSquareCode,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  XCircle,
  Link2,
  UserPlus,
  RefreshCw,
  Send,
  Bot,
  User,
  Check,
  Building,
  Coins,
  MessageCircle,
  Copy,
  ExternalLink,
  Zap,
  Globe,
  Radio,
} from "lucide-react";

interface AiIncomingLead {
  id: string;
  senderName: string;
  senderPhone: string;
  channel: "whatsapp" | "instagram";
  language: "TR" | "EN" | "RU";
  rawMessages: string[];
  extractedData: {
    category: "BUYER" | "SELLER" | "TENANT";
    region: string;
    propertyType: string;
    budget: number;
    budgetCurrency: "TRY" | "USD" | "EUR" | "GBP";
    summaryQuote: string;
    suggestedReply: string;
  };
  matchedProperties?: string[];
  status: "pending" | "approved" | "rejected";
}

export function InboxView() {
  const { isBroker, addCustomer, users, properties } = useStore();

  const [leads, setLeads] = useState<AiIncomingLead[]>([]);

  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [selectedAssignee, setSelectedAssignee] = useState(users[1]?.id || "");

  // AI Canlı Test Konsolu State
  const [testSenderName, setTestSenderName] = useState("Canan Kaya");
  const [testSenderPhone, setTestSenderPhone] = useState("+90 548 855 33 22");
  const [testMessage, setTestMessage] = useState(
    "Merhabalar, Gazimağusa City Center'da satılık ticari dükkan bakıyorum. Bütçem 220 bin sterlin. Kira getirisi yüksek mi?"
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [webhookUrlCopied, setWebhookUrlCopied] = useState(false);

  if (!isBroker) {
    return (
      <div className="sharp-card p-12 text-center border-l-4 border-l-amber-500 max-w-xl mx-auto my-12 space-y-4">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 tracking-wide uppercase font-mono">
          Erişim Yetkisi Kısıtlandı
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Gelen WhatsApp / Meta mesajlarını analiz eden AI Onay Masası
          yalnızca <strong className="text-emerald-600">Broker / Yönetici</strong>{" "}
          onayına tabidir.
        </p>
      </div>
    );
  }

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // Müşteriyi Onayla & CRM Havuzuna Ekle
  const handleApproveAsNewCustomer = (lead: AiIncomingLead) => {
    const assignee = users.find((u) => u.id === selectedAssignee) || users[0];

    addCustomer({
      fullName: lead.senderName,
      phone: lead.senderPhone,
      whatsapp: lead.senderPhone,
      source: "meta",
      category: lead.extractedData.category,
      temperature: "hot",
      isVip: lead.extractedData.budget >= 250000,
      region: lead.extractedData.region,
      propertyType: lead.extractedData.propertyType,
      budget: lead.extractedData.budget,
      budgetCurrency: lead.extractedData.budgetCurrency,
      notes: `[Meta WhatsApp AI Onayı]: ${lead.extractedData.summaryQuote}`,
      stage: "QUALIFIED",
      assignedToId: assignee.id,
      assignedToName: assignee.name,
      lastContactAt: new Date().toISOString(),
    });

    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: "approved" } : l))
    );
  };

  const handleRejectLead = (id: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: "rejected" } : l))
    );
  };

  // WhatsApp Mesajı Aç (wa.me)
  const handleOpenWhatsAppReply = (lead: AiIncomingLead) => {
    const text = encodeURIComponent(lead.extractedData.suggestedReply);
    const cleanPhone = lead.senderPhone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  // AI Simülasyonu Çalıştır
  const handleRunAiSimulation = () => {
    if (!testMessage.trim()) return;
    setIsSimulating(true);

    setTimeout(() => {
      const lower = testMessage.toLowerCase();
      let language: "TR" | "EN" | "RU" = "TR";
      if (/[а-яА-ЯёЁ]/.test(testMessage)) language = "RU";
      else if (lower.includes("looking for") || lower.includes("budget") || lower.includes("villa") || lower.includes("hello")) language = "EN";

      let region = "Girne / Alsancak";
      if (lower.includes("iskele") || lower.includes("long beach")) region = "İskele / Long Beach";
      else if (lower.includes("magusa") || lower.includes("gazimagusa")) region = "Gazimağusa / Merkez";
      else if (lower.includes("bellapais")) region = "Girne / Bellapais";

      let propertyType = "Daire";
      if (lower.includes("villa") || lower.includes("вилла")) propertyType = "Villa";
      else if (lower.includes("dükkan") || lower.includes("ticari") || lower.includes("shop")) propertyType = "Ticari";

      let budget = 120000;
      const numMatch = testMessage.match(/(\d+[\d\.,]*)\s*(k|bin|sterlin|gbp|pound)?/i);
      if (numMatch) {
        const val = parseFloat(numMatch[1].replace(/,/g, ""));
        budget = val < 1000 ? val * 1000 : val;
      }

      let reply = `Merhaba ${testSenderName}, Trustline Real Estate'e hoş geldiniz! ${region} bölgesindeki ${propertyType} portföyümüz için uzman danışmanımız hemen iletişime geçiyor.`;
      if (language === "EN") {
        reply = `Hello ${testSenderName}, welcome to Trustline Real Estate Northern Cyprus! We have matched excellent ${propertyType} options in ${region} tailored to your £${budget.toLocaleString()} budget.`;
      } else if (language === "RU") {
        reply = `Здравствуйте, ${testSenderName}! Trustline Real Estate Северный Кипр приветствует вас. Мы подобрали варианты (${propertyType} в ${region}) по вашему бюджету.`;
      }

      const newLead: AiIncomingLead = {
        id: `lead-sim-${Date.now()}`,
        senderName: testSenderName || "Canlı Müşteri",
        senderPhone: testSenderPhone || "+90 533 000 00 00",
        channel: "whatsapp",
        language,
        rawMessages: [testMessage],
        extractedData: {
          category: "BUYER",
          region,
          propertyType,
          budget,
          budgetCurrency: "GBP",
          summaryQuote: `"${testMessage.slice(0, 100)}..."`,
          suggestedReply: reply,
        },
        matchedProperties: ["Girne Alsancak 2+1 Lüks Penthouse"],
        status: "pending",
      };

      setLeads((prev) => [newLead, ...prev]);
      setSelectedLeadId(newLead.id);
      setIsSimulating(false);
    }, 700);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Üst Başlık & Webhook Durum Rozeti */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              META CLOUD API & WHATSAPP AI MOTORU (FAZ 4)
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Broker Onay & Karşı Karşılama Masası
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <MessageSquareCode className="w-5 h-5 text-[#00adb5]" />
            WhatsApp AI Otonom İletişim & Lead Doğrulama Masası
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Meta WhatsApp API üzerinden gelen Türkçe, İngilizce ve Rusça müşteri talepleri AI tarafından anında analiz edilir; broker onaylayarak CRM havuzuna dahil eder.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto font-mono text-xs">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5 shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            Meta Webhook: Dinlemede
          </span>
        </div>
      </div>

      {/* WEBHOOK URL BİLGİ & ENTEGRASYON ÇUBUĞU */}
      <div className="sharp-card p-3.5 bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-700">
          <Link2 className="w-4 h-4 text-[#00adb5] shrink-0" />
          <span>
            Webhook Uç Noktası: <code className="bg-white px-2 py-0.5 border border-slate-300 font-bold text-[#1d2566]">/api/webhooks/whatsapp</code>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Verify Token: <code className="bg-white px-2 py-0.5 border border-slate-300 text-slate-600">trustline_crm_meta_token_2026</code>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const fullUrl = `${window.location.origin}/api/webhooks/whatsapp`;
              navigator.clipboard.writeText(fullUrl);
              setWebhookUrlCopied(true);
              setTimeout(() => setWebhookUrlCopied(false), 3000);
            }}
            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-[#00adb5] text-slate-700 text-xs font-bold transition cursor-pointer flex items-center gap-1"
          >
            {webhookUrlCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{webhookUrlCopied ? "Kopyalandı" : "URL Kopyala"}</span>
          </button>
        </div>
      </div>

      {/* İKİ KOLONLU ANA PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* SOL KOLON: Gelen Mesajlar Listesi (5 Kolon) */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase text-slate-500 font-bold">
              Gelen Mesaj Akışı ({leads.filter((l) => l.status === "pending").length} Onay Bekliyor)
            </div>
            <span className="text-[10px] font-mono text-[#00adb5] font-bold">
              TR • EN • RU
            </span>
          </div>

          <div className="space-y-3">
            {leads.map((lead) => {
              const isSelected = lead.id === selectedLeadId;
              const langFlag = lead.language === "TR" ? "🇹🇷" : lead.language === "EN" ? "🇬🇧" : "🇷🇺";

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className={`sharp-card p-3.5 cursor-pointer transition border ${
                    isSelected
                      ? "border-[#00adb5] bg-cyan-50/40 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1d2566]">
                      <span>{langFlag}</span>
                      <span>{lead.senderName}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border font-semibold bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono mb-2">
                    {lead.senderPhone}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2 border border-slate-200">
                    &ldquo;{lead.rawMessages[0]}&rdquo;
                  </p>

                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-mono text-[#00adb5] flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3" /> {lead.extractedData.region} ({lead.extractedData.budget.toLocaleString("tr-TR")} GBP)
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 uppercase font-bold ${
                        lead.status === "approved"
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-300"
                          : lead.status === "rejected"
                          ? "text-rose-700 bg-rose-50 border border-rose-300"
                          : "text-amber-700 bg-amber-50 border border-amber-300"
                      }`}
                    >
                      {lead.status === "approved"
                        ? "Onaylandı"
                        : lead.status === "rejected"
                        ? "Reddedildi"
                        : "Beklemede"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI CANLI MESAJ SİMÜLATÖRÜ (YENİ MESAJ GÖNDER & TEST ET) */}
          <div className="sharp-card p-4 bg-white border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Zap className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-[#1d2566] font-mono uppercase">
                AI WhatsApp Simülasyon Konsolu
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-0.5">Ad Soyad</label>
                <input
                  type="text"
                  value={testSenderName}
                  onChange={(e) => setTestSenderName(e.target.value)}
                  className="w-full p-1.5 border border-slate-300 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-0.5">Telefon</label>
                <input
                  type="text"
                  value={testSenderPhone}
                  onChange={(e) => setTestSenderPhone(e.target.value)}
                  className="w-full p-1.5 border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-500 mb-0.5">Simüle Edilen WhatsApp Mesajı</label>
              <textarea
                rows={2}
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-2 border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setTestMessage("Girne Alsancak'ta 2+1 satılık daire arıyorum, bütçem 130 bin sterlin.")}
                  className="px-1.5 py-0.5 bg-slate-100 border text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  🇹🇷 TR
                </button>
                <button
                  type="button"
                  onClick={() => setTestMessage("Looking for a luxury villa in Bellapais with pool, budget 350k GBP.")}
                  className="px-1.5 py-0.5 bg-slate-100 border text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  🇬🇧 EN
                </button>
                <button
                  type="button"
                  onClick={() => setTestMessage("Ищу квартиру 1+1 в Искеле Лонг Бич, бюджет до 90.000 фунтов.")}
                  className="px-1.5 py-0.5 bg-slate-100 border text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  🇷🇺 RU
                </button>
              </div>

              <button
                type="button"
                disabled={isSimulating}
                onClick={handleRunAiSimulation}
                className="sharp-btn-primary px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Bot className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
                <span>{isSimulating ? "Analiz Ediliyor..." : "Mesajı İşle & Test Et"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: AI Ayrıştırma Özeti & Broker Karar Masası (7 Kolon) */}
        <div className="md:col-span-7">
          {selectedLead ? (
            <div className="sharp-card p-5 space-y-5 border-t-4 border-t-[#00adb5] bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#00adb5]" />
                  <span className="text-xs font-bold font-mono text-[#1d2566] uppercase">
                    Yapay Zekâ Ayrıştırma & Müşteri Analiz Raporu
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-bold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#00adb5]" />
                  Dil: {selectedLead.language === "TR" ? "Türkçe" : selectedLead.language === "EN" ? "İngilizce" : "Rusça"}
                </span>
              </div>

              {/* Ham Konuşma Akışı */}
              <div>
                <span className="text-[11px] font-mono text-slate-500 block mb-1 font-semibold">
                  MÜŞTERİDEN GELEN HAM WHATSAPP MESAJI:
                </span>
                <div className="bg-slate-50 p-3 border border-slate-200 space-y-1.5">
                  {selectedLead.rawMessages.map((m, i) => (
                    <div key={i} className="text-xs text-slate-700 font-sans">
                      • {m}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Çıkarsama Tablosu (KKTC Kriterleri) */}
              <div>
                <span className="text-[11px] font-mono text-slate-500 block mb-1 font-semibold">
                  ÇIKARILAN PORTFÖY VE BÜTÇE KRİTERLERİ:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 border border-slate-200 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">KATEGORİ:</span>
                    <span className="text-[#1d2566] font-bold">
                      {selectedLead.extractedData.category === "BUYER" ? "Alıcı Adayı" : "Satıcı"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">HEDEF BÖLGE:</span>
                    <span className="text-[#1d2566] font-bold">
                      {selectedLead.extractedData.region}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">MÜLK TİPİ:</span>
                    <span className="text-slate-700 font-bold">
                      {selectedLead.extractedData.propertyType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">BÜTÇE:</span>
                    <span className="text-emerald-700 font-bold">
                      {selectedLead.extractedData.budget.toLocaleString("tr-TR")} {selectedLead.extractedData.budgetCurrency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Eşleşen Portföyler Önerisi */}
              {selectedLead.matchedProperties && (
                <div>
                  <span className="text-[11px] font-mono text-slate-500 block mb-1 font-semibold flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#00adb5]" />
                    HAVUZDAN EŞLEŞEN PORTFÖYLER:
                  </span>
                  <div className="p-2.5 bg-cyan-50/40 border border-cyan-200 space-y-1">
                    {selectedLead.matchedProperties.map((pName, idx) => (
                      <div key={idx} className="text-xs text-[#1d2566] font-mono font-bold flex items-center gap-1.5">
                        <span className="text-emerald-600">✓</span>
                        <span>{pName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Tarafından Üretilen Otomatik WhatsApp Yanıt Taslağı */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-emerald-800 font-bold flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    AI TARAFINDAN HAZIRLANAN ÇOK DİLLİ YANIT TASLAĞI:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsAppReply(selectedLead)}
                    className="text-[10px] font-mono font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Web&apos;de Aç
                  </button>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800 leading-relaxed font-sans">
                  &ldquo;{selectedLead.extractedData.suggestedReply}&rdquo;
                </div>
              </div>

              {/* Broker Karar Masası Aksiyonları */}
              {selectedLead.status === "pending" ? (
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600 font-bold">Atanacak Sorumlu Danışman:</span>
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="p-1.5 border border-slate-300 text-xs font-semibold bg-white text-[#1d2566]"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsAppReply(selectedLead)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp&apos;tan Yanıtla</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectLead(selectedLead.id)}
                        className="px-3 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-mono font-bold cursor-pointer"
                      >
                        Yok Say (Atla)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveAsNewCustomer(selectedLead)}
                        className="sharp-btn-primary px-4 py-2 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Müşteri Havuzuna Ekle (Onayla)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Bu talep için Broker kararı uygulandı ({selectedLead.status === "approved" ? "Havuzuna Eklendi" : "Reddedildi"}).
                </div>
              )}
            </div>
          ) : (
            <div className="sharp-card p-12 text-center text-slate-400 font-mono text-xs">
              İncelemek için sol listeden bir mesaj seçin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
