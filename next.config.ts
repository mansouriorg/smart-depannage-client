import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The language of the visitor (P3-04): i18n/request.ts reads the `locale` cookie, then the browser's language.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // The tracking page: its address holds the secret of the customer's link (P1-16).
        // - no-referrer: a link or image on the page never tells another site the address it came from;
        // - noindex: search engines neither list the page nor follow what is on it;
        // - no-store: no shared cache keeps a copy of a page that is about one person's request.
        source: "/demande/status",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        // Where the card provider sends the customer back (P2-10): the page links to the tracking page with the secret of the link,
        // and says what became of one person's payment. Same rules.
        source: "/paiement/retour",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
