"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Download, Loader2 } from "lucide-react";

import { Bidi } from "@/components/ltr";
import { LinkedWords } from "@/components/guest/problem-link";
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS, TEXTAREA_CLASS } from "@/components/guest/styles";
import { useNote } from "@/components/guest/use-note";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { send } from "@/lib/api";
import { failureOf } from "@/lib/guest-errors";
import {
  QUOTE_NOTE_MAX,
  callApi,
  customerQuote,
  documentLines,
  documentTotals,
  isSameQuote,
  isolateFor,
  moneyText,
  pdfLink,
  quoteAnswerBody,
  quoteSignature,
  readQuoteNote,
  routes,
  stateHasMoved,
  validityWords,
  type CustomerQuoteStage,
  type TrackingIntervention,
  type TrackingInterventionQuote,
} from "@/lib/shared";
import type { Translate } from "@/lib/translate";
import { typedDir } from "@/lib/text-direction";
import { useAppLocale, useLatest } from "@/lib/use-app-locale";
import { cn } from "@/lib/utils";

type Action = "accept" | "refuse" | "ask" | "change";

const PANEL_CLASS = "space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm";

/** The look of the badge of each stage; its words come from the catalogue (`stageWords` below). */
const STAGE_LOOK: Record<CustomerQuoteStage, string> = {
  none: "",
  "to-answer": "border-orange-200 bg-orange-50 text-orange-900",
  expired: "border-red-200 bg-red-50 text-red-900",
  "being-changed": "border-sky-200 bg-sky-50 text-sky-900",
  accepted: "border-green-200 bg-green-50 text-green-900",
  refused: "border-red-200 bg-red-50 text-red-900",
  closed: "border-stone-200 bg-stone-50 text-stone-700",
};

interface FormWords {
  title: string;
  label: string;
  hint: string;
  required: boolean;
  confirm: string;
  placeholder: string;
}

function stageWords(t: Translate, stage: CustomerQuoteStage): string {
  switch (stage) {
    case "to-answer":
      return t("stage.toAnswer");
    case "expired":
      return t("stage.expired");
    case "being-changed":
      return t("stage.beingChanged");
    case "accepted":
      return t("stage.accepted");
    case "refused":
      return t("stage.refused");
    case "closed":
      return t("stage.closed");
    default:
      return "";
  }
}

/** The words of the form of an answer; a lapsed quote is not changed: a new one is asked for (it says no more than the customer likes). */
function formWords(t: Translate, action: Action, stage: CustomerQuoteStage): FormWords {
  switch (action) {
    case "accept":
      return {
        title: t("form.accept.title"),
        label: t("form.optionalNote"),
        hint: t("form.accept.hint"),
        required: false,
        confirm: t("form.accept.confirm"),
        placeholder: t("form.accept.placeholder"),
      };
    case "refuse":
      return {
        title: t("form.refuse.title"),
        label: t("form.refuse.label"),
        hint: t("form.refuse.hint"),
        required: false,
        confirm: t("form.refuse.confirm"),
        placeholder: t("form.refuse.placeholder"),
      };
    case "ask":
      return {
        title: t("form.ask.title"),
        label: t("form.ask.label"),
        hint: t("form.ask.hint"),
        required: true,
        confirm: t("form.ask.confirm"),
        placeholder: t("form.ask.placeholder"),
      };
    default:
      return stage === "expired"
        ? {
            title: t("form.newQuote.title"),
            label: t("form.optionalNote"),
            hint: t("form.newQuote.hint"),
            required: false,
            confirm: t("form.sendRequest"),
            placeholder: t("form.newQuote.placeholder"),
          }
        : {
            title: t("form.change.title"),
            label: t("form.change.label"),
            hint: t("form.change.hint"),
            required: true,
            confirm: t("form.sendRequest"),
            placeholder: t("form.change.placeholder"),
          };
  }
}

/** The stage in which an answer that the server refused has nothing left to say: the quote already is what the answer wanted. */
const REACHED: Partial<Record<Action, CustomerQuoteStage>> = { accept: "accepted", refuse: "refused" };

const CALL = {
  accept: routes.guest.acceptQuote,
  refuse: routes.guest.rejectQuote,
  ask: routes.guest.askQuestion,
  change: routes.guest.requestChange,
};

/**
 * The quote of the request, and what the customer does with it from the link alone: accept it, refuse it, ask a question, ask for a
 * change. Which buttons are shown is `customerQuote`'s call (the same rules as the server's); the server has the last word, and when
 * it refuses (the quote was edited, answered, cancelled...) its sentence is shown and the request is read again.
 */
