// src/lib/api.ts
import axios from 'axios';
import { currentLocale } from '@/lib/locale-cookie';
import { LOCALE_HEADER, type Send } from '@/lib/shared';

/** The address of the server: the PDF files of an invoice are linked from it (P2-07). */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  // No fixed Content-Type: axios writes JSON for an object, and leaves a FormData (the pictures) to the browser,
  // which adds the boundary the server needs. No fixed timeout either: the other pages (the application of an artisan
  // sends up to 15 MB) never had one; the calls of the request pages choose theirs with `sender()` below.
});

// The server answers in the language the visitor reads (P3-04): its refusals, the words of a status, the texts of a quote. The language
// is read at each call, so a visitor who switches language gets the next answer in the new one. On the server (a page being rendered)
// it is French, which is the server's default too.
api.interceptors.request.use((config) => {
  config.headers.set(LOCALE_HEADER, currentLocale());

  return config;
});

export default api;

/** The way `callApi` of the shared package reaches the server (P1-16). `timeoutMs` is longer for pictures. */
export function sender(timeoutMs?: number): Send {
  return (config) => api.request({ ...config, ...(timeoutMs ? { timeout: timeoutMs } : {}) });
}

/** The usual call: 20 seconds. */
export const send: Send = sender(20_000);

/** Pictures are slow on a phone connection: two minutes for a call of five. */
export const sendSlow: Send = sender(120_000);

/**
 * Making a request waits for the server to save it and to send the SMS. A timeout that fires while the server is still working
 * would make the customer send the form again and make the request twice, so this one waits longer than the others.
 */
export const sendCreate: Send = sender(45_000);
