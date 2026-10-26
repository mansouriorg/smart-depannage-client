/**
 * What the page keeps while the customer is at the card provider (P2-10).
 *
 * The provider sends the customer back to one fixed page, `/paiement/retour`, and that page has to know which request was being paid.
 * The number and the secret of the link are kept in this tab only (`sessionStorage`: it goes with the tab, and is never sent anywhere), and
 * for a few hours at most. They are NOT put in the address the provider is given: the provider would see the secret, and so would the
 * logs between. A customer who comes back in another tab, or whose browser keeps nothing, gets a page that says so and points to the
 * tracking link they were sent. Nothing here ever throws: a private window or blocked site data just means nothing is kept.
 */
import { PAYMENT_RETURN_KEY, isPayUrl, recallPaymentReturn, rememberPaymentReturn, type PaymentReturnMemory } from '@/lib/shared';

function tabStore(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function keepPaymentReturn(memory: PaymentReturnMemory): void {
  try {
    tabStore()?.setItem(PAYMENT_RETURN_KEY, rememberPaymentReturn(memory));
  } catch {
    // Nothing is kept; the return page then points to the tracking link.
  }
}

export function readPaymentReturn(): PaymentReturnMemory | null {
  try {
    return recallPaymentReturn(tabStore()?.getItem(PAYMENT_RETURN_KEY));
  } catch {
    return null;
  }
}

/** Keeps which request is being paid and sends the customer to the provider's page. False (and nothing done) when the address is not an https page. */
export function leaveForProvider(memory: PaymentReturnMemory, payUrl: unknown): boolean {
  if (!isPayUrl(payUrl)) return false;

  keepPaymentReturn(memory);
  window.location.assign(payUrl);

  return true;
}