export function QuotePanel({
  id,
  token,
  job,
  reads,
  onAnswered,
}: {
  id: number;
  token: string;
  job: Pick<TrackingIntervention, "status" | "quotes">;
  /** How many reads of the request finished (good or not): a message that waits for a change stops waiting after two. */
  reads: number;
  onAnswered: () => void;
}) {
  const t = useTranslations("website.quote");
  const tc = useTranslations("common.actions");
  const tp = useTranslations("website.panels.problem");
  const locale = useAppLocale();
  // What the page says when the answer arrives: the server can take a while, and the visitor may change the language meanwhile.
  const now = useLatest({ t, tp, locale });
  // The answer being written, with the quote that was on screen when it was started: it is that version that is answered.
  const [opened, setOpened] = useState<{ action: Action; quote: TrackingInterventionQuote } | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const state = customerQuote(job, new Date(), locale);
  const quote = state.quote;
  const { done, error, lasting, settling, show, clear } = useNote(quoteSignature(state), state.stage, reads);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const formTitleRef = useRef<HTMLHeadingElement>(null);

  // A form that needs words opens on its field (autoFocus); the others, whose words are optional, take the focus to their title, so that
  // the keyboard is not left on the button that went away, and the phone does not open its keyboard for words nobody asked for.
  const openedAction = opened?.action ?? null;
  const startsOnField = openedAction !== null && formWords(t, openedAction, state.stage).required;

  useEffect(() => {
    if (openedAction !== null && !startsOnField) formTitleRef.current?.focus();
  }, [openedAction, startsOnField]);

  // The quote changed (edited, sent again) while the form was open: what was written is about a quote that is not the one on screen, so
  // the form goes, and the customer is told.
  if (opened && !isSameQuote(opened.quote, state.quote)) {
    setOpened(null);

    // The server's own sentence stays when it will outlive this change (a refusal that read the quote again); any other message goes with it.
    if (!(error && lasting)) show({ kind: "error", text: t("changedMeanwhile") });
  }

  if (!quote || state.stage === "none") return null;

  const allowed: Record<Action, boolean> = { accept: state.canAccept, refuse: state.canRefuse, ask: state.canAsk, change: state.canRequestChange };
  // The form is shown only while the quote still takes its answer (it may have stopped: the job was cancelled, the quote lapsed).
  const open = opened && allowed[opened.action] ? opened.action : null;
  // A lapsed quote is not changed: a new one is asked for.
  const form = open === null ? null : formWords(t, open, state.stage);
  // The answer was sent and the page has not read its result yet: what it shows (the answers) is the state from before.
  const answers = !settling && (state.canAccept || state.canRefuse || state.canAsk || state.canRequestChange);
  const lines = documentLines(quote.items, quote.currency, locale);
  const totals = documentTotals(quote, locale);
  const validity = state.stage === "to-answer" || state.stage === "expired" || state.stage === "being-changed" ? validityWords(quote, new Date(), locale) : null;
  const pdf = pdfLink(quote.pdfUrl);
  const look = STAGE_LOOK[state.stage];
  const doneWords = (action: Action, say: typeof t, sayProblem: typeof tp): string =>
    action === "accept" ? say("done.accept") : action === "refuse" ? say("done.refuse", { block: sayProblem("title") }) : action === "ask" ? say("done.ask") : say("done.change");

  function start(next: Action) {
    if (!quote) return;

    setOpened({ action: next, quote });
    setText("");
    clear();
  }

  async function submit() {
    if (busy || !open || !opened) return;

    const read = readQuoteNote(text, form?.required ?? false, locale);

    if (!read.ok) {
      show({ kind: "error", text: read.problem });

      return;
    }

    // The version that was read when the answer was started, not the one on screen now.
    const answered = opened.quote;

    setBusy(true);
    clear();

    try {
      // A question does not change the quote, so it does not ask which version was read; the other answers do.
      const body = open === "ask" ? (read.note ? { note: read.note } : {}) : quoteAnswerBody(answered, read.note);

      await callApi(send, CALL[open](id, answered.id, token, body));
      // A question leaves the quote as it was, and so does a second request to change a quote that is already being changed: nothing
      // is expected to move, so the message goes with the first change that does.
      show({ kind: "done", text: doneWords(open, now.current.t, now.current.tp) }, { rereads: open === "accept" || open === "refuse" || (open === "change" && state.stage !== "being-changed") });
      setOpened(null);
      setText("");
      titleRef.current?.focus();
      onAnswered();
    } catch (failed) {
      const failure = failureOf(failed, now.current.t("answerFailed"), now.current.locale);
      // The quote is not what the page showed: read it again, so that the buttons and the lines are the real ones.
      const moved = failure.kind === "refused" && stateHasMoved(failure.status);

      show({ kind: "error", text: failure.message }, { rereads: moved, hideAtStage: REACHED[open] });

      if (moved) onAnswered();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={PANEL_CLASS} aria-labelledby="quote-title">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-[12rem] flex-1">
          <h2 id="quote-title" ref={titleRef} tabIndex={-1} className="font-bold text-blue-950 focus:outline-none">
            {t("title")}
          </h2>
          <p className="break-words text-sm text-stone-600" dir="auto">{quote.title}</p>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold", look)}>{stageWords(t, state.stage)}</span>
      </div>

      {quote.description && <p className="whitespace-pre-line break-words text-sm text-stone-600" dir="auto">{quote.description}</p>}

      {lines.length > 0 && (
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-100" aria-label={t("linesLabel")}>
          {lines.map((line, index) => (
            <li key={`${line.label}-${index}`} className="flex items-start justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="break-words font-semibold text-stone-800" dir="auto">{line.label}</p>
                {line.description && <p className="break-words text-xs text-stone-500" dir="auto">{line.description}</p>}
                <p className="text-xs text-stone-500">
                  <Bidi>{line.quantityText}</Bidi> × <Bidi>{line.unitText}</Bidi>
                </p>
              </div>
              <p className="shrink-0 font-semibold text-stone-800">
                <Bidi>{line.totalText}</Bidi>
              </p>
            </li>
          ))}
        </ul>
      )}

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">{t("totalExcl")}</dt>
          <dd className="font-medium text-stone-800">
            <Bidi>{totals.subtotalText}</Bidi>
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">{totals.taxLabel}</dt>
          <dd className="font-medium text-stone-800">
            <Bidi>{totals.taxText}</Bidi>
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-stone-200 pt-2 text-base">
          <dt className="font-bold text-blue-950">{t("totalIncl")}</dt>
          <dd className="font-bold text-blue-950">
            <Bidi>{totals.totalText}</Bidi>
          </dd>
        </div>
      </dl>

      {validity && <p className="text-xs text-stone-500">{validity}</p>}

      {pdf && (
        <a
          href={pdf}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#B69121] underline"
        >
          <Download className="h-4 w-4" aria-hidden /> {t("pdf")}
        </a>
      )}

      {state.stage === "being-changed" && quote.clientNote && (
        <p className="break-words rounded-lg bg-sky-50 p-3 text-sm text-sky-950">
          <span className="font-semibold">{t("yourRequest")} </span>
          <span dir="auto">{quote.clientNote}</span>
        </p>
      )}

      {state.words && !settling && (
        <p className="text-sm text-stone-700">
          <LinkedWords text={state.words} />
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

      {!open && answers && (
        <div className="space-y-2">
          {state.canAccept && (
            <Button type="button" className={cn(PRIMARY_BUTTON_CLASS, "h-auto min-h-12 whitespace-normal py-2 text-base")} onClick={() => start("accept")}>
              {t("actions.accept", { amount: isolateFor(locale, moneyText(quote.amountTTC, quote.currency, locale)) })}
            </Button>
          )}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {state.canAsk && (
              <Button type="button" variant="outline" className="h-11 whitespace-normal border-stone-200 font-semibold" onClick={() => start("ask")}>
                {t("form.ask.title")}
              </Button>
            )}
            {state.canRequestChange && (
              <Button type="button" variant="outline" className="h-11 whitespace-normal border-stone-200 font-semibold" onClick={() => start("change")}>
                {state.stage === "expired" ? t("form.newQuote.title") : t("form.change.title")}
              </Button>
            )}
            {state.canRefuse && (
              <Button type="button" variant="outline" className="h-11 whitespace-normal border-stone-200 font-semibold text-red-700 hover:text-red-800" onClick={() => start("refuse")}>
                {t("actions.refuse")}
              </Button>
            )}
          </div>
        </div>
      )}

      {open && form && (
        <form
          className="space-y-3 rounded-lg border border-stone-200 bg-stone-50/50 p-4"
          aria-labelledby="quote-form-title"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <h3 id="quote-form-title" ref={formTitleRef} tabIndex={-1} className="font-bold text-blue-950 focus:outline-none">
            {form.title}
          </h3>
          {open === "accept" && (
            <p className="text-sm font-semibold text-stone-800">{t("form.acceptAmount", { amount: isolateFor(locale, moneyText(quote.amountTTC, quote.currency, locale)) })}</p>
          )}
          <Label htmlFor="quote-note" className="text-sm font-semibold text-stone-700">
            {form.label}
          </Label>
          <Textarea
            id="quote-note"
            value={text}
            maxLength={QUOTE_NOTE_MAX}
            onChange={(event) => {
              setText(event.target.value);
              // What was said about the words that were missing is not true any more once they are being written.
              if (error) clear();
            }}
            placeholder={form.placeholder}
            dir={typedDir(text)}
            className={TEXTAREA_CLASS}
            required={form.required}
            aria-required={form.required}
            aria-invalid={error && form.required && text.trim() === "" ? true : undefined}
            aria-describedby="quote-note-hint"
            // The answers that need words open on the field; the others leave the page where it is.
            autoFocus={form.required}
          />
          <p id="quote-note-hint" className="text-xs text-stone-500">
            {form.hint}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" className={cn(PRIMARY_BUTTON_CLASS, "h-auto min-h-12 flex-1 whitespace-normal py-2 text-base")} disabled={busy}>
              {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {form.confirm}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12"
              disabled={busy}
              onClick={() => {
                setOpened(null);
                clear();
                titleRef.current?.focus();
              }}
            >
              {tc("cancel")}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className={ERROR_CLASS}>
          <LinkedWords text={error} />
        </p>
      )}
    </section>
  );
}
