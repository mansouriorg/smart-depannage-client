"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Check, Loader2, MapPin, Phone, WifiOff } from "lucide-react";

import { InvoicePanel } from "@/components/guest/invoice-panel";
import { Ltr } from "@/components/ltr";
import { PaymentHistory } from "@/components/guest/payment-history";
import { PaymentPanel } from "@/components/guest/payment-panel";
import { QuotePanel } from "@/components/guest/quote-panel";
import { AddPhotosPanel, FeedbackPanel, FeedbackThanks, ProblemPanel } from "@/components/guest/tracking-panels";
import { send } from "@/lib/api";
import { dateFormats, when } from "@/lib/dates";
import { forgetRequest, isTrackingToken, rememberRequest } from "@/lib/saved-requests";
import { TrackingPoller } from "@/lib/tracking-poller";
import {
  TRACKING_REFRESH_MS,
  callApi,
  canAddPhotos,
  cardCheckDue,
  cardPaymentOf,
  canGiveFeedback,
  hasGivenFeedback,
  isTradeCode,
  isolateFor,
  recordIdOf,
  routes,
  statusGroupOf,
  trackingProgress,
  tradeService,
  transferDetails,
  visitorStatus,
  wantsPaymentOptions,
  type Locale,
  type PaymentOptions,
  type StatusTone,
  type TrackingIntervention,
} from "@/lib/shared";
import { useAppLocale, useLatest, useOnLanguageChange } from "@/lib/use-app-locale";
import { cn } from "@/lib/utils";

const TONE_CLASS: Record<StatusTone, string> = {
  waiting: "border-amber-200 bg-amber-50 text-amber-950",
  info: "border-sky-200 bg-sky-50 text-sky-950",
  active: "border-blue-950 bg-blue-950 text-white",
  success: "border-green-200 bg-green-50 text-green-950",
  warning: "border-orange-200 bg-orange-50 text-orange-950",
  danger: "border-red-200 bg-red-50 text-red-950",
};

type Phase = "loading" | "ready" | "invalid";

/** What the request is about: the service the team chose (a text from the server), else the trade in the language of the page. */
function serviceOf(job: TrackingIntervention, locale: Locale, fallback: string): string {
  return job.subService?.name ?? (isTradeCode(job.serviceType) ? tradeService(job.serviceType, locale) : fallback);
}

/** A phone number the browser may be asked to dial: digits, spaces, "+", "-", "(", ")" only. */
function dialable(phone: string | null | undefined): string | null {
  const text = (phone ?? "").trim();

  return /^\+?[0-9 ()\-.]{6,25}$/.test(text) ? text.replace(/[ ()\-.]/g, "") : null;
}

function InvalidLink({ expired }: { expired?: boolean }) {
  const t = useTranslations("website.tracking");

  return (
    <div role="alert" className="mx-auto w-full max-w-lg rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
      <h1 className="text-xl font-bold text-blue-950">{t("invalid.title")}</h1>
      <p className="mt-2 text-stone-600">{expired ? t("invalid.expired") : t("invalid.incomplete")}</p>
      <Link href="/demande" className="mt-6 inline-block font-semibold text-[#B69121] underline">
        {t("invalid.again")}
      </Link>
    </div>
  );
}

