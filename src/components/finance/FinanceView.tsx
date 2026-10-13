"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Deal, Currency } from "@/lib/types";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import {
  Calculator,
  ShieldAlert,
  Plus,
  Coins,
  ArrowUpRight,
  PieChart,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  X,
  Trash2,
  UserPlus,
  Building,
  Edit3,
  Users,
} from "lucide-react";

export function FinanceView() {
  const {
    deals,
    isBroker,
    addDeal,
    updateDeal,
    deleteDeal,
    canManageDeal,
    customers,
    properties,
    users,
    currentUser,
    addCustomer,
    addProperty,
  } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [financeTab, setFinanceTab] = useState<"matrix" | "analytics">("matrix");

  // Bildirim mesajı (Alt modaldan ekleme yapılınca ana modalda gösterilir)
  const [subNotice, setSubNotice] = useState<string | null>(null);

  // Sub-modal 1: Hızlı Müşteri Ekleme (Anlaşma modalı kapanmadan üst katmanda açılır)
  const [isAddCustomerSubModalOpen, setIsAddCustomerSubModalOpen] = useState(false);
  const [custSubName, setCustSubName] = useState("");
  const [custSubPhone, setCustSubPhone] = useState("");
  const [custSubWhatsapp, setCustSubWhatsapp] = useState("");
  const [custSubEmail, setCustSubEmail] = useState("");
  const [custSubDistrict, setCustSubDistrict] = useState(KKTC_DISTRICTS[0]);
  const [custSubSubRegion, setCustSubSubRegion] = useState(
    getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || ""
  );
  const [custSubIsShared, setCustSubIsShared] = useState(false);

  // Sub-modal 2: Hızlı Portföy Ekleme (Anlaşma modalı kapanmadan üst katmanda açılır)
  const [isAddPropertySubModalOpen, setIsAddPropertySubModalOpen] = useState(false);
  const [propSubTitle, setPropSubTitle] = useState("");
  const [propSubPropertyType, setPropSubPropertyType] = useState("Daire");
  const [propSubRooms, setPropSubRooms] = useState("2+1");
  const [propSubPrice, setPropSubPrice] = useState("");
  const [propSubCurrency, setPropSubCurrency] = useState<Currency>("GBP");
  const [propSubArea, setPropSubArea] = useState("85");
  const [propSubDistrict, setPropSubDistrict] = useState(KKTC_DISTRICTS[0]);
  const [propSubSubRegion, setPropSubSubRegion] = useState(
    getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || ""
  );
  const [propSubAddress, setPropSubAddress] = useState("");
  const [propSubIsShared, setPropSubIsShared] = useState(false);

  // Silme Onay Modalı State
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);

  // Düzenleme Modalı State
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editPropertyId, setEditPropertyId] = useState("");
  const [editCurrency, setEditCurrency] = useState<Currency>("GBP");
  const [editAgreedPrice, setEditAgreedPrice] = useState("");
  const [editCommissionRate, setEditCommissionRate] = useState<number>(5);
  const [editOrigin, setEditOrigin] = useState<"advisor" | "office">("advisor");
  const [editStage, setEditStage] = useState<"offer" | "won" | "lost">("offer");
  const [editPaymentDue, setEditPaymentDue] = useState("");

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCustomerId, setFormCustomerId] = useState(customers[0]?.id || "");
  const [formPropertyId, setFormPropertyId] = useState(properties[0]?.id || "");
  const [formCurrency, setFormCurrency] = useState<Currency>("GBP");
  const [formAgreedPrice, setFormAgreedPrice] = useState("");
  const [formCommissionRate, setFormCommissionRate] = useState<number>(5);
  const [formOrigin, setFormOrigin] = useState<"advisor" | "office">("advisor");
  const [formPaymentDue, setFormPaymentDue] = useState("");
  const [formAdvisorId, setFormAdvisorId] = useState<string>(currentUser.id);
  const [editAdvisorId, setEditAdvisorId] = useState<string>(currentUser.id);

  // Oturum açan kullanıcı değiştiğinde form varsayılan danışmanını güncelle
  useEffect(() => {
    setFormAdvisorId(currentUser.id);
  }, [currentUser]);

  // Body Scroll Lock for Modals
  useEffect(() => {
    if (
      isAddModalOpen ||
      editingDeal ||
      dealToDelete ||
      isAddCustomerSubModalOpen ||
      isAddPropertySubModalOpen
    ) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [
    isAddModalOpen,
    editingDeal,
    dealToDelete,
    isAddCustomerSubModalOpen,
    isAddPropertySubModalOpen,
  ]);

  // Danışman hesabı ise sadece kendi işlemlerini görür; Ofis / Broker hesabı ise tüm ofisin işlemlerini görür.
  const visibleDeals = isBroker ? deals : deals.filter((d) => d.createdById === currentUser.id);

  // Finans Özeti: Kuzey Kıbrıs emlak işlemlerinde ana para birimi GBP (£) dir.
  const gbpDeals = visibleDeals.filter((d) => d.currency === "GBP");
  const totalDealsCount = visibleDeals.length;
  const totalAgreedGbp = gbpDeals.reduce((sum, d) => sum + d.agreedPrice, 0);
  const totalCommissionGbp = gbpDeals.reduce((sum, d) => sum + d.commissionExpected, 0);
  const totalAdvisorGbp = gbpDeals.reduce((sum, d) => {
    const isVolkan = d.createdById === "usr-volkan";
    const rate = isVolkan ? 1.0 : (d.portfolioOrigin === "advisor" ? 0.6 : 0.5);
    return sum + Math.round(d.commissionExpected * rate);
  }, 0);
  const totalOfficeGbp = gbpDeals.reduce((sum, d) => {
    const isVolkan = d.createdById === "usr-volkan";
    const rate = isVolkan ? 0.0 : (d.portfolioOrigin === "advisor" ? 0.4 : 0.5);
    return sum + Math.round(d.commissionExpected * rate);
  }, 0);

  const agreedNum = Number(formAgreedPrice) || 0;
  const calculatedCommission = Math.round(agreedNum * (formCommissionRate / 100));
  const activeAdvisor = isBroker
    ? users.find((u) => u.id === formAdvisorId) || currentUser
    : currentUser;
  const isVolkanActive = activeAdvisor.id === "usr-volkan" || activeAdvisor.commissionSplitRatio === 1.0;
  const advisorRate = isVolkanActive ? 1.0 : (formOrigin === "advisor" ? 0.6 : 0.5);
  const officeRate = isVolkanActive ? 0.0 : (formOrigin === "advisor" ? 0.4 : 0.5);
  const calculatedAdvisorShare = Math.round(calculatedCommission * advisorRate);
  const calculatedOfficeShare = Math.round(calculatedCommission * officeRate);

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === formCustomerId);
    const prop = properties.find((p) => p.id === formPropertyId);

    // Ofisten ekleniyorsa seçilen danışman, danışman hesabından ise doğrudan oturum açan kullanıcı
    const selectedAdvisor = isBroker
      ? users.find((u) => u.id === formAdvisorId) || currentUser
      : currentUser;

    addDeal({
      title: formTitle,
      customerId: formCustomerId,
      customerName: cust?.fullName,
      propertyId: formPropertyId,
      propertyTitle: prop?.title,
      currency: formCurrency,
      stage: "won",
      askingPrice: prop?.price || 0,
      offeredPrice: agreedNum,
      agreedPrice: agreedNum,
      deposit: 0,
      commissionExpected: calculatedCommission,
      commissionReceived: calculatedCommission, // Buraya giriliyorsa tam tahsil edilmiştir
      portfolioOrigin: formOrigin,
      paymentDue: formPaymentDue,
      createdById: selectedAdvisor.id,
      createdByName: selectedAdvisor.name,
    });

    setIsAddModalOpen(false);
    setFormTitle("");
    setFormAgreedPrice("");
    setFormCommissionRate(5);
  };

  // Sub-Modal: Yeni Müşteri Ekle (Mevcut anlaşma modalı kapanmadan eklenir & seçilir)
  const handleCreateCustomerSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custSubName.trim()) {
      alert("Lütfen müşteri ad ve soyadını girin.");
      return;
    }
    const fullRegion = `${custSubDistrict} / ${custSubSubRegion}`;
    const newCust = addCustomer({
      fullName: custSubName,
      phone: custSubPhone,
      whatsapp: custSubWhatsapp || custSubPhone,
      email: custSubEmail,
      source: "manual",
      category: "BUYER",
      temperature: "hot",
      isVip: false,
      region: fullRegion,
      propertyType: "Daire",
      budget: Number(formAgreedPrice) || 0,
      budgetCurrency: formCurrency,
      notes: "Finans / Komisyon anlaşması üzerinden hızlı eklendi",
      stage: "OFFER",
      assignedToId: currentUser.id,
      assignedToName: currentUser.name,
      isShared: custSubIsShared,
    });

    setFormCustomerId(newCust.id);
    setIsAddCustomerSubModalOpen(false);
    setSubNotice(`✓ Yeni müşteri eklendi ve seçildi: ${newCust.fullName}`);
    setTimeout(() => setSubNotice(null), 5000);

    setCustSubName("");
    setCustSubPhone("");
    setCustSubWhatsapp("");
    setCustSubEmail("");
    setCustSubIsShared(false);
  };

  // Sub-Modal: Yeni Portföy Ekle (Mevcut anlaşma modalı kapanmadan eklenir & seçilir)
  const handleCreatePropertySub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propSubTitle.trim()) {
      alert("Lütfen portföy başlığını doldurun.");
      return;
    }
    const fullRegion = `${propSubDistrict} / ${propSubSubRegion}`;
    const priceNum = Number(propSubPrice) || 0;

    const newProp = addProperty({
      title: propSubTitle,
      region: fullRegion,
      propertyType: propSubPropertyType,
      listingType: "sale",
      price: priceNum,
      currency: propSubCurrency,
      area: Number(propSubArea) || 85,
      rooms: propSubRooms,
      status: "AVAILABLE",
      address: propSubAddress || fullRegion,
      ownerName: "Belirtilmedi",
      ownerPhone: "",
      assignedToId: currentUser.id,
      assignedToName: currentUser.name,
      isShared: propSubIsShared,
      photos: [
        {
          id: `p-${Date.now()}`,
          propertyId: "",
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&auto=format&fit=crop&q=80",
          shareable: true,
        },
      ],
    });

    setFormPropertyId(newProp.id);
    if (priceNum > 0) {
      setFormAgreedPrice(priceNum.toString());
    }
    setFormCurrency(newProp.currency);
    setIsAddPropertySubModalOpen(false);
    setSubNotice(`✓ Yeni portföy eklendi ve seçildi: ${newProp.title}`);
    setTimeout(() => setSubNotice(null), 5000);

    setPropSubTitle("");
    setPropSubPrice("");
    setPropSubAddress("");
    setPropSubIsShared(false);
  };

  // Düzenleme Handlers
  const handleOpenEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditTitle(deal.title);
    setEditCustomerId(deal.customerId);
    setEditPropertyId(deal.propertyId);
    setEditCurrency(deal.currency);
    setEditAgreedPrice(deal.agreedPrice.toString());
    const rate = deal.agreedPrice > 0 ? Math.round((deal.commissionExpected / deal.agreedPrice) * 100) : 5;
    setEditCommissionRate([1, 2, 3, 4, 5, 10, 15, 100].includes(rate) ? rate : 5);
    setEditOrigin(deal.portfolioOrigin || "advisor");
    setEditStage(deal.stage);
    setEditPaymentDue(deal.paymentDue || "");
    setEditAdvisorId(deal.createdById || currentUser.id);
  };

  const editAgreedNum = Number(editAgreedPrice) || 0;
  const editCalculatedCommission = Math.round(editAgreedNum * (editCommissionRate / 100));
  const editAdvisorRate = editOrigin === "advisor" ? 0.6 : 0.5;
  const editOfficeRate = editOrigin === "advisor" ? 0.4 : 0.5;
  const editCalculatedAdvisorShare = Math.round(editCalculatedCommission * editAdvisorRate);
  const editCalculatedOfficeShare = Math.round(editCalculatedCommission * editOfficeRate);

  const handleSaveEditDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeal) return;
    const agreedNumVal = Number(editAgreedPrice) || 0;
    const calcComm = Math.round(agreedNumVal * (editCommissionRate / 100));
    const cust = customers.find((c) => c.id === editCustomerId);
    const prop = properties.find((p) => p.id === editPropertyId);

    const selectedAdvisor = isBroker
      ? users.find((u) => u.id === editAdvisorId) || { id: editingDeal.createdById || currentUser.id, name: editingDeal.createdByName || currentUser.name }
      : { id: editingDeal.createdById || currentUser.id, name: editingDeal.createdByName || currentUser.name };

    updateDeal(editingDeal.id, {
      title: editTitle,
      customerId: editCustomerId,
      customerName: cust?.fullName || editingDeal.customerName,
      propertyId: editPropertyId,
      propertyTitle: prop?.title || editingDeal.propertyTitle,
      currency: editCurrency,
      agreedPrice: agreedNumVal,
      offeredPrice: agreedNumVal,
      deposit: 0,
      commissionExpected: calcComm,
      commissionReceived: calcComm, // Tam tahsil edilmiş kabul edilir
      portfolioOrigin: editOrigin,
      stage: editStage,
      paymentDue: editPaymentDue,
      createdById: selectedAdvisor.id,
      createdByName: selectedAdvisor.name,
    });

    setEditingDeal(null);
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              KOMİSYON & GELİR MOTORU
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Finans & Hakediş Defteri
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#00adb5]" />
            Finans & Komisyon Paylaşım Matrisi
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Satış ve kiralama işlemlerindeki net ciro, hakediş ve komisyon paylaşım defteri.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-300">
            <button
              type="button"
              onClick={() => setFinanceTab("matrix")}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                financeTab === "matrix"
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-[#00adb5]" />
              Paylaşım Matrisi
            </button>
            <button
              type="button"
              onClick={() => setFinanceTab("analytics")}
              className={`px-3 py-1.5 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                financeTab === "analytics"
                  ? "bg-[#1d2566] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              Trendler & Grafikler (v5.0)
            </button>
          </div>

          <button
            onClick={() => {
              setFormAdvisorId(currentUser.id);
              setIsAddModalOpen(true);
            }}
            className="sharp-btn-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer self-start md:self-auto shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Finans / Komisyon Kaydı</span>
          </button>
        </div>
      </div>

      {financeTab === "analytics" ? (
        <AnalyticsView />
      ) : (
        <>

      {/* Finansal Özet Kartları (Genel GBP Ağırlıklı Piyasa Göstergeleri) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sharp-card p-4 border-t-3 border-t-[#00adb5]">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              Toplam Anlaşma
            </span>
            <TrendingUp className="w-4 h-4 text-[#00adb5]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1d2566] mt-2">
            {totalDealsCount} <span className="text-xs font-normal text-slate-500">İşlem</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            {gbpDeals.length} GBP Portföy Satışı
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-[#1d2566]">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              Toplam Satış Hacmi (GBP)
            </span>
            <Building className="w-4 h-4 text-[#1d2566]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1d2566] mt-2">
            {totalAgreedGbp.toLocaleString("tr-TR")} <span className="text-xs font-normal text-slate-500">GBP</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 mt-1">
            Anlaşılan toplam mülk bedeli
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-emerald-600">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-emerald-800 px-2 py-0.5 bg-emerald-50 border border-emerald-200 uppercase">
              Toplam Komisyon (GBP)
            </span>
            <Calculator className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-2">
            {totalCommissionGbp.toLocaleString("tr-TR")} <span className="text-xs font-normal text-emerald-600">GBP</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-600 mt-1">
            Tam tahsil edilmiş toplam gelir
          </div>
        </div>

        <div className="sharp-card p-4 border-t-3 border-t-[#00adb5]">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-[#1d2566] px-2 py-0.5 bg-slate-100 border border-slate-200 uppercase">
              Danışman / Ofis Hakedişi
            </span>
            <PieChart className="w-4 h-4 text-[#00adb5]" />
          </div>
          <div className="space-y-1 mt-1 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Danışman Payı:</span>
              <span className="text-[#00adb5] font-bold">
                {totalAdvisorGbp.toLocaleString("tr-TR")} GBP
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Ofis Payı:</span>
              <span className="text-[#1d2566] font-bold">
                {totalOfficeGbp.toLocaleString("tr-TR")} GBP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Komisyon Paylaşım Kuralı Bilgi Çubuğu */}
      <div className="sharp-card p-3.5 bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <Percent className="w-4 h-4 text-[#00adb5] shrink-0" />
          <span className="text-slate-700">
            <strong className="text-[#1d2566]">Danışman Kendi Portföyü:</strong> %60 Danışman Payı / %40 Ofis
            Payı
          </span>
        </div>
        <div className="hidden md:block text-slate-300">|</div>
        <div className="flex items-center gap-3">
          <Percent className="w-4 h-4 text-[#1d2566] shrink-0" />
          <span className="text-slate-700">
            <strong className="text-[#1d2566]">Ofis Portföyü:</strong> %50 Danışman Payı / %50 Ofis Payı
          </span>
        </div>
      </div>

      {/* Finansal İşlemler Tablosu */}
      <div className="sharp-card overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Mülk</th>
              <th className="py-3 px-4">Müşteri</th>
              <th className="py-3 px-4">Portföy Menşei</th>
              <th className="py-3 px-4">Anlaşılan Bedel</th>
              <th className="py-3 px-4">Toplam Komisyon</th>
              <th className="py-3 px-4">Danışman Payı</th>
              <th className="py-3 px-4">Ofis Payı</th>
              <th className="py-3 px-4 text-center">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleDeals.map((d) => {
              const isVolkanDeal = d.createdById === "usr-volkan";
              const advisorRate = isVolkanDeal ? 1.0 : (d.portfolioOrigin === "advisor" ? 0.6 : 0.5);
              const officeRate = isVolkanDeal ? 0.0 : (d.portfolioOrigin === "advisor" ? 0.4 : 0.5);

              const advisorShare = Math.round(d.commissionExpected * advisorRate);
              const officeShare = Math.round(d.commissionExpected * officeRate);

              return (
                <tr key={d.id} className="hover:bg-slate-50/80 transition">
                  {/* 1. Mülk */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#1d2566]">
                      {d.propertyTitle || d.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1.5 mt-0.5">
                      {isBroker && d.createdByName && (
                        <span className="text-[#00adb5] font-semibold font-mono">
                          Danışman: {d.createdByName}
                        </span>
                      )}
                      {d.propertyTitle && d.propertyTitle !== d.title && (
                        <span>• {d.title}</span>
                      )}
                    </div>
                  </td>

                  {/* 2. Müşteri */}
                  <td className="py-3 px-4 text-slate-700 font-semibold">
                    {d.customerName}
                  </td>

                  {/* 3. Portföy Menşei */}
                  <td className="py-3 px-4">
                    {isVolkanDeal ? (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 border font-bold bg-amber-50 text-amber-800 border-amber-300">
                        Ortak (%100 Kendisinin)
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                          d.portfolioOrigin === "advisor"
                            ? "bg-[#00adb5]/10 text-[#00adb5] border-[#00adb5]/30"
                            : "bg-[#1d2566]/10 text-[#1d2566] border-[#1d2566]/20"
                        }`}
                      >
                        {d.portfolioOrigin === "advisor"
                          ? "Danışman (%60 / %40)"
                          : "Ofis (%50 / %50)"}
                      </span>
                    )}
                  </td>

                  {/* 4. Anlaşılan Bedel */}
                  <td className="py-3 px-4 font-mono font-bold text-[#1d2566]">
                    {d.agreedPrice.toLocaleString("tr-TR")} {d.currency}
                  </td>

                  {/* 5. Toplam Komisyon */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {d.commissionExpected.toLocaleString("tr-TR")} {d.currency}
                  </td>

                  {/* 6. Danışman Payı */}
                  <td className="py-3 px-4 font-mono font-bold text-[#00adb5]">
                    {advisorShare.toLocaleString("tr-TR")} {d.currency}
                  </td>

                  {/* 7. Ofis Payı */}
                  <td className="py-3 px-4 font-mono font-bold text-[#1d2566]">
                    {officeShare.toLocaleString("tr-TR")} {d.currency}
                  </td>

                  {/* 8. İşlem Aksiyonları (Düzenle & Sil) */}
                  <td className="py-3 px-4 text-center">
                    <ActionMenu
                      onEdit={() => handleOpenEditDeal(d)}
                      onDelete={() => setDealToDelete(d)}
                      canEdit={canManageDeal(d)}
                      canDelete={canManageDeal(d)}
                    />
                  </td>
                </tr>
              );
            })}
            {visibleDeals.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-mono text-xs">
                  Henüz kayıtlı bir komisyon / anlaşma bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}

      {/* Yeni Finans / Komisyon Kaydı Modalı */}
      {isAddModalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="sharp-card w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#00adb5]" />
                  <h2 className="text-sm font-bold text-[#1d2566]">
                    Yeni Satış / Komisyon Anlaşması Ekle
                  </h2>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDeal} className="p-5 space-y-4 text-xs">
                {/* Alt Modallardan Bildirim */}
                {subNotice && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{subNotice}</span>
                  </div>
                )}

                {/* İşlem Başlığı & Danışman Seçimi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                      İşlem Başlığı *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Örn: Bebek Dubleksi Satış Anlaşması"
                      className="sharp-input w-full p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                      İşlemi Yapan Danışman {isBroker ? "*" : ""}
                    </label>
                    {isBroker ? (
                      <select
                        value={formAdvisorId}
                        onChange={(e) => setFormAdvisorId(e.target.value)}
                        className="sharp-input w-full p-2 bg-white font-medium text-slate-800"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} {u.role === "ADMIN" ? "(Ofis / Broker)" : "(Danışman)"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="sharp-input w-full p-2 bg-slate-50 font-medium text-slate-700 flex items-center justify-between">
                        <span className="font-bold text-[#1d2566]">{currentUser.name}</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-[#00adb5]/10 text-[#00adb5] border border-[#00adb5]/30 font-bold">
                          Kendi Hesabınız
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-mono text-[11px] font-semibold">
                        İlgili Müşteri *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustSubDistrict(KKTC_DISTRICTS[0]);
                          setCustSubSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
                          setIsAddCustomerSubModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                        title="Mevcut anlaşma modalı kapanmadan hızlıca yeni bir müşteri ekleyin"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Yeni Müşteri Ekle</span>
                      </button>
                    </div>
                    <select
                      value={formCustomerId}
                      onChange={(e) => setFormCustomerId(e.target.value)}
                      className="sharp-input w-full p-2 bg-white"
                    >
                      <option value="">-- Müşteri havuzundan seçin --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.phone || "Tel yok"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-600 font-mono text-[11px] font-semibold">
                        İlgili Portföy *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPropSubDistrict(KKTC_DISTRICTS[0]);
                          setPropSubSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
                          setIsAddPropertySubModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                        title="Mevcut anlaşma modalı kapanmadan hızlıca yeni bir portföy ekleyin"
                      >
                        <Building className="w-3 h-3" />
                        <span>+ Yeni Portföy Ekle</span>
                      </button>
                    </div>
                    <select
                      value={formPropertyId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setFormPropertyId(pid);
                        const prop = properties.find((p) => p.id === pid);
                        if (prop) {
                          if (!formAgreedPrice || formAgreedPrice === "0") {
                            setFormAgreedPrice(prop.price.toString());
                          }
                          setFormCurrency(prop.currency);
                        }
                      }}
                      className="sharp-input w-full p-2 bg-white"
                    >
                      <option value="">-- Portföy havuzundan seçin --</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.price.toLocaleString("tr-TR")} {p.currency})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2'li Sıra: Para Birimi, Anlaşılan Bedel */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                      Para Birimi
                    </label>
                    <select
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value as any)}
                      className="sharp-input w-full p-2 bg-white font-mono font-bold text-[#1d2566]"
                    >
                      <option value="GBP">GBP (£ - Sterlin)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="USD">USD ($ - Dolar)</option>
                      <option value="TRY">TRY (₺ - TL)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                      Anlaşılan Bedel *
                    </label>
                    <input
                      type="number"
                      required
                      value={formAgreedPrice}
                      onChange={(e) => setFormAgreedPrice(e.target.value)}
                      placeholder="Örn: 150000"
                      className="sharp-input w-full p-2 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Komisyon Menşei ve Otomatik Komisyon Oranı */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                      Portföy Menşei (Komisyon Kuralı) *
                    </label>
                    <select
                      value={formOrigin}
                      onChange={(e) => setFormOrigin(e.target.value as any)}
                      className="sharp-input w-full p-2 bg-white font-medium"
                    >
                      <option value="advisor">
                        Danışman Kendi Portföyü (%60 Danışman / %40 Ofis)
                      </option>
                      <option value="office">
                        Ofis Portföyü (%50 Danışman / %50 Ofis)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                      Komisyon Oranı (%)
                    </label>
                    <select
                      value={formCommissionRate}
                      onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                      className="sharp-input w-full p-2 bg-white font-mono font-bold"
                    >
                      <option value={1}>%1</option>
                      <option value={2}>%2</option>
                      <option value={3}>%3</option>
                      <option value={4}>%4</option>
                      <option value={5}>%5</option>
                      <option value={10}>%10</option>
                      <option value={15}>%15</option>
                      <option value={100}>%100 (Kiralık)</option>
                    </select>
                  </div>
                </div>

                {/* Sistem Tarafından Otomatik Hesaplanan Komisyon Bilgi Kartı */}
                <div className="bg-[#1d2566]/5 border border-[#1d2566]/15 p-3 rounded-none space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#1d2566] flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#00adb5]" />
                      Sistem Otomatik Hesaplanan Komisyon:
                    </span>
                    <span className="font-bold text-sm text-[#1d2566]">
                      {calculatedCommission.toLocaleString("tr-TR")} {formCurrency}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1d2566]/10 text-[11px] font-mono">
                    <div className="text-[#00adb5] font-bold">
                      Danışman Payı ({formOrigin === "advisor" ? "%60" : "%50"}):{" "}
                      {calculatedAdvisorShare.toLocaleString("tr-TR")} {formCurrency}
                    </div>
                    <div className="text-[#1d2566] font-bold text-right">
                      Ofis Payı ({formOrigin === "advisor" ? "%40" : "%50"}):{" "}
                      {calculatedOfficeShare.toLocaleString("tr-TR")} {formCurrency}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer"
                  >
                    İşlemi Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* SUB-MODAL 1: YENİ MÜŞTERİ EKLE (Z-[60] - ÜST KATMAN) */}
          {isAddCustomerSubModalOpen && (
            <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="sharp-card w-full max-w-md bg-white border-2 border-[#00adb5] shadow-2xl my-8">
                <div className="p-4 border-b border-slate-200 bg-cyan-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#00adb5]" />
                    <div>
                      <h3 className="text-xs font-bold text-[#1d2566]">
                        Yeni Müşteri Ekle
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Müşteri havuzuna eklenip anında bu komisyon anlaşmasına seçilecektir
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddCustomerSubModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreateCustomerSub} className="p-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                      Müşteri Adı Soyadı *
                    </label>
                    <input
                      type="text"
                      required
                      value={custSubName}
                      onChange={(e) => setCustSubName(e.target.value)}
                      placeholder="Örn: Kerem Aksoy"
                      className="sharp-input w-full p-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                        Telefon Numarası *
                      </label>
                      <input
                        type="tel"
                        required
                        value={custSubPhone}
                        onChange={(e) => setCustSubPhone(e.target.value)}
                        placeholder="+90 533 888 12 34"
                        className="sharp-input w-full p-2 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                        WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={custSubWhatsapp}
                        onChange={(e) => setCustSubWhatsapp(e.target.value)}
                        placeholder="+90 533 888 12 34"
                        className="sharp-input w-full p-2 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                      E-posta (Opsiyonel)
                    </label>
                    <input
                      type="email"
                      value={custSubEmail}
                      onChange={(e) => setCustSubEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      className="sharp-input w-full p-2 font-mono"
                    />
                  </div>

                  {/* KKTC İlçe & Bölge */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 border border-slate-200">
                    <div>
                      <label className="block text-slate-600 font-mono text-[10px] mb-1 font-bold">
                        KKTC İlçesi
                      </label>
                      <select
                        value={custSubDistrict}
                        onChange={(e) => {
                          const newDist = e.target.value;
                          setCustSubDistrict(newDist);
                          const regions = getRegionsByDistrict(newDist);
                          setCustSubSubRegion(regions[0] || "");
                        }}
                        className="sharp-input w-full p-1.5 bg-white font-mono text-[11px]"
                      >
                        {KKTC_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-mono text-[10px] mb-1 font-bold">
                        Bölge / Mahalle
                      </label>
                      <select
                        value={custSubSubRegion}
                        onChange={(e) => setCustSubSubRegion(e.target.value)}
                        className="sharp-input w-full p-1.5 bg-white font-mono text-[11px]"
                      >
                        {getRegionsByDistrict(custSubDistrict).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 text-xs">
                      <input
                        type="checkbox"
                        checked={custSubIsShared}
                        onChange={(e) => setCustSubIsShared(e.target.checked)}
                        className="w-4 h-4 text-[#00adb5] accent-[#00adb5] rounded border-slate-300 cursor-pointer"
                      />
                      <span>Diğer danışmanlara paylaş</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddCustomerSubModalOpen(false)}
                        className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer font-mono"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer font-mono"
                      >
                        Kaydet ve Seç
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SUB-MODAL 2: YENİ PORTFÖY EKLE (Z-[60] - ÜST KATMAN) */}
          {isAddPropertySubModalOpen && (
            <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="sharp-card w-full max-w-lg bg-white border-2 border-[#00adb5] shadow-2xl my-8">
                <div className="p-4 border-b border-slate-200 bg-cyan-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#00adb5]" />
                    <div>
                      <h3 className="text-xs font-bold text-[#1d2566]">
                        Yeni Portföy Ekle
                      </h3>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Portföy havuzuna eklenip anında bu komisyon anlaşmasına seçilecektir
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddPropertySubModalOpen(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleCreatePropertySub} className="p-5 space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                      Portföy Başlığı *
                    </label>
                    <input
                      type="text"
                      required
                      value={propSubTitle}
                      onChange={(e) => setPropSubTitle(e.target.value)}
                      placeholder="Örn: Girne Merkez 2+1 Lüks Daire"
                      className="sharp-input w-full p-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                        Portföy Türü
                      </label>
                      <select
                        value={propSubPropertyType}
                        onChange={(e) => setPropSubPropertyType(e.target.value)}
                        className="sharp-input w-full p-2 bg-white"
                      >
                        <option value="Daire">Daire</option>
                        <option value="Villa">Villa</option>
                        <option value="Penthouse">Penthouse</option>
                        <option value="Müstakil Ev">Müstakil Ev</option>
                        <option value="Dükkan / Ticari">Dükkan / Ticari</option>
                        <option value="Ofis">Ofis</option>
                        <option value="Arsa">Arsa</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                        Oda Sayısı
                      </label>
                      <select
                        value={propSubRooms}
                        onChange={(e) => setPropSubRooms(e.target.value)}
                        className="sharp-input w-full p-2 bg-white"
                      >
                        <option value="Stüdyo (1+0)">Stüdyo (1+0)</option>
                        <option value="1+1">1+1</option>
                        <option value="2+1">2+1</option>
                        <option value="3+1">3+1</option>
                        <option value="4+1">4+1</option>
                        <option value="5+2">5+2</option>
                        <option value="Villa">Villa</option>
                      </select>
                    </div>
                  </div>

                  {/* Fiyat & Para Birimi & Metrekare */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                        Fiyat *
                      </label>
                      <input
                        type="number"
                        required
                        value={propSubPrice}
                        onChange={(e) => setPropSubPrice(e.target.value)}
                        placeholder="Örn: 250000"
                        className="sharp-input w-full p-2 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                        Para Birimi
                      </label>
                      <select
                        value={propSubCurrency}
                        onChange={(e) => setPropSubCurrency(e.target.value as Currency)}
                        className="sharp-input w-full p-2 bg-white font-mono font-bold"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="TRY">TRY (₺)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                        Net m²
                      </label>
                      <input
                        type="number"
                        value={propSubArea}
                        onChange={(e) => setPropSubArea(e.target.value)}
                        placeholder="85"
                        className="sharp-input w-full p-2 font-mono"
                      />
                    </div>
                  </div>

                  {/* KKTC İlçe & Bölge */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 border border-slate-200">
                    <div>
                      <label className="block text-slate-600 font-mono text-[10px] mb-1 font-bold">
                        KKTC İlçesi
                      </label>
                      <select
                        value={propSubDistrict}
                        onChange={(e) => {
                          const newDist = e.target.value;
                          setPropSubDistrict(newDist);
                          const regions = getRegionsByDistrict(newDist);
                          setPropSubSubRegion(regions[0] || "");
                        }}
                        className="sharp-input w-full p-1.5 bg-white font-mono text-[11px]"
                      >
                        {KKTC_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-mono text-[10px] mb-1 font-bold">
                        Bölge / Mahalle
                      </label>
                      <select
                        value={propSubSubRegion}
                        onChange={(e) => setPropSubSubRegion(e.target.value)}
                        className="sharp-input w-full p-1.5 bg-white font-mono text-[11px]"
                      >
                        {getRegionsByDistrict(propSubDistrict).map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Adres */}
                  <div>
                    <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                      Açık Adres / Konum
                    </label>
                    <input
                      type="text"
                      value={propSubAddress}
                      onChange={(e) => setPropSubAddress(e.target.value)}
                      placeholder="Örn: Alsancak Cad. No: 12"
                      className="sharp-input w-full p-2"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 text-xs">
                      <input
                        type="checkbox"
                        checked={propSubIsShared}
                        onChange={(e) => setPropSubIsShared(e.target.checked)}
                        className="w-4 h-4 text-[#00adb5] accent-[#00adb5] rounded border-slate-300 cursor-pointer"
                      />
                      <span>Diğer danışmanlara paylaş</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddPropertySubModalOpen(false)}
                        className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer font-mono"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer font-mono"
                      >
                        Portföyü Kaydet ve Seç
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* DÜZENLEME MODALI */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#1d2566]">
                  Satış / Komisyon Anlaşmasını Düzenle
                </h2>
              </div>
              <button
                onClick={() => setEditingDeal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDeal} className="p-5 space-y-4 text-xs">
              {/* İşlem Başlığı & Danışman Seçimi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    İşlem Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="sharp-input w-full p-2"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                    İşlemi Yapan Danışman {isBroker ? "*" : ""}
                  </label>
                  {isBroker ? (
                    <select
                      value={editAdvisorId}
                      onChange={(e) => setEditAdvisorId(e.target.value)}
                      className="sharp-input w-full p-2 bg-white font-medium text-slate-800"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} {u.role === "ADMIN" ? "(Ofis / Broker)" : "(Danışman)"}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="sharp-input w-full p-2 bg-slate-50 font-medium text-slate-700 flex items-center justify-between">
                      <span className="font-bold text-[#1d2566]">
                        {editingDeal?.createdByName || currentUser.name}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-200 text-slate-700 border border-slate-300 font-bold">
                        Danışman
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    İlgili Müşteri
                  </label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => setEditCustomerId(e.target.value)}
                    className="sharp-input w-full p-2 bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.phone || "Tel yok"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    İlgili Portföy
                  </label>
                  <select
                    value={editPropertyId}
                    onChange={(e) => setEditPropertyId(e.target.value)}
                    className="sharp-input w-full p-2 bg-white"
                  >
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.price.toLocaleString("tr-TR")} {p.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Para Birimi
                  </label>
                  <select
                    value={editCurrency}
                    onChange={(e) => setEditCurrency(e.target.value as any)}
                    className="sharp-input w-full p-2 bg-white font-mono font-bold text-[#1d2566]"
                  >
                    <option value="GBP">GBP (£ - Sterlin)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="USD">USD ($ - Dolar)</option>
                    <option value="TRY">TRY (₺ - TL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Anlaşılan Bedel *
                  </label>
                  <input
                    type="number"
                    required
                    value={editAgreedPrice}
                    onChange={(e) => setEditAgreedPrice(e.target.value)}
                    className="sharp-input w-full p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Portföy Menşei (Komisyon Kuralı) *
                  </label>
                  <select
                    value={editOrigin}
                    onChange={(e) => setEditOrigin(e.target.value as any)}
                    className="sharp-input w-full p-2 bg-white font-medium"
                  >
                    <option value="advisor">
                      Danışman Kendi Portföyü (%60 Danışman / %40 Ofis)
                    </option>
                    <option value="office">
                      Ofis Portföyü (%50 Danışman / %50 Ofis)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                    Komisyon Oranı (%)
                  </label>
                  <select
                    value={editCommissionRate}
                    onChange={(e) => setEditCommissionRate(Number(e.target.value))}
                    className="sharp-input w-full p-2 bg-white font-mono font-bold"
                  >
                    <option value={1}>%1</option>
                    <option value={2}>%2</option>
                    <option value={3}>%3</option>
                    <option value={4}>%4</option>
                    <option value={5}>%5</option>
                    <option value={10}>%10</option>
                    <option value={15}>%15</option>
                    <option value={100}>%100 (Kiralık)</option>
                  </select>
                </div>
              </div>

              {/* Süreç Aşaması */}
              <div>
                <label className="block text-slate-600 font-mono text-[11px] mb-1 font-semibold">
                  Aşama Durumu
                </label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as any)}
                  className="sharp-input w-full p-2 bg-white font-medium"
                >
                  <option value="offer">Teklif / Sözleşme Aşamasında</option>
                  <option value="won">Başarıyla Kapatıldı (Kazanıldı)</option>
                  <option value="lost">İptal / Kaybedildi</option>
                </select>
              </div>

              {/* Sistem Tarafından Otomatik Hesaplanan Komisyon Bilgi Kartı */}
              <div className="bg-[#1d2566]/5 border border-[#1d2566]/15 p-3 rounded-none space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#1d2566] flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#00adb5]" />
                    Sistem Otomatik Hesaplanan Komisyon:
                  </span>
                  <span className="font-bold text-sm text-[#1d2566]">
                    {editCalculatedCommission.toLocaleString("tr-TR")} {editCurrency}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1d2566]/10 text-[11px] font-mono">
                  <div className="text-[#00adb5] font-bold">
                    Danışman Payı ({editOrigin === "advisor" ? "%60" : "%50"}):{" "}
                    {editCalculatedAdvisorShare.toLocaleString("tr-TR")} {editCurrency}
                  </div>
                  <div className="text-[#1d2566] font-bold text-right">
                    Ofis Payı ({editOrigin === "advisor" ? "%40" : "%50"}):{" "}
                    {editCalculatedOfficeShare.toLocaleString("tr-TR")} {editCurrency}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDeal(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-4 py-1.5 font-bold text-white shadow-2xs cursor-pointer"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      <DeleteConfirmModal
        isOpen={!!dealToDelete}
        title="Finans / Komisyon Kaydını Sil"
        itemName={dealToDelete ? `${dealToDelete.title} (${dealToDelete.customerName || "Müşteri"})` : undefined}
        message="Bu finans ve komisyon anlaşması kaydı kalıcı olarak silinecektir. Yapılan komisyon hesaplamaları ve ciro kayıtları güncellenecektir."
        onConfirm={() => {
          if (dealToDelete) {
            deleteDeal(dealToDelete.id);
            setDealToDelete(null);
          }
        }}
        onCancel={() => setDealToDelete(null)}
      />
    </div>
  );
}

