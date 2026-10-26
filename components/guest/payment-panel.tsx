"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckCircle2, Clock, CreditCard, ExternalLink, Landmark, Loader2, Wallet } from "lucide-react";

import { CopyButton } from "@/components/guest/copy-button";
import { PaymentHistory } from "@/components/guest/payment-history";
import { LinkedWords } from "@/components/guest/problem-link";
import { ERROR_CLASS, FIELD_CLASS, PRIMARY_BUTTON_CLASS } from "@/components/guest/styles";
import { useNote } from "@/components/guest/use-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { send } from "@/lib/api";
import { keepPaymentReturn, leaveForProvider } from "@/lib/card-payment";
import { failureOf } from "@/lib/guest-errors";
import {
  PAYMENT_REFERENCE_MAX,
  PAYMENT_WORDS,
  attemptKey,
  callApi,
  cardCanTryAgain,
  paymentPanel,
  paymentSignature,
  pickedChoice,
  readTransferReference,
  routes,
  stateHasMoved,
  type KeyedAttempt,
  type PaymentChoice,
  type PaymentOptions,
  type PaymentPanel as PanelState,
  type TrackingInterventionPayment,
} from "@/lib/shared";
import { cn } from "@/lib/utils";

const PANEL_CLASS = "space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm";

const DONE: Record<PaymentChoice, string> = {
  CASH: "Demande enregistrée. Remettez la somme au technicien : notre équipe confirmera la réception.",
  BANK_TRANSFER: "Demande de virement enregistrée. Faites le virement avec les coordonnées ci-dessous, puis envoyez-nous sa référence.",
  ONLINE_CARD: "Demande enregistrée.",
};

/** Said when the customer is sent to the provider's page (the page may take a moment to open). */
const LEAVING_WORDS = "Redirection vers la page de paiement sécurisée…";

/** Said before the choice is confirmed, and again while a payment waits: the customer cannot cancel or change it from this page. */
const BEFORE_WORDS = "Une fois confirmé, le mode de paiement ne se change plus depuis cette page : écrivez-nous dans « Un problème ? » plus bas.";
const WAITING_WORDS = "Pour changer de mode de paiement, écrivez-nous dans « Un problème ? » plus bas sur cette page.";

/** Where a transfer goes, with what to write on it. Each figure can be copied. */
function BankDetails({ bank, amountText }: { bank: NonNullable<PanelState["bank"]>; amountText: string | null }) {
  const base = useId();

  return (
    <dl className="space-y-3 rounded-lg border border-stone-200 bg-stone-50/60 p-4 text-sm" aria-label="Coordonnées pour le virement">
      {bank.holder && (
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">Bénéficiaire</dt>
          <dd className="break-words font-semibold text-stone-800">{bank.holder}</dd>
        </div>
      )}
      <div>
        <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">RIB</dt>
        <dd className="flex flex-wrap items-center justify-between gap-2">
          <span id={`${base}-rib`} className="break-all font-mono text-xs font-semibold text-stone-800 min-[360px]:text-sm sm:text-base">
            {bank.ribText}
          </span>
          <CopyButton text={bank.ribText.replace(/\s/g, "")} label="le RIB" targetId={`${base}-rib`} />
        </dd>
      </div>
      <div>
        <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">Motif du virement (à écrire dessus)</dt>
        <dd className="flex flex-wrap items-center justify-between gap-2">
          <span id={`${base}-reference`} className="font-mono text-base font-semibold text-stone-800">
            {bank.reference}
          </span>
          <CopyButton text={bank.reference} label="le motif du virement" targetId={`${base}-reference`} />
        </dd>
      </div>
      {amountText && (
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-stone-500">Montant</dt>
          <dd className="font-semibold text-stone-800">{amountText}</dd>
        </div>
      )}
    </dl>
  );
}

