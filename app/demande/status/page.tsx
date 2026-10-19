import type { Metadata } from "next";

import { TrackingView } from "@/components/guest/tracking-view";

// The address of this page carries the secret of the tracking link. It must not be indexed, and no page it links to may
// learn it from the Referer header: the same two rules are sent as headers by next.config.ts, which also reach crawlers
// that read headers before the page.
export const metadata: Metadata = {
  title: "Suivi de votre demande | Smart-Dépannage",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <TrackingView />
    </div>
  );
}
