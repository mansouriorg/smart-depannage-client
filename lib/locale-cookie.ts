/**
 * The visitor's language, kept in the `locale` cookie (P3-04). Pure text in, text out: the browser's `document` is touched only by
 * `writeLocaleCookie` and `currentLocale`, which never throw. A browser that refuses cookies cannot keep a language: the page is drawn
 * from the cookie (`i18n/request.ts`), so `writeLocaleCookie` says whether the cookie was kept, and the switch is not offered when it was not.
 */
import { DEFAULT_LOCALE, LOCALE_COOKIE, localeOf, type Locale } from '@/lib/shared';

/** A year: a visitor chooses once. */
export const LOCALE_COOKIE_MAX_AGE = 31_536_000;

/** The language named in a `document.cookie` text ("a=1; locale=ar; b=2"), or null. */
export function localeFromCookieText(cookieText: string | null | undefined): Locale | null {
  for (const part of (cookieText ?? '').split(';')) {
    const at = part.indexOf('=');

    if (at < 0 || part.slice(0, at).trim() !== LOCALE_COOKIE) continue;

    try {
      return localeOf(decodeURIComponent(part.slice(at + 1).trim()));
    } catch {
      return null;
    }
  }

  return null;
}

/** The text to assign to `document.cookie` to remember a language (`secure` on a page served over https). */
export function localeCookieText(locale: Locale, secure = false): string {
  return `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure ? '; secure' : ''}`;
}

/** Keeps a language in the cookie. True when the browser kept it (read back), false when it refused: nothing then changes on the next page. */
export function writeLocaleCookie(locale: Locale): boolean {
  try {
    document.cookie = localeCookieText(locale, window.location.protocol === 'https:');

    return localeFromCookieText(document.cookie) === locale;
  } catch {
    return false;
  }
}

/**
 * The language of the page in the browser: the cookie, else the language the server wrote on `<html lang>` (a visitor who has not
 * chosen yet gets their browser's language there), else French. On the server (no document) it is French: a call made while a page is
 * rendered there is not about a visitor's screen.
 */
export function currentLocale(): Locale {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;

  return localeFromCookieText(document.cookie) ?? localeOf(document.documentElement.lang) ?? DEFAULT_LOCALE;
}