function Tracking({ id, token }: { id: number; token: string }) {
  const t = useTranslations("website.tracking");
  const tn = useTranslations("website.nav");
  const tc = useTranslations("common.actions");
  const locale = useAppLocale();
  const formats = dateFormats(locale);
  const [phase, setPhase] = useState<Phase>("loading");
  const [job, setJob] = useState<TrackingIntervention | null>(null);
  const [failures, setFailures] = useState(0);
  const [answeredAt, setAnsweredAt] = useState<number | null>(null);
  // Reads that finished, good or not: a message under a panel that waits for the result of an action stops waiting after two of them.
  const [trackingReads, setTrackingReads] = useState(0);
  const [optionReads, setOptionReads] = useState(0);
  const [notice, setNotice] = useState("");
  const serviceFallback = t("serviceFallback");
  // What the poller writes is in the language on the page when it writes it: a change of language must not start it again (that would
  // forget what it knows of the request, and ask the server at once).
  const said = useLatest({ locale, serviceFallback });
  // How the customer may pay (P2-06): read after the request when it has an accepted quote or an invoice, and again after each action.
  const [options, setOptions] = useState<PaymentOptions | null>(null);
  const [optionsFailed, setOptionsFailed] = useState(false);
  // The rest of the page leaves the print window while the invoice is printed.
  const [printing, setPrinting] = useState(false);
  const refreshNow = useRef<() => void>(() => undefined);
  const optionsBusy = useRef(false);
  const optionsAgain = useRef(false);
  // A card payment waits (P2-10): now and then the options are read through the route that asks the provider, as a nudge for the customer
  // who has just paid. The webhook and the server's timer settle the payment without it.
  const watchingCard = useRef(false);
  const lastCardCheck = useRef<number | null>(null);

  const readOptions = useCallback(async () => {
    // A read is already on its way: ask for one more when it ends, because what it brings may have been written before the action
    // that makes this one necessary.
    if (optionsBusy.current) {
      optionsAgain.current = true;

      return;
    }

    optionsBusy.current = true;

    try {
      do {
        optionsAgain.current = false;

        try {
          const asking = cardCheckDue(watchingCard.current, lastCardCheck.current, Date.now());
          let read: PaymentOptions;

          if (asking) {
            lastCardCheck.current = Date.now();

            try {
              read = await callApi(send, routes.guest.checkPayment(id, token));
            } catch {
              // The check is a nudge: when it fails (too many asks, the provider's side is down) the options are read as usual.
              read = await callApi(send, routes.guest.paymentOptions(id, token));
            }
          } else {
            read = await callApi(send, routes.guest.paymentOptions(id, token));
          }

          watchingCard.current = cardPaymentOf(read.open)?.watch === true;
          setOptions(read);
          setOptionsFailed(false);
        } catch {
          // The last answer stays: a failed read does not blank a block the customer was using. Only a page that never had one says so.
          setOptionsFailed(true);
        }

        setOptionReads((count) => count + 1);
      } while (optionsAgain.current);
    } finally {
      optionsBusy.current = false;
    }
  }, [id, token]);

  useEffect(() => {
    let remembered = false;

    const poller = new TrackingPoller({
      load: () => callApi(send, routes.guest.track(id, token)),
      locale: () => said.current.locale,
      now: () => Date.now(),
      isHidden: () => document.hidden,
      setTimer: (run, ms) => setTimeout(run, ms),
      clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      onAnswer: (data, announcement) => {
        // Nothing is announced for the first answer (the page is simply opening), only for a change.
        if (announcement) setNotice(announcement);

        setJob(data);
        setPhase("ready");
        setFailures(0);
        setAnsweredAt(Date.now());
        setTrackingReads((count) => count + 1);

        if (wantsPaymentOptions(data)) void readOptions();
        else setOptions(null);

        if (!remembered) {
          remembered = true;
          rememberRequest({
            id,
            token,
            service: serviceOf(data, said.current.locale, said.current.serviceFallback),
            ...(!data.subService && isTradeCode(data.serviceType) ? { trade: data.serviceType } : {}),
            savedAt: Date.now(),
          });
        }
      },
      onFailure: (count) => {
        setFailures(count);
        setTrackingReads((reads) => reads + 1);
      },
      onInvalid: () => {
        // Nothing to keep for a link the server does not know.
        forgetRequest(id);
        setPhase("invalid");
      },
    });

    const onVisibility = () => poller.visibilityChanged();
    const onOnline = () => void poller.refresh();

    refreshNow.current = () => void poller.refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    poller.start();

    return () => {
      poller.stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [id, token, readOptions, said]);

  // The sentences the server wrote for the page (the timeline, the reason a way of paying is not offered) are in the language of the
  // call that read them: one new read, in the new language, and the poller goes on as it was.
  useOnLanguageChange(() => {
    setNotice(""); // the sentence read aloud for a change of status is in the old language
    refreshNow.current();
    void readOptions();
  });

  // After an answer to the quote or a payment request: the request and the options are read again at once.
  const onActed = useCallback(() => {
    refreshNow.current();
    void readOptions();
  }, [readOptions]);

  const onSaved = useCallback((updated: TrackingIntervention | null) => {
    // The answer to an opinion is the request as the server rebuilt it from a bare row (no technician, no quotes, no timeline):
    // only what the opinion changed is taken from it, and the whole request is asked for again.
    if (updated) {
      setJob((previous) =>
        previous
          ? { ...previous, rating: updated.rating, isOnTime: updated.isOnTime, hasIssue: updated.hasIssue, feedbackNotes: updated.feedbackNotes, review: updated.review }
          : previous,
      );
    }

    refreshNow.current();
  }, []);

  if (phase === "invalid") return <InvalidLink expired />;

  if (phase === "loading" || !job) {
    return (
      <div className="mx-auto w-full max-w-lg space-y-4 rounded-xl border border-stone-200 bg-white p-10 text-center text-stone-600">
        <p role="status" className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" /> {t("loading.text")}
        </p>
        {failures >= 1 && (
          <div role="alert" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="flex items-start justify-center gap-2">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
              {t("loading.difficult")}
            </p>
            <button
              type="button"
              onClick={() => refreshNow.current()}
              className="h-10 rounded-md border border-amber-400 bg-white px-4 font-semibold text-amber-900 hover:bg-amber-100"
            >
              {tn("retryNow")}
            </button>
          </div>
        )}
      </div>
    );
  }

  const words = visitorStatus(job.status, locale);
  const group = statusGroupOf(job.status);
  const { steps, halted } = trackingProgress(job.status, locale);
  const artisanPhone = dialable(job.artisan?.phone);
  const showArtisan = group === "active" && Boolean(job.artisan?.name);
  const created = when(job.createdAt, formats.dayAndTime);
  const changed = when(job.lastStatusChangedAt, formats.dayAndTime);
  const photoCount = job.photos?.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 print:max-w-none">
      {/* The groups are laid out as if they were not there (`contents`); only the print window leaves them out, with the invoice. */}
      <div className={cn("contents", printing && "print:hidden")}>
      {failures >= 2 && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          {answeredAt ? t("unstable.withTime", { time: isolateFor(locale, formats.time.format(answeredAt)) }) : t("unstable.noTime")}
        </p>
      )}

      <header className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] to-[#B69121]" />
        <div className="space-y-1 p-5">
          <h1 className="text-2xl font-bold text-blue-950">{t("header.title", { id: job.id })}</h1>
          <p className="font-medium text-stone-700" dir="auto">{serviceOf(job, locale, serviceFallback)}</p>
          <p className="flex items-start gap-1.5 text-sm text-stone-500">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words" dir="auto">{job.address}</span>
          </p>
          {created && <p className="text-xs text-stone-500">{t("header.requestedOn", { date: isolateFor(locale, created) })}</p>}
        </div>
      </header>

      <section className={cn("rounded-xl border p-5", TONE_CLASS[words.tone])} aria-labelledby="status-title">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">{t("status.label")}</p>
        <h2 id="status-title" className="mt-1 text-xl font-bold">
          {words.title}
        </h2>
        <p className="mt-1 text-sm opacity-90">{words.message}</p>
        {halted === "cancelled" && job.cancelledReason && <p className="mt-3 text-sm font-medium" dir="auto">{t("status.reason", { reason: isolateFor(locale, job.cancelledReason) })}</p>}
        {changed && <p className="mt-3 text-xs opacity-70">{t("status.changedAt", { date: isolateFor(locale, changed) })}</p>}
      </section>

      {/* Read out by a screen reader when the status changes, never on the first draw. */}
      <p className="sr-only" aria-live="polite" role="status">
        {notice}
      </p>

      {!halted && (
        <ol className="grid grid-cols-5 gap-1" aria-label={t("progress.label")}>
          {steps.map((step, index) => (
            <li key={step.label} aria-current={step.state === "current" ? "step" : undefined} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold",
                  step.state === "done" && "border-[#D4AF37] bg-[#D4AF37] text-white",
                  step.state === "current" && "border-[#D4AF37] bg-white text-[#B69121] ring-4 ring-[#D4AF37]/20",
                  step.state === "todo" && "border-stone-300 bg-white text-stone-400",
                )}
              >
                {step.state === "done" ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={cn("text-[11px] leading-tight", step.state === "todo" ? "text-stone-400" : "font-semibold text-stone-700")}>
                {step.label}
                <span className="sr-only">
                  {" "}
                  {step.state === "done" ? t("progress.done") : step.state === "current" ? t("progress.current") : t("progress.todo")}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <QuotePanel id={id} token={token} job={job} reads={trackingReads} onAnswered={onActed} />

      {showArtisan && (
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="artisan-title">
          <h2 id="artisan-title" className="text-xs font-bold uppercase tracking-wider text-[#B69121]">
            {t("artisan.title")}
          </h2>
          <p className="mt-1 text-xl font-bold text-blue-950" dir="auto">{job.artisan?.name}</p>
          {artisanPhone && (
            <a
              href={`tel:${artisanPhone}`}
              className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg border border-stone-200 px-4 font-semibold text-blue-950 hover:border-[#D4AF37] hover:text-[#B69121]"
            >
              <Phone className="h-4 w-4" /> <Ltr>{job.artisan?.phone}</Ltr>
            </a>
          )}
        </section>
      )}

      {wantsPaymentOptions(job) && options && <PaymentPanel id={id} token={token} options={options} payments={job.payments} reads={optionReads} onChanged={onActed} />}
      {/* A request cancelled after a payment was asked for has no payment block: what was recorded is still told. */}
      {!wantsPaymentOptions(job) && <PaymentHistory payments={job.payments} framed />}
      {wantsPaymentOptions(job) && !options && (
        <section className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm" aria-label={t("payment.label")}>
          {optionsFailed ? (
            <div role="alert" className="space-y-3">
              <p>{t("payment.loadFailed")}</p>
              <button
                type="button"
                onClick={() => void readOptions()}
                className="h-10 rounded-md border border-stone-300 bg-white px-4 font-semibold text-stone-800 hover:border-[#D4AF37] hover:text-[#B69121]"
              >
                {tc("retry")}
              </button>
            </div>
          ) : (
            <p role="status" className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {t("payment.loading")}
            </p>
          )}
        </section>
      )}
      </div>

      <InvoicePanel id={id} token={token} invoice={job.invoice} bank={transferDetails(options)} onPrinting={setPrinting} />

      <div className={cn("contents", printing && "print:hidden")}>
      {photoCount > 0 && (
        <p className="text-sm text-stone-500">{t("photos", { count: photoCount })}</p>
      )}

      {canGiveFeedback(job) && <FeedbackPanel id={id} token={token} onSaved={onSaved} />}
      {group === "completed" && hasGivenFeedback(job) && <FeedbackThanks rating={job.review?.rating ?? job.rating ?? null} />}
      {canAddPhotos(job) && <AddPhotosPanel id={id} token={token} held={photoCount} onSent={() => refreshNow.current()} />}
      <ProblemPanel id={id} token={token} status={job.status} />

      <footer className="space-y-1 text-center text-xs text-stone-500">
        <p>
          {t("footer.refresh", { seconds: TRACKING_REFRESH_MS / 1000 })}
          {answeredAt ? ` ${t("footer.lastUpdate", { time: isolateFor(locale, formats.time.format(answeredAt)) })}` : ""}
        </p>
        <p>
          <Link href="/demande" className="font-semibold text-[#B69121] underline">
            {tn("myRequests")}
          </Link>
        </p>
      </footer>
      </div>
    </div>
  );
}

function FromAddress() {
  const params = useSearchParams();
  const id = recordIdOf(params.get("id"));
  const token = params.get("token");

  if (id === null || !isTrackingToken(token)) return <InvalidLink />;

  // One page per link: going from one link to another (back, forward) starts from nothing, not from the previous request.
  return <Tracking key={`${id}:${token}`} id={id} token={token} />;
}

export function TrackingView() {
  const tc = useTranslations("common.states");

  // useSearchParams needs a Suspense boundary in a statically rendered page.
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-lg items-center justify-center gap-3 p-10 text-stone-600" role="status">
          <Loader2 className="h-5 w-5 animate-spin" /> {tc("loading")}
        </div>
      }
    >
      <FromAddress />
    </Suspense>
  );
}
