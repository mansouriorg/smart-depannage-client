// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart-Dépannage | Votre urgence, notre priorité",
  description: "Service de dépannage rapide pour plomberie, électricité et serrurerie.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        {/* On pourrait ajouter un Header global ici plus tard */}
        <main className="min-h-screen bg-slate-50 text-slate-900 print:min-h-0 print:bg-white">
          {children}
        </main>
      </body>
    </html>
  );
}
