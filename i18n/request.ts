import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, LOCALE_COOKIE, bestLocaleOf, catalogOf, localeOf, type Locale } from "@/lib/shared";

/**
 * The language of this visit (P3-04), in this order: the visitor's own choice (the `locale` cookie that the language switch writes),
 * else the best language of the browser's list that the site speaks, else French. The address never carries the language: the
 * pages keep the addresses they had, and the tracking link in an SMS works in whichever language the visitor reads.
 */
export async function localeOfRequest(): Promise<Locale> {
  const chosen = localeOf((await cookies()).get(LOCALE_COOKIE)?.value);

  if (chosen) return chosen;

  return bestLocaleOf((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await localeOfRequest();

  // The messages are the shared package's: the same words as the phone app and the server's texts. Dates are Tunisian time.
  return { locale, messages: catalogOf(locale), timeZone: "Africa/Tunis" };
});
