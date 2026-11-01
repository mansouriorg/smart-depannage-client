import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TrackingView } from "@/components/guest/tracking-view";

// The address of this page carries the secret of the tracking link. It must not be indexed, and no page it links to may
// learn it from the Referer header: the same two rules are sent as headers by next.config.ts, which also reach crawlers
// that read headers before the page.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("website.metadata.tracking");

  return {
    title: t("title"),
    robots: { index: false, follow: false, nocache: true },
    referrer: "no-referrer",
  };
}

export default function TrackingPage() {
  return (
    <div className="flex-1 bg-stone-50 px-4 py-10 print:min-h-0 print:bg-white print:p-0">
      <TrackingView />
    </div>
  );
}
