import type { Metadata } from "next";

import { PaymentReturnView } from "@/components/guest/payment-return";

// Where the card provider sends the customer back (P2-10). The page links to the tracking page, whose address carries the secret of the
// customer's link: it must not be indexed, and no page it links to may learn where it came from (next.config.ts sends the same rules as headers).
export const metadata: Metadata = {
  title: "Votre paiement | Smart-Dépannage",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function PaymentReturnPage() {
  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <PaymentReturnView />
    </div>
  );
}
