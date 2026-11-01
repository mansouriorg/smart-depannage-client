/**
 * Dates and times as the website writes them (P3-04): the Tunisian tags of the shared package (`fr-TN`, `ar-TN`: Latin digits, the
 * months of Tunisia), Tunisian time, and the 24-hour clock in both languages (`fr-TN` alone would write "03:05 PM", which French
 * never did here). The formats are made once per language, not once per use.
 */
import { INTL_TAGS, type Locale } from '@/lib/shared';

export const SITE_TIME_ZONE = 'Africa/Tunis';

export interface DateFormats {
  /** "14:05" */
  time: Intl.DateTimeFormat;
  /** "24 octobre à 14:05" / "24 أكتوبر في 14:05" */
  dayAndTime: Intl.DateTimeFormat;
  /** "24 octobre" / "24 أكتوبر" */
  day: Intl.DateTimeFormat;
}

const made = new Map<Locale, DateFormats>();

export function dateFormats(locale: Locale): DateFormats {
  let formats = made.get(locale);

  if (!formats) {
    // Latin digits in both languages, said out loud: the Tunisian tag already uses them, a browser's own data may not.
    const base = { timeZone: SITE_TIME_ZONE, hourCycle: 'h23', numberingSystem: 'latn' } as const;

    formats = {
      time: new Intl.DateTimeFormat(INTL_TAGS[locale], { ...base, hour: '2-digit', minute: '2-digit' }),
      dayAndTime: new Intl.DateTimeFormat(INTL_TAGS[locale], { ...base, day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      day: new Intl.DateTimeFormat(INTL_TAGS[locale], { ...base, day: 'numeric', month: 'long' }),
    };
    made.set(locale, formats);
  }

  return formats;
}

/** A date from the server (an ISO text) written with a format, or null when there is none or it is not a date. */
export function when(value: string | null | undefined, format: Intl.DateTimeFormat): string | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : format.format(date);
}
