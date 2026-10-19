import type { NextConfig } from "next";

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
    ];
  },
};

export default nextConfig;
