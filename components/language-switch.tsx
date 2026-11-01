"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { writeLocaleCookie } from "@/lib/locale-cookie";
import { LOCALES, LOCALE_NAMES, directionOf, localeOrDefault, type Locale } from "@/lib/shared";
import { cn } from "@/lib/utils";

/**
 * The language switch (P3-04), on every page: each language is written in itself, so a visitor who cannot read the current one still
 * finds theirs. Choosing one keeps it in the `locale` cookie and asks the server for the page again: the words, the direction
 * (`<html dir>`) and the dates change at once, and what the visitor typed in a form stays where it is. It draws its own bar, which is not
 * part of a printed page, so that a browser that refuses the cookie leaves no empty bar behind.
 */
export function LanguageSwitch() {
  const current = localeOrDefault(useLocale());
  const t = useTranslations("common.language");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // A browser that refuses the cookie cannot keep the language, and the page would not change: the switch is not offered then.
  const [refused, setRefused] = useState(false);

  function choose(locale: Locale) {
    if (locale === current) return;

    if (!writeLocaleCookie(locale)) {
      setRefused(true);
      return;
    }

    startTransition(() => router.refresh());
  }

  if (refused) return null;

  return (
    <div className="flex justify-end border-b border-stone-200 bg-white px-4 py-1.5 print:hidden">
      <nav aria-label={t("label")} className="flex items-center gap-1 text-sm" aria-busy={pending}>
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            lang={locale}
            dir={directionOf(locale)}
            aria-current={locale === current ? "true" : undefined}
            onClick={() => choose(locale)}
            className={cn(
              "rounded-md px-2.5 py-1 font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]",
              locale === current ? "bg-[#D4AF37]/15 text-[#997b19]" : "text-stone-500 hover:bg-stone-100 hover:text-[#B69121]",
            )}
          >
            {LOCALE_NAMES[locale]}
          </button>
        ))}
      </nav>
    </div>
  );
}
