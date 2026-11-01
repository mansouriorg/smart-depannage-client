'use client';

import { useLocale } from 'next-intl';
import { useEffect, useRef } from 'react';

import { localeOrDefault, type Locale } from '@/lib/shared';

/** The language of the page, as the shared package names it (`'fr' | 'ar'`): what the shared functions that write sentences take. */
export function useAppLocale(): Locale {
  return localeOrDefault(useLocale());
}

/**
 * What the page says now, for code that runs after a wait (an answer from the server, a photo upload). A function that started
 * before the visitor changed the language still holds the `t` and the language of the draw it started in; reading them through
 * this ref writes the sentence in the language that is on the page when the answer arrives. The ref is set after the draw, never
 * during it.
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}

/**
 * Runs `forget` when the visitor changes the language of the page, and not on the first draw. The page is drawn again with the new
 * language but keeps what the visitor typed and chose (`router.refresh()` keeps the state of the components): a sentence that was
 * kept in state (an error, a note) would stay in the old language, so the component lets it go, and says it again if it applies.
 */
export function useOnLanguageChange(forget: () => void): void {
  const locale = useLocale();
  const before = useRef(locale);
  const latest = useLatest(forget);

  useEffect(() => {
    if (before.current === locale) return;

    before.current = locale;
    latest.current();
  }, [locale, latest]);
}
