/**
 * The requests this device remembers (P1-16).
 *
 * Whoever makes a request without an account has one thing to come back with: the tracking link. The page keeps the
 * number and the secret of the link (nothing else: no name, no address, no phone) in this browser, so that closing the
 * tab does not lose the request. The same secret is in the SMS, so keeping it here gives no more access than the SMS
 * does; but on a shared computer it is a trace, which is why each request has a "forget" button and a request the server
 * no longer knows is dropped by itself.
 *
 * The functions on lists are pure (and tested); `readSavedText`, `storeSaved` and `subscribeSaved` are the only ones that
 * touch the browser, and they never throw: a private window, blocked site data or a full disk just means nothing is remembered.
 */
import { recordIdOf } from '@/lib/shared';

export interface SavedRequest {
  id: number;
  token: string;
  /** What the request is about, in words ("Plomberie"), in the language the page had when it was kept. */
  service: string;
  /** The trade of the request when that is all `service` says: the page then writes it again in the language it has now (P3-04). */
  trade?: string;
  /** When it was made or last opened (milliseconds). */
  savedAt: number;
}

export const SAVED_REQUESTS_KEY = 'sd.requests.v1';
export const MAX_SAVED_REQUESTS = 5;

/** The shape of the secret of a link: letters, digits, "-" and "_" (the server writes 64 hexadecimal characters). */
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{16,128}$/;

/** The shape of a trade code ("PLOMBIER"): capital letters and "_". */
const TRADE_CODE_FORMAT = /^[A-Z_]{1,40}$/;

export function isTrackingToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_FORMAT.test(value);
}

/** What was stored, kept entry by entry: anything that is not a request with a number and a secret is dropped. */
export function parseSaved(text: string | null | undefined): SavedRequest[] {
  if (!text) return [];

  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) return [];

  const seen = new Set<number>();
  const kept: SavedRequest[] = [];

  for (const item of data) {
    if (!item || typeof item !== 'object') continue;

    const { id, token, service, trade, savedAt } = item as Record<string, unknown>;
    const number = typeof id === 'number' ? recordIdOf(id) : null;

    if (number === null || !isTrackingToken(token) || seen.has(number)) continue;

    seen.add(number);
    kept.push({
      id: number,
      token,
      service: typeof service === 'string' ? service.slice(0, 60) : '',
      ...(typeof trade === 'string' && TRADE_CODE_FORMAT.test(trade) ? { trade } : {}),
      savedAt: typeof savedAt === 'number' && Number.isFinite(savedAt) ? savedAt : 0,
    });
  }

  return kept.sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_SAVED_REQUESTS);
}

/** The list with this request first (a request already there is replaced, not doubled); the oldest go beyond five. */
export function remember(list: readonly SavedRequest[], entry: SavedRequest): SavedRequest[] {
  return [entry, ...list.filter((item) => item.id !== entry.id)].sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_SAVED_REQUESTS);
}

export function forget(list: readonly SavedRequest[], id: number): SavedRequest[] {
  return list.filter((item) => item.id !== id);
}

/** The page of a request, as the server writes the link it sends by SMS. */
export function trackingPath(entry: Pick<SavedRequest, 'id' | 'token'>): string {
  return `/demande/status?id=${entry.id}&token=${encodeURIComponent(entry.token)}`;
}

/** The name of the event `storeSaved` raises in this tab (the browser's own `storage` event only reaches the other tabs). */
export const SAVED_REQUESTS_EVENT = 'sd:requests-changed';

/** What is stored, as text: '' when nothing is, or when the browser keeps nothing (blocked data, server render). */
export function readSavedText(): string {
  try {
    return window.localStorage.getItem(SAVED_REQUESTS_KEY) ?? '';
  } catch {
    return '';
  }
}

export function loadSaved(): SavedRequest[] {
  return parseSaved(readSavedText());
}

/** For a screen that shows the list: `onChange` is called when this tab or another one changes it. Returns the way to stop. */
export function subscribeSaved(onChange: () => void): () => void {
  try {
    window.addEventListener(SAVED_REQUESTS_EVENT, onChange);
    window.addEventListener('storage', onChange);

    return () => {
      window.removeEventListener(SAVED_REQUESTS_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  } catch {
    return () => undefined;
  }
}

export function storeSaved(list: readonly SavedRequest[]): void {
  try {
    if (list.length === 0) window.localStorage.removeItem(SAVED_REQUESTS_KEY);
    else window.localStorage.setItem(SAVED_REQUESTS_KEY, JSON.stringify(list));
  } catch {
    // nothing is remembered: the link in the SMS still works
  }

  try {
    window.dispatchEvent(new Event(SAVED_REQUESTS_EVENT));
  } catch {
    // no window to tell (server render): nobody is showing the list
  }
}

/** Remembers a request on this device. Returns the list as stored. */
export function rememberRequest(entry: SavedRequest): SavedRequest[] {
  const next = remember(loadSaved(), entry);

  storeSaved(next);

  return next;
}

export function forgetRequest(id: number): SavedRequest[] {
  const next = forget(loadSaved(), id);

  storeSaved(next);

  return next;
}
