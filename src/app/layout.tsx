import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trustline Real Estate — Kurumsal Emlak CRM",
  description: "Trustline Real Estate by Volkan Affan Kanıgür — Portföy, Müşteri ve Finans Yönetim Sistemi",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