/**
 * How to pay, from the options the server gave (`GET payment-options`): cash, a transfer to the company's account, or the card. The card
 * is shown as not available until a provider is connected; chosen, it sends the customer to the provider's page and the server settles the
 * payment by itself when the provider says it is paid (P2-10). A cash or transfer payment that waits is confirmed by the team; the customer
 * cannot cancel any waiting payment from here (the server refuses another way of paying while one waits, and says so).
 */
export function PaymentPanel({
  id,
  token,
  options,
  payments,
  reads,
  onChanged,
}: {
  id: number;
  token: string;
  options: PaymentOptions;
  /** The payments of the request, as the tracking answer lists them: the history under the block. */
  payments: readonly TrackingInterventionPayment[] | undefined;
  /** How many reads of the options finished (good or not): a message that waits for a change stops waiting after two. */
  reads: number;
  onChanged: () => void;
}) {
  const [choice, setChoice] = useState<PaymentChoice | null>(null);
  // What was to pay when the way was picked: the transfer is made for that amount.
  const [pickedFor, setPickedFor] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  // One key per decision (P2-10): a repeated tap, or a retry after an answer that was lost, is the same request for the server and
  // never makes a second payment. A new key when another way is picked, when the request carries something new (the reference of a
  // transfer), after any answer that settled the request, and when the first attempt is more than two minutes old (a payment that
  // has ended since would be handed back for the same key).
  const attempt = useRef<KeyedAttempt | null>(null);

  const panel = paymentPanel(options);
  const { done, error, settling, show, clear } = useNote(paymentSignature(panel), panel?.stage ?? "none", reads);

  // The customer who comes back from the provider's page with the Back button gets this page as the browser kept it: locked, and saying
  // that they are on their way. They are not any more: the page is free again, and what it shows is read again at the next poll.
  useEffect(() => {
    const back = (event: PageTransitionEvent) => {
      if (!event.persisted) return;

      setBusy(false);
      clear();
    };

    window.addEventListener("pageshow", back);

    return () => window.removeEventListener("pageshow", back);
  }, [clear]);

  // The amount changed while a way was picked (an invoice was issued meanwhile): what was picked was picked for another amount.
  if (choice !== null && pickedFor !== null && panel && panel.amountText !== pickedFor) {
    setChoice(null);
    setPickedFor(null);
    show({ kind: "error", text: `Le montant à payer a changé : il est maintenant de ${panel.amountText}. Choisissez de nouveau comment payer.` });
  }

  if (!panel || panel.stage === "none") return null;

  const chosen = pickedChoice(panel.choices, choice);

  async function request(method: PaymentChoice, typed: string) {
    if (busy) return;

    // The reference is asked for when it is the point (a payment that waits for it); with a first request it is optional.
    const waiting = panel?.stage === "waiting";
    const read = method === "BANK_TRANSFER" && (waiting || typed.trim() !== "") ? readTransferReference(typed) : null;

    if (read && !read.ok) {
      show({ kind: "error", text: read.problem });

      return;
    }

    setBusy(true);
    clear();

    const kept = attemptKey(attempt.current, method, read?.ok ? read.reference : "", Date.now());
    const key = kept.key;

    attempt.current = kept;

    let leaving = false;

    try {
      const answer = await callApi(send, routes.guest.pay(id, token, { method, ...(read?.ok ? { reference: read.reference } : {}) }, key));

      attempt.current = null;

      if (method === "ONLINE_CARD") {
        // The provider's page is where the card is paid. Without a page (the provider did not take the request) nothing more can be done
        // here: the page then offers to try again.
        leaving = leaveForProvider({ id, token }, answer.payment.payUrl);

        if (leaving) {
          show({ kind: "done", text: LEAVING_WORDS }, { rereads: false });

          return;
        }

        show({ kind: "error", text: PAYMENT_WORDS.cardUnprepared }, { rereads: true });
        onChanged();

        return;
      }

      // The same reference sent again changes nothing on the page: nothing is expected to move, so the message is not kept for a change.
      const unchanged = waiting && read?.ok === true && panel?.open?.reference === read.reference;

      show({ kind: "done", text: read?.ok && method === "BANK_TRANSFER" ? "Référence envoyée. Notre équipe confirmera le virement dès réception." : DONE[method] }, { rereads: !unchanged });
      setChoice(null);
      setPickedFor(null);
      setReference("");
      onChanged();
    } catch (failed) {
      const failure = failureOf(failed, "Votre demande de paiement n’a pas pu être enregistrée. Réessayez.");
      // Another payment is waiting, or the job is paid: read the options again so that the page says what is true.
      const moved = failure.kind === "refused" && stateHasMoved(failure.status);

      // A refusal settled this request (the key is spent); a lost answer or a provider that was down did not: the same key is sent again.
      if (failure.kind !== "network" && failure.kind !== "server") attempt.current = null;

      show({ kind: "error", text: failure.message }, { rereads: moved });

      if (moved) onChanged();
    } finally {
      // The customer who is on the way to the provider's page cannot tap again while it opens.
      if (!leaving) setBusy(false);
    }
  }

  return (
    <section className={PANEL_CLASS} aria-labelledby="payment-title">
      <div className="flex items-center gap-2">
        {panel.stage === "paid" ? <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden /> : panel.stage === "waiting" ? <Clock className="h-5 w-5 text-orange-500" aria-hidden /> : <Wallet className="h-5 w-5 text-[#B69121]" aria-hidden />}
        <h2 id="payment-title" className="font-bold text-blue-950">
          {panel.stage === "paid" ? "Paiement reçu" : panel.stage === "waiting" ? "Paiement en attente" : "Payer"}
        </h2>
      </div>

      {panel.words && (
        <p className="text-sm text-stone-700">
          <LinkedWords text={panel.words} />
        </p>
      )}

      {/* Always on the page, so that a screen reader says what is put in it. */}
      <div role="status" aria-live="polite">
        {done && (
          <p className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <LinkedWords text={done} />
            </span>
          </p>
        )}
      </div>

      {panel.stage === "choose" && !settling && (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();

            if (chosen) void request(chosen, chosen === "BANK_TRANSFER" ? reference : "");
          }}
        >
          <fieldset className="space-y-2" disabled={busy}>
            <legend className="sr-only">Mode de paiement</legend>
            {panel.choices.map((item) => (
              <label
                key={item.method}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors has-[:checked]:border-[#D4AF37] has-[:checked]:bg-[#D4AF37]/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#D4AF37]",
                  item.available ? "border-stone-200 hover:border-[#D4AF37]/50" : "cursor-not-allowed border-stone-100 bg-stone-50 opacity-70",
                )}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={item.method}
                  checked={chosen === item.method}
                  disabled={!item.available}
                  onChange={() => {
                    setChoice(item.method);
                    setPickedFor(panel.amountText);
                    attempt.current = null;
                    clear();
                  }}
                  className="mt-1 h-4 w-4 accent-[#B69121]"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold text-stone-800">
                    {item.method === "BANK_TRANSFER" ? <Landmark className="h-4 w-4" aria-hidden /> : item.method === "ONLINE_CARD" ? <CreditCard className="h-4 w-4" aria-hidden /> : <Wallet className="h-4 w-4" aria-hidden />}
                    {item.title}
                  </span>
                  <span className="block text-sm text-stone-600">{item.available ? item.detail : item.reason}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {chosen === "BANK_TRANSFER" && panel.bank && (
            <div className="space-y-3">
              <BankDetails bank={panel.bank} amountText={panel.amountText} />
              <div className="space-y-2">
                <Label htmlFor="transfer-reference" className="text-sm font-semibold text-stone-700">
                  Référence de l’opération, donnée par votre banque (facultatif)
                </Label>
                <Input
                  id="transfer-reference"
                  value={reference}
                  maxLength={PAYMENT_REFERENCE_MAX}
                  onChange={(event) => {
                    setReference(event.target.value);
                    if (error) clear();
                  }}
                  placeholder="Si vous l’avez déjà fait"
                  className={FIELD_CLASS}
                  autoComplete="off"
                />
                <p className="text-xs text-stone-500">Vous pourrez l’envoyer plus tard, une fois le virement fait.</p>
              </div>
            </div>
          )}

          {chosen !== null && (
            <p className="text-xs text-stone-500">
              <LinkedWords text={BEFORE_WORDS} />
            </p>
          )}

          <Button type="submit" className={cn(PRIMARY_BUTTON_CLASS, "h-auto min-h-12 whitespace-normal py-2 text-base")} disabled={busy || chosen === null}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {chosen === "CASH" ? "Je paierai en espèces" : chosen === "BANK_TRANSFER" ? "Confirmer le virement" : chosen === "ONLINE_CARD" ? "Payer par carte" : "Choisissez un mode de paiement"}
          </Button>
        </form>
      )}

      {panel.stage === "waiting" && panel.bank && <BankDetails bank={panel.bank} amountText={panel.amountText} />}

      {panel.stage === "waiting" && panel.card?.phase === "ready" && panel.card.payUrl && (
        <div className="space-y-2">
          {/* An ordinary link: it works even if the script has not run, and the page keeps which request is paid just before it opens. */}
          <a
            href={panel.card.payUrl}
            rel="noopener"
            onClick={() => keepPaymentReturn({ id, token })}
            className={cn(PRIMARY_BUTTON_CLASS, "inline-flex h-auto min-h-12 w-full items-center justify-center gap-2 whitespace-normal rounded-md px-4 py-2 text-center text-base font-semibold")}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {PAYMENT_WORDS.cardGoToProvider}
          </a>
          <p className="text-xs text-stone-500">Vous payez sur la page sécurisée de notre prestataire de paiement : nous ne voyons ni ne gardons les numéros de votre carte.</p>
        </div>
      )}

      {/* The request the provider never took, or the one whose time is over: asking again starts a new one (the server looks at the old one first). */}
      {panel.stage === "waiting" && cardCanTryAgain(panel.card) && (
        <Button type="button" className={cn(PRIMARY_BUTTON_CLASS, "h-auto min-h-12 whitespace-normal py-2 text-base")} disabled={busy} onClick={() => void request("ONLINE_CARD", "")}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : <CreditCard className="mr-2 h-4 w-4" aria-hidden />}
          {PAYMENT_WORDS.cardTryAgain}
        </Button>
      )}

      {panel.stage === "waiting" && panel.canSendReference && (
        <form
          className="space-y-2"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void request("BANK_TRANSFER", reference);
          }}
        >
          <Label htmlFor="transfer-reference-sent" className="text-sm font-semibold text-stone-700">
            {panel.open?.reference ? "Corriger la référence de l’opération" : "Référence de l’opération, donnée par votre banque"}
          </Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="transfer-reference-sent"
              value={reference}
              maxLength={PAYMENT_REFERENCE_MAX}
              onChange={(event) => {
                setReference(event.target.value);
                if (error) clear();
              }}
              placeholder={panel.open?.reference ?? "Ex : numéro de l’opération"}
              className={cn(FIELD_CLASS, "sm:flex-1")}
              autoComplete="off"
              aria-required
              aria-invalid={error && reference.trim() === "" ? true : undefined}
            />
            <Button type="submit" className={cn(PRIMARY_BUTTON_CLASS, "h-11 text-base sm:w-auto sm:px-6")} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              Envoyer
            </Button>
          </div>
          {panel.open?.reference && <p className="text-xs text-stone-500">Référence envoyée : {panel.open.reference}</p>}
        </form>
      )}

      {panel.stage === "waiting" && (
        <p className="text-xs text-stone-500">
          <LinkedWords text={WAITING_WORDS} />
        </p>
      )}

      <PaymentHistory payments={payments} />

      {error && (
        <p role="alert" className={ERROR_CLASS}>
          <LinkedWords text={error} />
        </p>
      )}
    </section>
  );
}
