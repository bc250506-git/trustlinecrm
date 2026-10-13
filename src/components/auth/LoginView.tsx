"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export function LoginView() {
  const { login } = useStore();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      const res = login(usernameOrEmail, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.message || "Giriş başarısız oldu. Kullanıcı adı veya şifre hatalı.");
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a] flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-[#00adb5] selection:text-white border-t-2 border-t-[#00adb5]">
      {/* Üst İnce Bilgi Çubuğu */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between text-xs font-mono text-slate-500 pb-2">
        <span className="text-[11px] text-[#00adb5] font-bold tracking-wider uppercase">
          TRUSTLINE REAL ESTATE
        </span>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Güvenli Oturum</span>
        </div>
      </header>

      {/* Ortalanmış Temiz Beyaz Giriş Kartı */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="max-w-md w-full bg-white border border-slate-300 shadow-md p-6 sm:p-8">
          {/* Logo ve Başlık */}
          <div className="text-center pb-5 mb-5 border-b border-slate-200">
            <img
              src="/logo.png"
              alt="Trustline Real Estate"
              className="h-12 w-auto object-contain mx-auto mb-3"
            />
            <h1 className="text-lg font-bold text-[#1d2566] tracking-tight">
              CRM Giriş Masası
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Kullanıcı adı ve şifrenizle oturum açın
            </p>
          </div>

          {/* Hata Bildirimi */}
          {errorMsg && (
            <div className="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-800 text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Giriş Formu */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Kullanıcı adınızı girin"
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
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                <span>Giriş Yapılıyor...</span>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alt Bilgi */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] font-mono text-slate-400">
            <span>Şifrenizi unuttuysanız veya değiştirmek istiyorsanız yöneticiye başvurun veya Ayarlar sekmesini kullanın.</span>
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
