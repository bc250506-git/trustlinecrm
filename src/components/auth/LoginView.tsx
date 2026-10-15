"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { User as UserType } from "@/lib/types";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Smartphone,
  Laptop,
} from "lucide-react";

export function LoginView() {
  const { login, activateUserPassword, users } = useStore();

  // Giriş State'leri
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Aktivasyon Modu State'leri
  const [isActivationMode, setIsActivationMode] = useState(false);
  const [activatingUser, setActivatingUser] = useState<UserType | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  // Normal Giriş Gönderimi
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!usernameOrEmail.trim()) {
      setErrorMsg("Lütfen kullanıcı adı veya e-posta adresinizi girin.");
      return;
    }
    if (!password) {
      setErrorMsg("Lütfen şifrenizi girin.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(usernameOrEmail, password);
      setIsLoading(false);

      if (res.mustActivate && res.user) {
        // Kullanıcı henüz şifre belirlememiş -> doğrudan aktivasyon ekranına yönlendir
        setActivatingUser(res.user);
        setSelectedUserId(res.user.id);
        setIsActivationMode(true);
        setErrorMsg(null);
        return;
      }

      if (!res.success) {
        setErrorMsg(
          res.message || "Giriş başarısız oldu. Kullanıcı adı veya şifreniz hatalı."
        );
      }
    } catch {
      setIsLoading(false);
      setErrorMsg("Giriş yapılırken sunucu bağlantı hatası oluştu.");
    }
  };

  // Aktivasyon Modunu Başlat (Proaktif veya Otomatik)
  const handleStartActivation = (prefilledUser?: UserType) => {
    setErrorMsg(null);
    setActivationError(null);
    setNewPassword("");
    setConfirmPassword("");

    if (prefilledUser) {
      setActivatingUser(prefilledUser);
      setSelectedUserId(prefilledUser.id);
    } else if (usernameOrEmail.trim()) {
      const clean = usernameOrEmail.trim().toLowerCase();
      const match = users.find(
        (u) =>
          u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
      );
      if (match) {
        setActivatingUser(match);
        setSelectedUserId(match.id);
      } else {
        setActivatingUser(null);
        setSelectedUserId(users[0]?.id || "");
      }
    } else {
      setActivatingUser(users[0] || null);
      setSelectedUserId(users[0]?.id || "");
    }

    setIsActivationMode(true);
  };

  // Aktivasyon Şifresini Kaydet
  const handleActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);

    const targetUser = activatingUser || users.find((u) => u.id === selectedUserId);
    if (!targetUser) {
      setActivationError("Lütfen hesabınızı listeden seçiniz.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setActivationError("Kişisel şifreniz en az 6 karakterden oluşmalıdır.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setActivationError("Girdiğiniz şifreler birbiriyle eşleşmiyor!");
      return;
    }

    setIsActivating(true);
    try {
      const res = await activateUserPassword(targetUser.id, newPassword);
      setIsActivating(false);

      if (!res.success) {
        setActivationError(res.message);
      }
      // Başarılı ise store otomatik olarak setCurrentUser & setIsAuthenticated yapar
    } catch {
      setIsActivating(false);
      setActivationError("Şifre kaydedilirken bağlantı hatası oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#0f172a] flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-[#00adb5] selection:text-white border-t-4 border-t-[#00adb5]">
      {/* Üst İnce Bilgi Çubuğu */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between text-xs font-mono text-slate-500 pb-2">
        <span className="text-[11px] text-[#00adb5] font-bold tracking-wider uppercase flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[#00adb5]" />
          TRUSTLINE REAL ESTATE
        </span>
        <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Kriptografik Güvenli Oturum</span>
        </div>
      </header>

      {/* Ortalanmış Temiz Kart */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="max-w-md w-full bg-white border border-slate-300 shadow-xl p-6 sm:p-8 transition-all duration-200">
          {/* Logo ve Başlık */}
          <div className="text-center pb-5 mb-5 border-b border-slate-200">
            <img
              src="/logo.png"
              alt="Trustline Real Estate"
              className="h-12 w-auto object-contain mx-auto mb-3"
            />
            <h1 className="text-lg font-bold text-[#1d2566] tracking-tight flex items-center justify-center gap-2">
              {isActivationMode ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#00adb5]" />
                  <span>İlk Giriş Şifre Aktivasyonu</span>
                </>
              ) : (
                <span>CRM Danışman Giriş Masası</span>
              )}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              {isActivationMode
                ? "Hesabınız için kalıcı ve güçlü kişisel şifrenizi belirleyin"
                : "Kullanıcı adı ve şifrenizle oturum açın"}
            </p>
          </div>

          {/* ======================================================== */}
          {/* MOD 1: İLK GİRİŞ AKTİVASYON FORMU                         */}
          {/* ======================================================== */}
          {isActivationMode ? (
            <div className="space-y-4">
              {/* Güvenlik Protokolü Uyarısı */}
              <div className="p-3 bg-amber-50/80 border-l-4 border-amber-500 text-amber-900 text-xs font-mono leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Kişisel Şifre Güvenlik Protokolü
                </div>
                <p className="text-[11px] text-amber-800">
                  Geliştirici veya ofis yöneticisi dahil hiç kimse şifrenizi bilmez
                  ve göremez. Belirleyeceğiniz şifre <strong>PBKDF2 SHA-256</strong> ile
                  kriptolanır ve laptop, telefon ve tablet tüm cihazlarınızda anında geçerli olur.
                </p>
              </div>

              {/* Hata Bildirimi */}
              {activationError && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs font-mono flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{activationError}</div>
                </div>
              )}

              <form onSubmit={handleActivationSubmit} className="space-y-4">
                {/* Danışman Seçimi / Gösterimi */}
                {activatingUser ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-mono">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                      Aktive Edilecek Danışman Hesabı
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {activatingUser.name}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          @{activatingUser.username} • {activatingUser.email}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Aktivasyon Bekliyor
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                      Danışman Hesabınızı Seçin
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => {
                        setSelectedUserId(e.target.value);
                        const u = users.find((usr) => usr.id === e.target.value);
                        if (u) setActivatingUser(u);
                      }}
                      className="w-full px-3 py-2.5 text-xs font-mono bg-white border border-slate-300 focus:border-[#00adb5] focus:outline-none transition shadow-2xs cursor-pointer"
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} (@{u.username})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Yeni Şifre */}
                <div>
                  <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                    Yeni Kişisel Şifreniz <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="En az 6 karakter"
                      className="w-full pl-9 pr-10 py-2.5 text-xs font-mono bg-white border border-slate-300 focus:border-[#00adb5] focus:outline-none transition shadow-2xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Yeni Şifre Tekrarı */}
                <div>
                  <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                    Yeni Şifre (Tekrar) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Şifrenizi onaylayın"
                      className="w-full pl-9 pr-10 py-2.5 text-xs font-mono bg-white border border-slate-300 focus:border-[#00adb5] focus:outline-none transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Cihaz Senkronizasyonu Bilgisi */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5 text-[#00adb5]" />
                    <span>Laptop</span>
                    <span className="text-slate-300">+</span>
                    <Smartphone className="w-3.5 h-3.5 text-[#00adb5]" />
                    <span>Mobil & Tablet</span>
                  </div>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Bulut Senkron
                  </span>
                </div>

                {/* Gönder Butonu */}
                <button
                  type="submit"
                  disabled={isActivating}
                  className="w-full py-2.5 bg-[#00adb5] hover:bg-[#00969d] text-white font-bold font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50 mt-2"
                >
                  {isActivating ? (
                    <span>Kriptolanıyor & Kaydediliyor...</span>
                  ) : (
                    <>
                      <span>Şifremi Kaydet & CRM'e Giriş Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Giriş Ekranına Dön */}
                <button
                  type="button"
                  onClick={() => {
                    setIsActivationMode(false);
                    setActivatingUser(null);
                    setActivationError(null);
                  }}
                  className="w-full py-2 bg-transparent hover:bg-slate-100 text-slate-600 font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Giriş Ekranına Dön</span>
                </button>
              </form>
            </div>
          ) : (
            /* ======================================================== */
            /* MOD 2: STANDART GİRİŞ FORMU                               */
            /* ======================================================== */
            <div>
              {/* Hata Bildirimi */}
              {errorMsg && (
                <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs font-mono flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Giriş Formu */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                    Kullanıcı Adı veya E-posta
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={usernameOrEmail}
                      onChange={(e) => setUsernameOrEmail(e.target.value)}
                      placeholder="bora.boran veya bora@trustline.com.tr"
                      className="w-full pl-9 pr-3 py-2.5 text-xs font-mono bg-white border border-slate-300 focus:border-[#00adb5] focus:outline-none transition shadow-2xs"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-1.5">
                    Şifre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Şifrenizi girin"
                      className="w-full pl-9 pr-10 py-2.5 text-xs font-mono bg-white border border-slate-300 focus:border-[#00adb5] focus:outline-none transition shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-mono text-[11px]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#00adb5] w-3.5 h-3.5"
                    />
                    <span>Beni bu cihazda hatırla</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#00adb5] hover:bg-[#00969d] text-white font-bold font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>Doğrulanıyor...</span>
                  ) : (
                    <>
                      <span>Giriş Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* İlk Giriş Aktivasyon Bağlantısı */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleStartActivation()}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#1d2566] text-xs font-mono font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#00adb5]" />
                  <span>İlk Giriş: Kendi Şifreni Belirle & Aktive Et</span>
                </button>
              </div>
            </div>
          )}

          {/* Alt Güvenlik Notu */}
          <div className="mt-5 pt-3 border-t border-slate-100 text-center text-[10px] font-mono text-slate-400">
            <span>
              🔒 Trustline Zero-Knowledge Güvenliği: Şifreler düz metin olarak saklanmaz.
            </span>
          </div>
        </div>
      </main>

      {/* Alt Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
        © 2026 Trustline Real Estate & Investment Ltd. Girne / KKTC
      </footer>
    </div>
  );
}
