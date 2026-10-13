"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { RentalContract, Currency } from "@/lib/types";
import { KKTC_DISTRICTS, getRegionsByDistrict } from "@/lib/kktcLocations";
import {
  KeyRound,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  Download,
  Plus,
  Building,
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  X,
  FileSpreadsheet,
  Trash2,
  Edit3,
  MessageCircle,
} from "lucide-react";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";

export function RentalsView() {
  const {
    rentals,
    isBroker,
    currentUser,
    users,
    properties,
    customers,
    toggleRentalPayment,
    uploadRentalReceipt,
    addRentalContract,
    updateRentalContract,
    deleteRentalContract,
    canManageRental,
    addProperty,
    addCustomer,
  } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<{
    rentalId: string;
    month: number;
    monthName: string;
    contract: RentalContract;
  } | null>(null);

  const [simulatedFileName, setSimulatedFileName] = useState("");

  // Bildirim mesajı (Alt modaldan ekleme yapılınca ana modalda gösterilir)
  const [subNotice, setSubNotice] = useState<string | null>(null);

  // Sub-modal 1: Hızlı Portföy Ekleme
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

  // Sub-modal 2: Müşteri Ekleme (Kiracı veya Mülk Sahibi)
  const [isAddCustomerSubModalOpen, setIsAddCustomerSubModalOpen] = useState(false);
  const [customerSubModalType, setCustomerSubModalType] = useState<"tenant" | "landlord">("tenant");
  const [custSubName, setCustSubName] = useState("");
  const [custSubPhone, setCustSubPhone] = useState("");
  const [custSubWhatsapp, setCustSubWhatsapp] = useState("");
  const [custSubEmail, setCustSubEmail] = useState("");
  const [custSubDistrict, setCustSubDistrict] = useState(KKTC_DISTRICTS[0]);
  const [custSubSubRegion, setCustSubSubRegion] = useState(
    getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || ""
  );
  const [custSubIsShared, setCustSubIsShared] = useState(false);

  // Yeni Kira Kayıt Form State
  const [formData, setFormData] = useState({
    selectedPropertyId: "",
    propertyTitle: "",
    region: "",
    selectedTenantId: "",
    tenantName: "",
    tenantPhone: "",
    selectedLandlordId: "",
    landlordName: "",
    landlordPhone: "",
    monthlyRent: "",
    currency: "GBP" as Currency,
    dueDay: 5,
    contractStart: "2026-01-01",
    contractEnd: "2026-12-31",
    depositAmount: "",
    assignedToId: currentUser.id,
    notes: "",
  });

  const months = [
    { num: 1, name: "Oca" },
    { num: 2, name: "Şub" },
    { num: 3, name: "Mar" },
    { num: 4, name: "Nis" },
    { num: 5, name: "May" },
    { num: 6, name: "Haz" },
    { num: 7, name: "Tem" },
    { num: 8, name: "Ağu" },
    { num: 9, name: "Eyl" },
    { num: 10, name: "Eki" },
    { num: 11, name: "Kas" },
    { num: 12, name: "Ara" },
  ];

  // Silme Onay Modalı State
  const [rentalToDelete, setRentalToDelete] = useState<RentalContract | null>(null);

  // Kira Sözleşmesi Düzenleme Modalı State
  const [editingRental, setEditingRental] = useState<RentalContract | null>(null);
  const [editRentalForm, setEditRentalForm] = useState({
    monthlyRent: "",
    currency: "GBP" as Currency,
    dueDay: 5,
    tenantName: "",
    tenantPhone: "",
    landlordName: "",
    landlordPhone: "",
    contractStart: "",
    contractEnd: "",
    depositAmount: "",
    notes: "",
  });

  const handleOpenEditRental = (r: RentalContract) => {
    setEditingRental(r);
    setEditRentalForm({
      monthlyRent: String(r.monthlyRent),
      currency: r.currency,
      dueDay: r.dueDay,
      tenantName: r.tenantName,
      tenantPhone: r.tenantPhone || "",
      landlordName: r.landlordName,
      landlordPhone: r.landlordPhone || "",
      contractStart: r.contractStart,
      contractEnd: r.contractEnd,
      depositAmount: String(r.depositAmount || 0),
      notes: r.notes || "",
    });
  };

  const handleSaveRentalEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRental) return;
    const newRent = Number(editRentalForm.monthlyRent) || editingRental.monthlyRent;
    const newCurrency = editRentalForm.currency;

    const updatedPayments = editingRental.payments.map((p) => {
      if (p.status === "unpaid") {
        return { ...p, amount: newRent, currency: newCurrency };
      }
      return p;
    });

    updateRentalContract(editingRental.id, {
      monthlyRent: newRent,
      currency: newCurrency,
      dueDay: Number(editRentalForm.dueDay) || editingRental.dueDay,
      tenantName: editRentalForm.tenantName,
      tenantPhone: editRentalForm.tenantPhone,
      landlordName: editRentalForm.landlordName,
      landlordPhone: editRentalForm.landlordPhone,
      contractStart: editRentalForm.contractStart,
      contractEnd: editRentalForm.contractEnd,
      depositAmount: Number(editRentalForm.depositAmount) || 0,
      notes: editRentalForm.notes,
      payments: updatedPayments,
    });
    setEditingRental(null);
  };

  // Body Scroll Lock for Modals
  useEffect(() => {
    if (
      isAddModalOpen ||
      activeReceiptModal ||
      isAddPropertySubModalOpen ||
      isAddCustomerSubModalOpen ||
      rentalToDelete ||
      editingRental
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
    activeReceiptModal,
    isAddPropertySubModalOpen,
    isAddCustomerSubModalOpen,
    rentalToDelete,
    editingRental,
  ]);

  // Vade Günü Hesaplayıcı (28, 29, 30, 31 ay sonuna kaydırma)
  const calculateDueDateForMonth = (dueDay: number, monthIndex: number) => {
    const daysInMonths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const maxDay = daysInMonths[monthIndex - 1];
    const adjustedDay = Math.min(dueDay, maxDay);
    return `${adjustedDay} ${months[monthIndex - 1].name}`;
  };

  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Mülk seçildiğinde alanları doldur
  const handleSelectProperty = (propId: string) => {
    if (!propId) {
      setFormData((prev) => ({
        ...prev,
        selectedPropertyId: "",
      }));
      return;
    }
    const prop = properties.find((p) => p.id === propId);
    if (prop) {
      setFormData((prev) => ({
        ...prev,
        selectedPropertyId: prop.id,
        propertyTitle: prop.title,
        region: prop.region || prev.region,
        landlordName: prop.ownerName || prev.landlordName,
        landlordPhone: prop.ownerPhone || prev.landlordPhone,
        monthlyRent:
          prop.listingType === "rent" ? prop.price.toString() : prev.monthlyRent,
        currency: prop.currency || prev.currency,
        depositAmount:
          prop.listingType === "rent"
            ? (prop.price * 2).toString()
            : prev.depositAmount,
      }));
    }
  };

  // Kiracı seçildiğinde alanları doldur
  const handleSelectTenant = (customerId: string) => {
    if (!customerId) {
      setFormData((prev) => ({
        ...prev,
        selectedTenantId: "",
      }));
      return;
    }
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        selectedTenantId: cust.id,
        tenantName: cust.fullName,
        tenantPhone: cust.phone || prev.tenantPhone,
      }));
    }
  };

  // Ev Sahibi seçildiğinde alanları doldur
  const handleSelectLandlord = (customerId: string) => {
    if (!customerId) {
      setFormData((prev) => ({
        ...prev,
        selectedLandlordId: "",
      }));
      return;
    }
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        selectedLandlordId: cust.id,
        landlordName: cust.fullName,
        landlordPhone: cust.phone || prev.landlordPhone,
      }));
    }
  };

  // Kira girildiğinde otomatik depozito önerisi (2 kira)
  const handleRentChange = (val: string) => {
    const num = Number(val);
    setFormData((prev) => ({
      ...prev,
      monthlyRent: val,
      depositAmount: !isNaN(num) && num > 0 ? (num * 2).toString() : prev.depositAmount,
    }));
  };

  const handleCreateRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.propertyTitle.trim() || !formData.tenantName.trim()) {
      alert("Lütfen portföy başlığı ve kiracı adını doldurun.");
      return;
    }
    const rentAmount = Number(formData.monthlyRent);
    if (isNaN(rentAmount) || rentAmount <= 0) {
      alert("Lütfen geçerli bir aylık kira tutarı girin.");
      return;
    }

    const assignedUser = users.find(
      (u) => u.id === (isBroker ? formData.assignedToId : currentUser.id)
    );

    addRentalContract({
      propertyId: formData.selectedPropertyId || undefined,
      propertyTitle: formData.propertyTitle,
      region: formData.region || "KKTC",
      tenantCustomerId: formData.selectedTenantId || undefined,
      tenantName: formData.tenantName,
      tenantPhone: formData.tenantPhone || "-",
      landlordCustomerId: formData.selectedLandlordId || undefined,
      landlordName: formData.landlordName || "Mülk Sahibi",
      landlordPhone: formData.landlordPhone || "-",
      monthlyRent: rentAmount,
      currency: formData.currency,
      dueDay: Number(formData.dueDay) || 5,
      contractStart: formData.contractStart || "2026-01-01",
      contractEnd: formData.contractEnd || "2026-12-31",
      depositAmount: Number(formData.depositAmount) || rentAmount * 2,
      active: true,
      notes: formData.notes,
      assignedToId: isBroker ? formData.assignedToId : currentUser.id,
      assignedToName: assignedUser ? assignedUser.name : currentUser.name,
    });

    setIsAddModalOpen(false);
  };

  // Sub-Modal: Yeni Kiralık Portföy Ekle (Mevcut rental modalı kapanmadan eklenir & seçilir)
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
      listingType: "rent",
      price: priceNum,
      currency: propSubCurrency,
      area: Number(propSubArea) || 85,
      rooms: propSubRooms,
      status: "AVAILABLE",
      address: propSubAddress || fullRegion,
      ownerCustomerId: formData.selectedLandlordId || undefined,
      ownerName: formData.landlordName || "Mülk Sahibi",
      ownerPhone: formData.landlordPhone || "",
      assignedToId: currentUser.id,
      assignedToName: currentUser.name,
      isShared: propSubIsShared,
      photos: [
        {
          id: `p-${Date.now()}`,
          propertyId: "",
          url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&auto=format&fit=crop&q=80",
          shareable: true,
        },
      ],
    });

    // Otomatik olarak form verilerine aktar
    setFormData((prev) => ({
      ...prev,
      selectedPropertyId: newProp.id,
      propertyTitle: newProp.title,
      region: newProp.region,
      monthlyRent: priceNum > 0 ? priceNum.toString() : prev.monthlyRent,
      currency: newProp.currency,
      depositAmount: priceNum > 0 ? (priceNum * 2).toString() : prev.depositAmount,
      landlordName: newProp.ownerName || prev.landlordName,
      landlordPhone: newProp.ownerPhone || prev.landlordPhone,
    }));

    setIsAddPropertySubModalOpen(false);
    setSubNotice(`✓ Yeni portföy oluşturuldu ve sözleşmeye seçildi: ${newProp.title}`);
    setTimeout(() => setSubNotice(null), 5000);

    // Formu temizle
    setPropSubTitle("");
    setPropSubPrice("");
    setPropSubAddress("");
    setPropSubIsShared(false);
  };

  // Sub-Modal: Yeni Kiracı veya Ev Sahibi Ekle (Mevcut rental modalı kapanmadan eklenir & seçilir)
  const handleCreateCustomerSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custSubName.trim()) {
      alert("Lütfen ad ve soyad alanını doldurun.");
      return;
    }
    const fullRegion = `${custSubDistrict} / ${custSubSubRegion}`;
    const isTenant = customerSubModalType === "tenant";

    const newCust = addCustomer({
      fullName: custSubName,
      phone: custSubPhone,
      whatsapp: custSubWhatsapp || custSubPhone,
      email: custSubEmail,
      source: "manual",
      category: isTenant ? "TENANT" : "SELLER",
      temperature: "hot",
      isVip: false,
      region: fullRegion,
      propertyType: "Daire",
      budget: Number(formData.monthlyRent) || 0,
      budgetCurrency: formData.currency,
      notes: `${isTenant ? "Kiracı" : "Ev Sahibi / Mülk Sahibi"} - Kira sözleşmesi üzerinden eklendi`,
      stage: isTenant ? "QUALIFIED" : "LISTING_SENT",
      assignedToId: currentUser.id,
      assignedToName: currentUser.name,
      isShared: custSubIsShared,
    });

    if (isTenant) {
      setFormData((prev) => ({
        ...prev,
        selectedTenantId: newCust.id,
        tenantName: newCust.fullName,
        tenantPhone: newCust.phone || prev.tenantPhone,
      }));
      setSubNotice(`✓ Yeni kiracı müşteri havuzuna eklendi ve seçildi: ${newCust.fullName}`);
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedLandlordId: newCust.id,
        landlordName: newCust.fullName,
        landlordPhone: newCust.phone || prev.landlordPhone,
      }));
      setSubNotice(`✓ Yeni ev sahibi müşteri havuzuna eklendi ve seçildi: ${newCust.fullName}`);
    }

    setIsAddCustomerSubModalOpen(false);
    setTimeout(() => setSubNotice(null), 5000);

    // Formu temizle
    setCustSubName("");
    setCustSubPhone("");
    setCustSubWhatsapp("");
    setCustSubEmail("");
    setCustSubIsShared(false);
  };

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Başlığı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-emerald-700 font-bold tracking-wider uppercase">
              YILLIK FİNANSAL YÖNETİM
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              {isBroker
                ? `Ofis Geneli (${rentals.length} Sözleşme)`
                : `Kira Takip Defteri (${rentals.length} Sözleşme)`}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            Kira Takip Matrisi ve Dekont Defteri
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            12 aylık kira tahsilat tablosu, ödeme durumları ve banka dekontları yönetim defteri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300">
              Ödendi
            </span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-300">
              Kısmi Tahsilat
            </span>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-300">
              Gecikmiş / Vadesi Gelmiş
            </span>
          </div>

          <button
            onClick={() => {
              setFormData({
                selectedPropertyId: "",
                propertyTitle: "",
                region: "",
                selectedTenantId: "",
                tenantName: "",
                tenantPhone: "",
                selectedLandlordId: "",
                landlordName: "",
                landlordPhone: "",
                monthlyRent: "",
                currency: "GBP",
                dueDay: 5,
                contractStart: "2026-01-01",
                contractEnd: "2026-12-31",
                depositAmount: "",
                assignedToId: currentUser.id,
                notes: "",
              });
              setIsAddModalOpen(true);
            }}
            className="sharp-btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer shadow-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Kira Sözleşmesi Ekle</span>
          </button>
        </div>
      </div>

      {/* 12 Aylık Yıllık Matris Tablosu VEYA Boş Durum */}
      {rentals.length === 0 ? (
        <div className="sharp-card p-12 text-center border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
          <KeyRound className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-[#1d2566]">
            Henüz Kayıtlı Kira Sözleşmesi Bulunmuyor
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isBroker
              ? "Ofis portföyünde henüz aktif bir kira sözleşmesi kaydı girilmedi. Yeni bir kira takibi başlatmak için yukarıdaki butonu kullanın."
              : "Sorumlu olduğunuz aktif bir kira sözleşmesi bulunmuyor. Yeni bir sözleşme eklemek için yukarıdaki '+ Yeni Kira Sözleşmesi Ekle' butonuna tıklayın."}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="sharp-btn-primary px-4 py-2 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" /> İlk Kira Sözleşmesini Ekle
          </button>
        </div>
      ) : (
        <div className="sharp-card overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4 min-w-[240px]">Mülk & Kiracı / Vade</th>
                <th className="py-3 px-3 text-right">Aylık Kira</th>
                {months.map((m) => (
                  <th key={m.num} className="py-3 px-2 text-center min-w-[70px]">
                    {m.name}
                  </th>
                ))}
                <th className="py-3 px-2 text-center min-w-[50px]">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentals.map((r) => {
                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    {/* Mülk & Kiracı Bilgisi */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1d2566] flex items-center gap-2 flex-wrap">
                        <span>{r.propertyTitle}</span>
                        {isBroker && r.assignedToName && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#1d2566]/5 border border-[#1d2566]/20 text-[#1d2566] font-semibold">
                            {r.assignedToName}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[#00adb5] font-semibold">
                          {r.tenantName}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">
                          Vade: Her ayın {r.dueDay}. günü
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          Ev Sahibi: {r.landlordName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const text = encodeURIComponent(
                              `Merhaba ${r.tenantName}, ${r.propertyTitle} mülkünüz için her ayın ${r.dueDay}. günü vadeli ${r.monthlyRent} ${r.currency} kira ödemeniz yaklaşmıştır. Ofis Banka IBAN: GB29NWBK60161331926819 (Trustline Real Estate). Dekontunuzu WhatsApp üzerinden iletebilirsiniz. Teşekkür ederiz.`
                            );
                            const phone = r.tenantPhone.replace(/[^0-9]/g, "");
                            window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
                          }}
                          className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                          title="Kiracıya tek tıkla resmi WhatsApp kira hatırlatması gönder"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp Vade Hatırlat</span>
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">({r.tenantPhone})</span>
                      </div>
                    </td>


                    {/* Aylık Kira Tutarı */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#1d2566] whitespace-nowrap">
                      {r.monthlyRent.toLocaleString("tr-TR")} {r.currency}
                    </td>

                    {/* 12 Ay Hücreleri */}
                    {months.map((m) => {
                      const payment = r.payments.find((p) => p.month === m.num);
                      const isPaid = payment?.status === "paid";
                      const isPartial = payment?.status === "partial";
                      const isOverdue = payment?.status === "overdue";

                      return (
                        <td key={m.num} className="py-2 px-1 text-center">
                          <div
                            className={`p-1 border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                              isPaid
                                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                                : isPartial
                                ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                                : isOverdue
                                ? "bg-rose-50 border-rose-300 text-rose-800 font-semibold"
                                : "bg-slate-50 border-slate-200 text-slate-400"
                            }`}
                          >
                            <div className="text-[10px] font-mono leading-none">
                              {calculateDueDateForMonth(r.dueDay, m.num)}
                            </div>

                            {/* Ödeme Durumu & Buton */}
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="checkbox"
                                checked={isPaid}
                                onChange={(e) => {
                                  toggleRentalPayment(
                                    r.id,
                                    m.num,
                                    e.target.checked
                                  );
                                }}
                                title={
                                  isPaid
                                    ? "Ödendi olarak işaretli"
                                    : "Ödendi olarak işaretle"
                                }
                                className="w-3.5 h-3.5 accent-emerald-600 rounded-none cursor-pointer"
                              />

                              {/* Dekont Butonu */}
                              <button
                                onClick={() =>
                                  setActiveReceiptModal({
                                    rentalId: r.id,
                                    month: m.num,
                                    monthName: m.name,
                                    contract: r,
                                  })
                                }
                                title={
                                  payment?.receiptName
                                    ? `Dekont: ${payment.receiptName}`
                                    : "Dekont Yükle"
                                }
                                className={`p-0.5 cursor-pointer hover:text-[#1d2566] transition ${
                                  payment?.receiptName
                                    ? "text-[#00adb5]"
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                              >
                                <FileText className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Kısmi Tutar Gösterimi */}
                            {isPartial && (
                              <div className="text-[9px] font-mono text-amber-700 leading-none font-bold">
                                {payment?.paidAmount?.toLocaleString("tr-TR")} /{" "}
                                {r.monthlyRent.toLocaleString("tr-TR")}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* İşlem Aksiyonları (Düzenle & Sil) */}
                    <td className="py-2 px-2 text-center">
                      <ActionMenu
                        onEdit={() => handleOpenEditRental(r)}
                        onDelete={() => setRentalToDelete(r)}
                        canEdit={canManageRental(r)}
                        canDelete={canManageRental(r)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* YENİ KİRA SÖZLEŞMESİ EKLE MODAL */}
      {isAddModalOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="sharp-card w-full max-w-2xl bg-white border border-slate-300 shadow-2xl my-8">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-sm font-bold text-[#1d2566]">
                  Yeni Kira Takip Kaydı & Sözleşmesi
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRental} className="p-6 space-y-4 text-xs">
              {/* Alt Modallardan Başarılı Kayıt Bildirimi */}
              {subNotice && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{subNotice}</span>
                </div>
              )}

              {/* 1. MÜLK BİLGİLERİ */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="text-[11px] font-mono uppercase font-bold text-[#1d2566] flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>1. Kiralık Portföy Seçimi veya Girişi</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Kayıtlı Portföyden Seç (Otomatik Bilgi Çeker):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPropSubDistrict(KKTC_DISTRICTS[0]);
                        setPropSubSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
                        setIsAddPropertySubModalOpen(true);
                      }}
                      className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                      title="Mevcut modal kapanmadan hızlıca yeni bir portföy ekleyin"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Yeni Portföy Ekle</span>
                    </button>
                  </div>
                  <select
                    value={formData.selectedPropertyId}
                    onChange={(e) => handleSelectProperty(e.target.value)}
                    className="sharp-input w-full p-2 text-xs bg-white"
                  >
                    <option value="">
                      -- Mevcut portföylerden seçin veya aşağıya elle yazın --
                    </option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.region || "KKTC"}) - {p.price} {p.currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Portföy / Daire Başlığı *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Girne Alsancak 2+1 Lüks Daire"
                      value={formData.propertyTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, propertyTitle: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bölge / Konum
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Girne / Alsancak"
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. TARAFLAR (KİRACI & EV SAHİBİ) */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="text-[11px] font-mono uppercase font-bold text-[#1d2566] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>2. Sözleşme Tarafları (Kiracı ve Mülk Sahibi)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kiracı */}
                  <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-800">
                        Kiracı (Müşteri) *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSubModalType("tenant");
                          setCustSubName("");
                          setCustSubPhone("");
                          setCustSubWhatsapp("");
                          setCustSubEmail("");
                          setCustSubDistrict(KKTC_DISTRICTS[0]);
                          setCustSubSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
                          setIsAddCustomerSubModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                        title="Mevcut modal kapanmadan hızlıca yeni bir kiracı müşteri ekleyin"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Yeni Kiracı Ekle</span>
                      </button>
                    </div>
                    <select
                      value={formData.selectedTenantId}
                      onChange={(e) => handleSelectTenant(e.target.value)}
                      className="sharp-input w-full p-1.5 text-xs bg-white"
                    >
                      <option value="">-- Müşteri havuzundan seç --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.phone || "Tel yok"})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      placeholder="Kiracı Ad Soyad *"
                      value={formData.tenantName}
                      onChange={(e) =>
                        setFormData({ ...formData, tenantName: e.target.value })
                      }
                      className="sharp-input w-full p-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Kiracı Telefon Numarası"
                      value={formData.tenantPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, tenantPhone: e.target.value })
                      }
                      className="sharp-input w-full p-1.5 text-xs font-mono"
                    />
                  </div>

                  {/* Ev Sahibi */}
                  <div className="p-3 bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-800">
                        Mülk Sahibi (Ev Sahibi)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerSubModalType("landlord");
                          setCustSubName("");
                          setCustSubPhone("");
                          setCustSubWhatsapp("");
                          setCustSubEmail("");
                          setCustSubDistrict(KKTC_DISTRICTS[0]);
                          setCustSubSubRegion(getRegionsByDistrict(KKTC_DISTRICTS[0])[0] || "");
                          setIsAddCustomerSubModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-[#00adb5] hover:bg-[#00939a] text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition"
                        title="Mevcut modal kapanmadan hızlıca yeni bir ev sahibi müşteri ekleyin"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Yeni Ev Sahibi Ekle</span>
                      </button>
                    </div>
                    <select
                      value={formData.selectedLandlordId}
                      onChange={(e) => handleSelectLandlord(e.target.value)}
                      className="sharp-input w-full p-1.5 text-xs bg-white"
                    >
                      <option value="">-- Müşteri havuzundan seç --</option>
                      {customers
                        .filter((c) => c.category === "SELLER")
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullName} ({c.phone || "Tel yok"})
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Mülk Sahibi Ad Soyad"
                      value={formData.landlordName}
                      onChange={(e) =>
                        setFormData({ ...formData, landlordName: e.target.value })
                      }
                      className="sharp-input w-full p-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Mülk Sahibi Telefon"
                      value={formData.landlordPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, landlordPhone: e.target.value })
                      }
                      className="sharp-input w-full p-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. FİNANSAL DETAYLAR */}
              <div className="space-y-3 pb-3 border-b border-slate-100">
                <div className="text-[11px] font-mono uppercase font-bold text-[#1d2566] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>3. Kira Tutarı ve Ödeme Koşulları</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Aylık Kira *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="Örn: 850"
                      value={formData.monthlyRent}
                      onChange={(e) => handleRentChange(e.target.value)}
                      className="sharp-input w-full p-2 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Para Birimi
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currency: e.target.value as Currency,
                        })
                      }
                      className="sharp-input w-full p-2 text-xs font-mono bg-white font-bold"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="TRY">TRY (₺)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Vade Günü (1-31)
                    </label>
                    <select
                      value={formData.dueDay}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dueDay: Number(e.target.value),
                        })
                      }
                      className="sharp-input w-full p-2 text-xs font-mono bg-white font-bold"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Her ayın {d}. günü
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Depozito Tutarı
                    </label>
                    <input
                      type="number"
                      placeholder="Örn: 1700"
                      value={formData.depositAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, depositAmount: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. TARİHLER VE SORUMLU DANIŞMAN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sözleşme Başlangıç
                  </label>
                  <input
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) =>
                      setFormData({ ...formData, contractStart: e.target.value })
                    }
                    className="sharp-input w-full p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sözleşme Bitiş (Alarm)
                  </label>
                  <input
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, contractEnd: e.target.value })
                    }
                    className="sharp-input w-full p-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Sorumlu Danışman
                  </label>
                  {isBroker ? (
                    <select
                      value={formData.assignedToId}
                      onChange={(e) =>
                        setFormData({ ...formData, assignedToId: e.target.value })
                      }
                      className="sharp-input w-full p-2 text-xs bg-white font-medium"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.role === "ADMIN" ? "Ofis" : "Danışman"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                      {currentUser.name} (Şahsi Portföy)
                    </div>
                  )}
                </div>
              </div>

              {/* 5. NOTLAR */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Özel Notlar (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Banka hesap bilgisi, tahliye taahhütnamesi veya ek protokol notları..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="sharp-input w-full p-2 text-xs"
                />
              </div>

              {/* BUTONLAR */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="sharp-btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sözleşmeyi Kaydet & 12 Ayı Oluştur</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SUB-MODAL 1: YENİ PORTFÖY EKLE (ÜST KATMAN - Z-[60]) */}
        {isAddPropertySubModalOpen && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="sharp-card w-full max-w-lg bg-white border-2 border-[#00adb5] shadow-2xl my-8">
              <div className="p-4 border-b border-slate-200 bg-cyan-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#00adb5]" />
                  <div>
                    <h3 className="text-xs font-bold text-[#1d2566]">
                      Yeni Kiralık Portföy Ekle
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Portföy havuzuna eklenip anında bu kira sözleşmesine seçilecektir
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
                    Portföy / İlan Başlığı *
                  </label>
                  <input
                    type="text"
                    required
                    value={propSubTitle}
                    onChange={(e) => setPropSubTitle(e.target.value)}
                    placeholder="Örn: Girne Merkez 2+1 Lüks Eşyalı Daire"
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
                      Aylık Kira Fiyatı *
                    </label>
                    <input
                      type="number"
                      required
                      value={propSubPrice}
                      onChange={(e) => setPropSubPrice(e.target.value)}
                      placeholder="Örn: 850"
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

                {/* Adres veya Konum */}
                <div>
                  <label className="block text-slate-700 font-mono text-[11px] mb-1 font-bold">
                    Açık Adres / Konum Tarifi
                  </label>
                  <input
                    type="text"
                    value={propSubAddress}
                    onChange={(e) => setPropSubAddress(e.target.value)}
                    placeholder="Örn: Ecevit Cad. No: 14 Daire: 3"
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

        {/* SUB-MODAL 2: YENİ KİRACI VEYA EV SAHİBİ EKLE (ÜST KATMAN - Z-[60]) */}
        {isAddCustomerSubModalOpen && (
          <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="sharp-card w-full max-w-md bg-white border-2 border-[#00adb5] shadow-2xl my-8">
              <div className="p-4 border-b border-slate-200 bg-cyan-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#00adb5]" />
                  <div>
                    <h3 className="text-xs font-bold text-[#1d2566]">
                      {customerSubModalType === "tenant"
                        ? "Yeni Kiracı Müşteri Ekle"
                        : "Yeni Mülk Sahibi (Ev Sahibi) Ekle"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {customerSubModalType === "tenant"
                        ? "Müşteri havuzuna 'Kiracı' olarak kaydedilir ve forma atanır"
                        : "Müşteri havuzuna 'Satıcı/Ev Sahibi' olarak kaydedilir ve forma atanır"}
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
                    {customerSubModalType === "tenant"
                      ? "Kiracı Adı Soyadı *"
                      : "Mülk Sahibi Adı Soyadı *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={custSubName}
                    onChange={(e) => setCustSubName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
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
                      Kaydet ve Forma Ekle
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )}

      {/* DEKONT DEFTERİ MODALI */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-md bg-white border border-slate-300 shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00adb5]" />
                <h3 className="text-xs font-bold text-[#1d2566]">
                  Kira Dekont Defteri — {activeReceiptModal.monthName} 2026
                </h3>
              </div>
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 border border-slate-200 text-[11px] font-mono space-y-1">
                <div>Mülk: {activeReceiptModal.contract.propertyTitle}</div>
                <div>Kiracı: {activeReceiptModal.contract.tenantName}</div>
                <div className="text-[#1d2566] font-bold text-sm">
                  Kira Tutarı:{" "}
                  {activeReceiptModal.contract.monthlyRent.toLocaleString("tr-TR")}{" "}
                  {activeReceiptModal.contract.currency}
                </div>
              </div>

              {/* Yüklü Dekont Durumu */}
              {activeReceiptModal.contract.payments.find(
                (p) => p.month === activeReceiptModal.month
              )?.receiptName ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-mono text-emerald-950 font-bold">
                        {
                          activeReceiptModal.contract.payments.find(
                            (p) => p.month === activeReceiptModal.month
                          )?.receiptName
                        }
                      </div>
                      <div className="text-[10px] text-emerald-700 font-mono">
                        Supabase Storage CDN Üzerinde Kayıtlı
                      </div>
                    </div>
                  </div>
                  <button className="px-2 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 font-mono text-[10px] font-bold">
                    <Download className="w-3 h-3" /> İndir
                  </button>
                </div>
              ) : (
                <div className="text-slate-500 text-center py-2 font-mono text-[11px]">
                  Bu aya ait henüz bir banka dekontu yüklenmemiş.
                </div>
              )}

              {/* Simüle Dekont Yükleme */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="block text-[11px] font-mono text-slate-600 font-semibold">
                  Yeni Dekont Dosyası Seç (PDF, JPG, PNG):
                </label>
                <input
                  type="text"
                  placeholder="Örn: Garanti_Banka_Dekont_Ekim_2026.pdf"
                  value={simulatedFileName}
                  onChange={(e) => setSimulatedFileName(e.target.value)}
                  className="sharp-input w-full p-2 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setActiveReceiptModal(null)}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-slate-900"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    if (simulatedFileName) {
                      uploadRentalReceipt(
                        activeReceiptModal.rentalId,
                        activeReceiptModal.month,
                        simulatedFileName
                      );
                      setSimulatedFileName("");
                      setActiveReceiptModal(null);
                    }
                  }}
                  className="sharp-btn-primary px-3.5 py-1.5 flex items-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3 h-3" /> Dekontu Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KİRA SÖZLEŞMESİ DÜZENLEME MODALI */}
      {editingRental && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="sharp-card w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-300 bg-white shadow-2xl">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#00adb5]" />
                <h2 className="text-sm font-bold text-[#1d2566]">
                  Kira Sözleşmesini Düzenle
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingRental(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRentalEdit} className="p-5 space-y-4 text-xs">
              {/* Portföy Bilgisi */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 text-slate-700">
                <span className="text-[10px] text-slate-500 font-mono block">İlgili Portföy:</span>
                <span className="font-bold text-[#1d2566] text-xs">{editingRental.propertyTitle}</span>
              </div>

              {/* Kiracı Bilgileri */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Kiracı Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRentalForm.tenantName}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, tenantName: e.target.value }))
                    }
                    className="sharp-input w-full p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Kiracı Telefonu
                  </label>
                  <input
                    type="text"
                    value={editRentalForm.tenantPhone}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, tenantPhone: e.target.value }))
                    }
                    className="sharp-input w-full p-2"
                  />
                </div>
              </div>

              {/* Mülk Sahibi Bilgileri */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Mülk Sahibi Adı Soyadı *
                  </label>
                  <input
                    type="text"
                    required
                    value={editRentalForm.landlordName}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, landlordName: e.target.value }))
                    }
                    className="sharp-input w-full p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Mülk Sahibi Telefonu
                  </label>
                  <input
                    type="text"
                    value={editRentalForm.landlordPhone}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, landlordPhone: e.target.value }))
                    }
                    className="sharp-input w-full p-2"
                  />
                </div>
              </div>

              {/* Kira Tutarı, Para Birimi ve Vade Günü */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Aylık Kira Tutarı *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editRentalForm.monthlyRent}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, monthlyRent: e.target.value }))
                    }
                    className="sharp-input w-full p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Para Birimi
                  </label>
                  <select
                    value={editRentalForm.currency}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({
                        ...prev,
                        currency: e.target.value as Currency,
                      }))
                    }
                    className="sharp-input w-full p-2 font-mono bg-white"
                  >
                    <option value="GBP">GBP (£ - Sterlin)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="USD">USD ($ - Dolar)</option>
                    <option value="TRY">TRY (₺ - TL)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Vade Günü (1-31) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="31"
                    value={editRentalForm.dueDay}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({
                        ...prev,
                        dueDay: Number(e.target.value) || 5,
                      }))
                    }
                    className="sharp-input w-full p-2 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Sözleşme Başlangıç / Bitiş ve Depozito */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="date"
                    value={editRentalForm.contractStart}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, contractStart: e.target.value }))
                    }
                    className="sharp-input w-full p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={editRentalForm.contractEnd}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, contractEnd: e.target.value }))
                    }
                    className="sharp-input w-full p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                    Depozito Tutarı
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editRentalForm.depositAmount}
                    onChange={(e) =>
                      setEditRentalForm((prev) => ({ ...prev, depositAmount: e.target.value }))
                    }
                    className="sharp-input w-full p-2 font-mono"
                  />
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label className="block text-[11px] font-mono text-slate-600 mb-1 font-bold">
                  Sözleşme Notları
                </label>
                <textarea
                  rows={2}
                  value={editRentalForm.notes}
                  onChange={(e) =>
                    setEditRentalForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="sharp-input w-full p-2"
                  placeholder="Ek sözleşme veya tahsilat notları..."
                />
              </div>

              {/* Butonlar */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRental(null)}
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
        isOpen={!!rentalToDelete}
        title="Kira Sözleşmesini Sil"
        itemName={
          rentalToDelete
            ? `"${rentalToDelete.propertyTitle}" (${rentalToDelete.tenantName})`
            : undefined
        }
        message="Bu kira sözleşmesi ve sözleşmeye ait tüm 12 aylık kira tahsilat/makbuz geçmişi sistemden kalıcı olarak silinecektir."
        onConfirm={() => {
          if (rentalToDelete) {
            deleteRentalContract(rentalToDelete.id);
            setRentalToDelete(null);
          }
        }}
        onCancel={() => setRentalToDelete(null)}
      />
    </div>
  );
}
