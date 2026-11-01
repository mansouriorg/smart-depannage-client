"use client";

import { useTranslations } from "next-intl";

import { Bidi } from "@/components/ltr";
import { paymentLines, type TrackingInterventionPayment } from "@/lib/shared";
import { useAppLocale } from "@/lib/use-app-locale";

/**
 * The payments of the request that were asked for and kept (a cancelled one, a card request nobody could pay, are not told), oldest
 * first. Nothing when there is none. `framed` puts the list in a block of its own, for a page that has no payment block (a request
 * that was cancelled after a payment was asked for: the customer still sees what was recorded).
 */
export function PaymentHistory({ payments, framed = false }: { payments: readonly TrackingInterventionPayment[] | null | undefined; framed?: boolean }) {
  const t = useTranslations("website.payment.history");
  const locale = useAppLocale();
  const lines = paymentLines(payments, locale);

  if (lines.length === 0) return null;

  const list = (
    <ul className="divide-y divide-stone-100 rounded-lg border border-stone-100 text-sm" aria-label={t("label")}>
      {lines.map((line) => (
        <li key={line.id} className="flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="font-semibold text-stone-800">
              {line.methodText} · <Bidi>{line.amountText}</Bidi>
            </p>
            <p className="text-xs text-stone-500">{[line.statusWords, line.dateText].filter(Boolean).join(" · ")}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  if (!framed) return list;

  return (
    <section className="space-y-3 rounded-xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="payment-history-title">
      <h2 id="payment-history-title" className="font-bold text-blue-950">
        {t("title")}
      </h2>
      {list}
    </section>
  );
}
