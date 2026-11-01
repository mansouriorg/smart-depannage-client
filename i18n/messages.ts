import { catalogOf, type Catalog, type Locale } from "@/lib/shared";

/**
 * The namespaces that the browser's `useTranslations` reads: the common words and the website's own. Everything else of the shared
 * catalogue (status words, trades, errors, quote and payment words...) is read by the shared functions themselves (`tradeLabel`,
 * `errorText`, `customerQuote`...), which import the catalogue with the rest of `lib/shared`; sending those namespaces to the page too
 * would only make it heavier. A component that starts to call `useTranslations("<other namespace>")` adds it here.
 */
const SITE_NAMESPACES = ["common", "website"] as const;

export function siteMessages(locale: Locale): Catalog {
  const all = catalogOf(locale);
  const picked: Record<string, Catalog[string]> = {};

  for (const name of SITE_NAMESPACES) {
    if (name in all) picked[name] = all[name];
  }

  return picked;
}
