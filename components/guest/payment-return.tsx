"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";

import { PRIMARY_BUTTON_CLASS } from "@/components/guest/styles";
import { send } from "@/lib/api";
import { readPaymentReturn } from "@/lib/card-payment";
import {
  RETURN_CHECKS_MAX,
  RETURN_CHECK_EVERY_MS,
  RETURN_WORDS,
  callApi,
  paymentPanel,
  paymentReturn,
  routes,
  type PaymentReturn,
  type PaymentReturnMemory,
} from "@/lib/shared";
import { cn } from "@/lib/utils";

type Phase =
  | { kind: "reading" }
  /** The browser kept nothing: another tab, another device, or a browser that keeps nothing. */
  | { kind: "lost" }
  | { kind: "checking"; checks: number }
  | { kind: "result"; result: PaymentReturn; checks: number }
  /** The customer waited as long as the page waits; the payment is not decided yet. */
  | { kind: "tooLong" };

const TONE: Record<PaymentReturn["verdict"], string> = {
  paid: "border-green-200 bg-green-50 text-green-900",
  waiting: "border-amber-200 bg-amber-50 text-amber-950",
  review: "border-sky-200 bg-sky-50 text-sky-950",
  failed: "border-red-200 bg-red-50 text-red-900",
  unknown: "border-orange-200 bg-orange-50 text-orange-950",
};

function trackingHref(memory: PaymentReturnMemory): string {
  return `/demande/status?id=${memory.id}&token=${encodeURIComponent(memory.token)}`;
}

/**
 * Where the card provider sends the customer back, whatever happened there (P2-10). The address carries nothing we trust (the provider may
 * add its own words to it): the page asks the server what became of the payment of the request it kept in this tab, and the server asks
 * the provider. A payment is "paid" on this page only when the server says so. What the tab kept stays (for a few hours at most), so that
 * a reload of this page says the same thing again instead of saying it knows nothing.
 */
export function PaymentReturnView() {
  const [phase, setPhase] = useState<Phase>({ kind: "reading" });
  const [kept, setKept] = useState<PaymentReturnMemory | null>(null);
  const memory = useRef<PaymentReturnMemory | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Changes when the page is left (or starts again): an answer that comes back after that belongs to nobody. */
  const generation = useRef(0);
  /** One question to the server at a time: the button, the timer and a restart of the page must not make two chains of checks. */
  const asking = useRef(false);

  const check = useCallback(async (checks: number) => {
    const kept = memory.current;

    if (!kept || asking.current) return;

    const mine = generation.current;

    asking.current = true;

    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    setPhase((now) => (now.kind === "result" ? now : { kind: "checking", checks }));

    let result: PaymentReturn;

    try {
      let options;

      try {
        options = await callApi(send, routes.guest.checkPayment(kept.id, kept.token));
      } catch {
        // The check is a nudge: when it fails (too many asks from this address, the provider's side is down) the options are read as
        // usual, and say what the server knows (the provider's webhook may have settled the payment already). Same as the tracking page.
        options = await callApi(send, routes.guest.paymentOptions(kept.id, kept.token));
      }

      result = paymentReturn(paymentPanel(options));
    } catch {
      result = paymentReturn(null);
    }

    if (mine !== generation.current) return;

    asking.current = false;

    const done = checks + 1;

    if (result.again && done >= RETURN_CHECKS_MAX) {
      setPhase({ kind: "tooLong" });

      return;
    }

    setPhase({ kind: "result", result, checks: done });

    // A payment that waits is asked about again. So is a check that could not be made (the phone may still be finding its network after
    // the bank's application), a few times; then the button is left to the customer.
    if (result.again || (result.verdict === "unknown" && done < RETURN_CHECKS_MAX)) timer.current = setTimeout(() => void check(done), RETURN_CHECK_EVERY_MS);
  }, []);

  useEffect(() => {
    memory.current = readPaymentReturn();
    setKept(memory.current);

    if (!memory.current) {
      setPhase({ kind: "lost" });
    } else {
      void check(0);
    }

    return () => {
      generation.current += 1;
      asking.current = false;

      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [check]);

  const settled = phase.kind === "result" && phase.result.verdict !== "waiting" && phase.result.verdict !== "unknown";

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <section className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm" aria-labelledby="return-title">
        <div className="flex items-center gap-2">
          {phase.kind === "result" && phase.result.verdict === "paid" ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden />
          ) : phase.kind === "result" && phase.result.verdict === "failed" ? (
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden />
          ) : phase.kind === "result" && phase.result.verdict === "review" ? (
            <ShieldCheck className="h-6 w-6 text-sky-600" aria-hidden />
          ) : phase.kind === "reading" || phase.kind === "checking" ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#B69121]" aria-hidden />
          ) : (
            <Clock className="h-6 w-6 text-orange-500" aria-hidden />
          )}
          <h1 id="return-title" className="text-xl font-bold text-blue-950">
            {phase.kind === "result" && phase.result.verdict === "paid"
              ? "Paiement reçu"
              : phase.kind === "result" && phase.result.verdict === "failed"
                ? "Paiement non confirmé"
                : "Votre paiement par carte"}
          </h1>
        </div>

        {/* Always on the page, so that a screen reader says what is put in it. */}
        <div role="status" aria-live="polite" className="space-y-3">
          {(phase.kind === "reading" || phase.kind === "checking") && <p className="text-sm text-stone-700">Nous vérifions votre paiement…</p>}

          {phase.kind === "result" && <p className={cn("rounded-lg border p-3 text-sm font-medium", TONE[phase.result.verdict])}>{phase.result.words}</p>}

          {phase.kind === "tooLong" && <p className={cn("rounded-lg border p-3 text-sm font-medium", TONE.waiting)}>{RETURN_WORDS.tooLong}</p>}

          {phase.kind === "lost" && <p className={cn("rounded-lg border p-3 text-sm font-medium", TONE.review)}>{RETURN_WORDS.lost}</p>}
        </div>

        {phase.kind === "result" && phase.result.verdict === "unknown" && kept && (
          <button
            type="button"
            onClick={() => void check(phase.checks)}
            className="h-10 rounded-md border border-stone-300 bg-white px-4 font-semibold text-stone-800 hover:border-[#D4AF37] hover:text-[#B69121]"
          >
            Réessayer maintenant
          </button>
        )}

        {kept && (phase.kind === "result" || phase.kind === "tooLong") && (
          <Link href={trackingHref(kept)} className={cn(PRIMARY_BUTTON_CLASS, "inline-flex h-auto min-h-12 w-full items-center justify-center rounded-md px-4 py-2 text-center text-base font-semibold")}>
            {settled ? "Retour au suivi de ma demande" : "Suivre ma demande"}
          </Link>
        )}

        {phase.kind === "lost" && (
          <Link href="/demande" className="inline-block text-sm font-semibold text-[#B69121] underline">
            Mes demandes
          </Link>
        )}
      </section>
    </div>
  );
}
