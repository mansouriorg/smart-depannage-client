// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

import { LanguageSwitch } from "@/components/language-switch";
import { siteMessages } from "@/i18n/messages";
import { directionOf, localeOrDefault } from "@/lib/shared";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Arabic letters come from this font, the Latin ones (the name of the brand, a phone number, an e-mail address) from Inter: globals.css
// puts them in that order for a right-to-left page. Not preloaded: a visitor who reads French never needs it.
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", preload: false });

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("website.metadata.home");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = localeOrDefault(await getLocale());

  return (
    <html lang={locale} dir={directionOf(locale)}>
      <body className={`${inter.className} ${inter.variable} ${arabic.variable} flex min-h-screen flex-col print:block print:min-h-0`}>
        <NextIntlClientProvider locale={locale} messages={siteMessages(locale)} timeZone="Africa/Tunis">
          {/* The language switch, on every page; it is not part of a printed invoice. */}
          <LanguageSwitch />
          <main className="flex flex-1 flex-col bg-slate-50 text-slate-900 print:block print:min-h-0 print:bg-white">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
