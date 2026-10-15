"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Settings,
  Lock,
  User,
  Shield,
  Bell,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Save,
  Smartphone,
  Key,
  ShieldCheck,
} from "lucide-react";

type SettingsTab = "security" | "profile" | "notifications";

export function SettingsView() {
  const {
    currentUser,
    isBroker,
    logout,
    updateUserPassword,
    updateUserProfile,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>("security");

  // Şifre Değiştirme State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profil Form State
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || "+90 548 888 00 00");
  const [profileTitle, setProfileTitle] = useState(currentUser.title || "");
  const [profileSaved, setProfileSaved] = useState(false);

  // Bildirim Ayarları State
  const [notifyRentDue, setNotifyRentDue] = useState(true);
  const [notifyMandateExpire, setNotifyMandateExpire] = useState(true);
  const [notifyLeadDecay, setNotifyLeadDecay] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Şifre Değiştirme Aksiyonu
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Lütfen mevcut şifrenizi girin." });
      return;
    }
    if (!newPassword || newPassword.length < 3) {
      setPasswordMsg({ type: "error", text: "Yeni şifreniz en az 3 karakter olmalıdır." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Girdiğiniz yeni şifreler birbiriyle eşleşmiyor!" });
      return;
    }

    const res = updateUserPassword(currentUser.id, currentPassword, newPassword);
    if (res.success) {
      setPasswordMsg({ type: "success", text: res.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMsg({ type: "error", text: res.message });
    }
  };

  // Profil Güncelleme Aksiyonu
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(currentUser.id, {
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      title: profileTitle,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-[#00adb5] font-bold tracking-wider uppercase">
              SİSTEM, KULLANICI & GÜVENLİK
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Oturum: {currentUser.name} ({currentUser.title || (isBroker ? "Broker" : "Danışman")})
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1d2566] tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00adb5]" />
            Kullanıcı & Güvenlik Ayarları
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Hesap şifrenizi yenileyin, profilinizi düzenleyin ve bildirim alarmlarını yapılandırın.
          </p>
        </div>

        {/* Hızlı Çıkış Butonu */}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer self-start md:self-auto shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Oturumu Kapat</span>
        </button>
      </div>

      {/* Sadeleştirilmiş Sekme Seçici (Tabs) */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 border border-slate-300">
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "security"
              ? "bg-[#1d2566] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-[#00adb5]" />
          <span>Güvenlik & Şifre Değiştir</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "profile"
              ? "bg-[#1d2566] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <User className="w-3.5 h-3.5 text-[#00adb5]" />
          <span>Profil & Bilgiler</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold transition cursor-pointer ${
            activeTab === "notifications"
              ? "bg-[#1d2566] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-[#00adb5]" />
          <span>Otomasyon & Alarmlar</span>
        </button>
      </div>

      {/* 1. GÜVENLİK & ŞİFRE DEĞİŞTİRME SEKMESİ */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sol Kolon: Şifre Yenileme Formu */}
          <div className="lg:col-span-7 sharp-card p-5 bg-white border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#00adb5]" />
                  Şifre Değiştirme Paneli
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Yeni şifrenizi belirleyin; eski şifreniz kalıcı olarak geçersiz kılınacaktır.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                Kişisel Güvenlik
              </span>
            </div>

            {passwordMsg && (
              <div
                className={`mb-4 p-3 border-l-4 text-xs font-mono flex items-start gap-2.5 ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                    : "bg-red-50 border-red-500 text-red-800"
                }`}
              >
                {passwordMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>{passwordMsg.text}</div>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1">
                  Mevcut Şifreniz <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Mevcut şifrenizi girin"
                    className="w-full pr-10 pl-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1">
                    Yeni Şifre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yeni şifreniz"
                      className="w-full pr-10 pl-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1">
                    Yeni Şifre (Tekrar) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifreyi onaylayın"
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Şifre Güvenlik Tavsiyesi */}
              <div className="p-3 bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
                <div className="font-bold text-[#1d2566] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#00adb5]" />
                  Güvenlik Kuralı:
                </div>
                <ul className="list-disc pl-4 text-slate-500 space-y-0.5 text-[10px]">
                  <li>Şifreniz en az 3 karakterden oluşmalıdır.</li>
                  <li>Yeni şifre kaydedildiği andan itibaren eski şifre tamamen devre dışı kalır.</li>
                  <li>Şifrenizi hiçbir çalışanla veya üçüncü şahısla paylaşmayınız.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00adb5] hover:bg-[#00969d] text-white font-mono font-bold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <Key className="w-4 h-4" />
                  <span>Şifreyi Güncelle & Eskisini Devre Dışı Bırak</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sağ Kolon: Aktif Oturum Özeti (Kullanıcı Adı ve Şifreler Asla Gösterilmez) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sharp-card p-4 bg-white border border-slate-200">
              <div className="text-xs font-mono font-bold text-[#1d2566] uppercase mb-3 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Aktif Oturum Sahibi</span>
                <span className="text-emerald-700 text-[10px]">● Giriş Yapıldı</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Ad Soyad:</span>
                  <span className="font-bold text-slate-900">{currentUser.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Unvan:</span>
                  <span className="font-semibold text-slate-800">{currentUser.title || "Danışman"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Yetki Seviyesi:</span>
                  <span className={isBroker ? "text-emerald-700 font-bold" : "text-[#1d2566] font-bold"}>
                    {isBroker ? "Broker / Yönetici (Tam Yetki)" : "Danışman"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">E-posta:</span>
                  <span className="text-slate-700">{currentUser.email}</span>
                </div>
              </div>
            </div>

            <div className="sharp-card p-4 bg-white border border-slate-200">
              <div className="text-xs font-mono font-bold text-[#1d2566] uppercase mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-[#00adb5]" />
                <span>Oturum & Cihaz Güvenliği</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800 font-mono">İki Adımlı Doğrulama (2FA)</div>
                    <div className="text-[10px] text-slate-400 font-mono">Girişte SMS / Onay Kodu</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                    className={`w-11 h-6 flex items-center transition px-0.5 cursor-pointer ${
                      twoFactorAuth ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-5 h-5 bg-white shadow-xs"></div>
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Cihaz:</span>
                    <span className="text-slate-800 font-semibold">Windows / Chrome</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Konum:</span>
                    <span className="text-slate-800">KKTC (Asia/Famagusta)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Durum:</span>
                    <span className="text-emerald-700 font-bold">Güvenli Bağlantı</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROFİL & BİLGİLER SEKMESİ */}
      {activeTab === "profile" && (
        <div className="sharp-card p-5 bg-white border border-slate-200 max-w-2xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                <User className="w-4 h-4 text-[#00adb5]" />
                Kişisel Profil Bilgileri
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sözleşmelerde ve WhatsApp mesajlarında görüntülenecek iletişim bilgileriniz.
              </p>
            </div>
          </div>

          {profileSaved && (
            <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Profil bilgileriniz başarıyla güncellendi!</span>
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 uppercase mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 uppercase mb-1">
                  Unvan / Pozisyon
                </label>
                <input
                  type="text"
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  placeholder="ör. Asistan, Gayrimenkul Danışmanı, Broker"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 uppercase mb-1">
                  Telefon / WhatsApp
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono text-slate-700 uppercase mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#00adb5] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1d2566] hover:bg-[#151c4f] text-white font-mono font-bold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-[#00adb5]" />
                <span>Profili Kaydet</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. OTOMASYON & ALARMLAR SEKMESİ */}
      {activeTab === "notifications" && (
        <div className="sharp-card p-5 bg-white border border-slate-200 max-w-2xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#1d2566] font-mono flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#00adb5]" />
                Otomasyon & Bildirim Kuralları
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kira vadesi, yetki süresi ve müşteri takip alarmlarının yönetimi.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold font-mono text-slate-900">Otomatik Kira Vadesi Hatırlatması</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Her ay vadesine 3 gün kala kiracının WhatsApp butonuna hazır şablon bağla.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifyRentDue(!notifyRentDue)}
                className={`w-11 h-6 flex items-center transition px-0.5 cursor-pointer ${
                  notifyRentDue ? "bg-[#00adb5] justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <div className="w-5 h-5 bg-white shadow-xs"></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold font-mono text-slate-900">Yetki Süresi Bitiş Alarmı (Mandates)</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Sözleşme bitimine 15 gün kala danışmana yetki uzatma uyarısı göster.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifyMandateExpire(!notifyMandateExpire)}
                className={`w-11 h-6 flex items-center transition px-0.5 cursor-pointer ${
                  notifyMandateExpire ? "bg-[#00adb5] justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <div className="w-5 h-5 bg-white shadow-xs"></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold font-mono text-slate-900">Müşteri Soğuma Uyarısı (Lead Decay)</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  10 gündür not girilmeyen sıcak müşteriler için bildirim zili alarmı çal.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNotifyLeadDecay(!notifyLeadDecay)}
                className={`w-11 h-6 flex items-center transition px-0.5 cursor-pointer ${
                  notifyLeadDecay ? "bg-[#00adb5] justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <div className="w-5 h-5 bg-white shadow-xs"></div>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
              <div>
                <div className="text-xs font-bold font-mono text-slate-900">Sesli Uyarı Efektleri</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Yeni Meta lead veya kritik alarm düştüğünde ses çal.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoundEffects(!soundEffects)}
                className={`w-11 h-6 flex items-center transition px-0.5 cursor-pointer ${
                  soundEffects ? "bg-[#00adb5] justify-end" : "bg-slate-300 justify-start"
                }`}
              >
                <div className="w-5 h-5 bg-white shadow-xs"></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
