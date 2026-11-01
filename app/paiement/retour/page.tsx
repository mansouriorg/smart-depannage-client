import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PaymentReturnView } from "@/components/guest/payment-return";

// Where the card provider sends the customer back (P2-10). The page links to the tracking page, whose address carries the secret of the
// customer's link: it must not be indexed, and no page it links to may learn where it came from (next.config.ts sends the same rules as headers).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("website.metadata.payment");

  return {
    title: t("title"),
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
  };
}

export default function PaymentReturnPage() {
  return (
    <div className="flex-1 bg-stone-50 px-4 py-10">
      <PaymentReturnView />
    </div>
  );
}
