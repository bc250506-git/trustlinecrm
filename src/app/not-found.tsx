import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center font-mono">
      <div className="sharp-card p-8 bg-white border border-slate-300 shadow-md max-w-md w-full space-y-4">
        <div className="w-12 h-12 bg-[#1d2566] text-white flex items-center justify-center mx-auto text-lg font-bold">
          404
        </div>
        <h2 className="text-base font-bold text-[#1d2566]">
          Sayfa Bulunamadı
        </h2>
        <p className="text-xs text-slate-500">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir. Trustline CRM tek sayfa kontrol mimarisinde çalışmaktadır.
        </p>
        <Link
          href="/"
          className="sharp-btn-primary block w-full py-2.5 text-xs font-bold text-center text-white"
        >
          Ana Sayfaya / CRM Paneline Dön
        </Link>
      </div>
    </div>
  );
}
