"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Send, Star } from "lucide-react";

import { PhotoPicker } from "@/components/guest/photo-picker";
import { ERROR_CLASS, PRIMARY_BUTTON_CLASS, TEXTAREA_CLASS } from "@/components/guest/styles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { send, sendSlow } from "@/lib/api";
import { failureOf } from "@/lib/guest-errors";
import { LATE_REPORT_TEXT } from "@/lib/staff-text";
import { uploadPhotos } from "@/lib/upload-photos";
import {
  GUEST_LIMITS,
  callApi,
  feedbackProblem,
  problemReportProblem,
  routes,
  visitorMayReportIssue,
  type TrackingIntervention,
} from "@/lib/shared";
import { useAppLocale, useLatest, useOnLanguageChange } from "@/lib/use-app-locale";
import { cn } from "@/lib/utils";
import { typedDir } from "@/lib/text-direction";

interface PanelProps {
  id: number;
  token: string;
}

const PANEL_CLASS = "space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm";

// ---------------------------------------------------------------------------
// Pictures added after the request was made
// ---------------------------------------------------------------------------

export function AddPhotosPanel({ id, token, held, onSent }: PanelProps & { held: number; onSent: () => void }) {
  const t = useTranslations("website.panels.addPhotos");
  const tr = useTranslations("website.request");
  const locale = useAppLocale();
  // What the page says when the answer arrives: sending pictures can take a while, and the visitor may change the language meanwhile.
  const now = useLatest({ t, tr, locale });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useOnLanguageChange(() => setMessage(null));

  async function sendFiles() {
    if (busy || files.length === 0) return;

    setBusy(true);
    setMessage(null);

    try {
      const report = await uploadPhotos(sendSlow, id, token, files, () => undefined, locale);

      const { t: say, tr: sayRequest, locale: language } = now.current;

      // What did not go stays in the picker to be sent again; what went is on the request now. The server's reasons are in the language of
      // the call: if the visitor changed the language meanwhile, only the number of refused pictures is said, in the new one.
      setFiles(report.pending);
      setMessage(
        report.pending.length > 0
          ? { ok: false, text: say("partial") }
          : report.refused.length > 0
            ? { ok: false, text: language === locale ? report.refused.join(" ") : sayRequest("done.photosRefusedCount", { count: report.refused.length }) }
            : { ok: true, text: say("success") },
      );

      if (report.sent > 0) onSent();
    } catch {
      setMessage({ ok: false, text: now.current.t("failed") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={PANEL_CLASS} aria-labelledby="add-photos-title">
      <h2 id="add-photos-title" className="font-bold text-blue-950">
        {t("title")}
      </h2>
      <p className="text-sm text-stone-600">{t("text")}</p>
      <PhotoPicker files={files} onChange={setFiles} alreadyHeld={held} disabled={busy} />
      {message && (
        <p role="status" className={cn("text-sm font-medium", message.ok ? "text-green-700" : "text-red-600")}>
          {message.text}
        </p>
      )}
      {files.length > 0 && (
        <Button type="button" className={cn(PRIMARY_BUTTON_CLASS, "h-12 text-base")} onClick={sendFiles} disabled={busy}>
          {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
          {t("send", { count: files.length })}
        </Button>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// The opinion on a finished job: kept as a review that waits for the team
// ---------------------------------------------------------------------------

export function FeedbackPanel({ id, token, onSaved }: PanelProps & { onSaved: (job: TrackingIntervention | null) => void }) {
  const t = useTranslations("website.panels.feedback");
  const tc = useTranslations("common");
  const locale = useAppLocale();
  const now = useLatest({ t, locale });
  const [rating, setRating] = useState(0);
  const [onTime, setOnTime] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useOnLanguageChange(() => setError(null));

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    if (busy) return;

    const body = { rating, ...(onTime === null ? {} : { isOnTime: onTime }), ...(notes.trim() ? { feedbackNotes: notes.trim() } : {}) };
    const problem = feedbackProblem(body, locale);

    if (problem) {
      setError(problem);

      return;
    }

    setBusy(true);
    setError(null);

    try {
      onSaved(await callApi(send, routes.guest.feedback(id, token, body)));
    } catch (failed) {
      const failure = failureOf(failed, now.current.t("failed"), now.current.locale);

      // An opinion was already given (another tab, an earlier try whose answer was lost): the page shows it.
      if (failure.kind === "refused" && failure.status === 409) onSaved(null);
      else setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className={PANEL_CLASS} aria-labelledby="feedback-title" noValidate>
      <h2 id="feedback-title" className="font-bold text-blue-950">
        {t("title")}
      </h2>

      <div role="radiogroup" aria-label={t("ratingLabel")} className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={t("star", { value })}
            onClick={() => setRating(value)}
            className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            <Star className={cn("h-9 w-9 stroke-[1.5px]", rating >= value ? "fill-[#D4AF37] text-[#D4AF37]" : "fill-stone-50 text-stone-300")} />
          </button>
        ))}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-stone-700">{t("onTime")}</legend>
        <div className="flex gap-3">
          {([true, false] as const).map((value) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={onTime === value}
              onClick={() => setOnTime(onTime === value ? null : value)}
              className={cn(
                "flex-1 rounded-xl border-2 py-2 text-sm font-bold transition-colors",
                onTime === value
                  ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#B69121]"
                  : "border-stone-200 bg-stone-50 text-stone-500 hover:border-[#D4AF37]/40",
              )}
            >
              {value ? tc("answers.yes") : tc("answers.no")}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="feedback-notes" className="text-sm font-semibold text-stone-700">
          {t("commentLabel")}
        </Label>
        <Textarea
          id="feedback-notes"
          value={notes}
          maxLength={GUEST_LIMITS.feedbackMax}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t("placeholder")}
          dir={typedDir(notes)}
          className={TEXTAREA_CLASS}
        />
        <p className="text-xs text-stone-500">{t("note")}</p>
      </div>

      {error && (
        <p role="alert" className={ERROR_CLASS}>
          {error}
        </p>
      )}

      <Button type="submit" className={cn(PRIMARY_BUTTON_CLASS, "h-12 text-base")} disabled={busy}>
        {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Send className="me-2 h-4 w-4 rtl:-scale-x-100" />}
        {t("submit")}
      </Button>
    </form>
  );
}

export function FeedbackThanks({ rating }: { rating: number | null }) {
  const t = useTranslations("website.panels.thanks");

  return (
    <section className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-6 text-center">
      <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[#D4AF37]" />
      <h2 className="text-lg font-bold text-blue-950">{t("title")}</h2>
      {rating ? (
        <p className="mt-1 flex items-center justify-center gap-1" aria-label={t("rating", { rating })}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Star key={value} className={cn("h-5 w-5", rating >= value ? "fill-[#D4AF37] text-[#D4AF37]" : "text-stone-300")} />
          ))}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-stone-600">{t("note")}</p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// A problem: it opens a complaint that the support team reads
// ---------------------------------------------------------------------------

export function ProblemPanel({ id, token, status }: PanelProps & { status: string }) {
  const t = useTranslations("website.panels.problem");
  const tc = useTranslations("common.actions");
  const locale = useAppLocale();
  const now = useLatest({ t, locale });
  const [open, setOpen] = useState(false);
  // One tap on "en retard" opens a complaint for the support team and uses one of the few reports a request may make: it is asked twice.
  const [confirmLate, setConfirmLate] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  // The confirmation stays (the report was sent) but is said again in the new language; the server's own sentence is in the old one.
  useOnLanguageChange(() => {
    setError(null);
    setSentMessage((current) => (current === null ? null : t("sent")));
  });

  async function report(description: string) {
    if (busy) return;

    const problem = problemReportProblem(description, locale);

    if (problem) {
      setError(problem);

      return;
    }

    setBusy(true);
    setError(null);

    try {
      await callApi(send, routes.guest.problem(id, token, { description: description.trim() }));

      // The server's confirmation is a French sentence (only its refusals are translated), so the page says it in its own words, in the
      // language on the page when the answer arrives. The words are the same as the server's in French.
      setSentMessage(now.current.t("sent"));
      setText("");
      setOpen(false);
      setConfirmLate(false);
    } catch (failed) {
      setError(failureOf(failed, now.current.t("failed"), now.current.locale).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={PANEL_CLASS} aria-labelledby="problem-title">
      <h2 id="problem-title" tabIndex={-1} className="font-bold text-blue-950 focus:outline-none">
        {t("title")}
      </h2>

      {sentMessage && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {sentMessage}
        </p>
      )}

      {!open && confirmLate ? (
        <div className="space-y-3" role="group" aria-label={t("lateGroup")}>
          <p className="text-sm text-stone-700">{t("lateAsk")}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              className={cn(PRIMARY_BUTTON_CLASS, "h-11 flex-1 text-base")}
              disabled={busy}
              onClick={() => void report(LATE_REPORT_TEXT)}
            >
              {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {t("lateYes")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              disabled={busy}
              onClick={() => {
                setConfirmLate(false);
                setError(null);
              }}
            >
              {tc("cancel")}
            </Button>
          </div>
        </div>
      ) : !open ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {visitorMayReportIssue(status) && (
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 gap-2 border-stone-200 font-semibold"
              disabled={busy}
              onClick={() => {
                setSentMessage(null);
                setConfirmLate(true);
              }}
            >
              <Clock className="h-4 w-4" /> {t("late")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 gap-2 border-stone-200 font-semibold"
            disabled={busy}
            onClick={() => {
              setSentMessage(null);
              setOpen(true);
            }}
          >
            <AlertTriangle className="h-4 w-4" /> {t("other")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Label htmlFor="problem-text" className="text-sm font-semibold text-stone-700">
            {t("whatHappened")}
          </Label>
          <Textarea
            id="problem-text"
            value={text}
            maxLength={GUEST_LIMITS.problemMax}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("placeholder")}
            dir={typedDir(text)}
            className={TEXTAREA_CLASS}
          />
          <div className="flex gap-2">
            <Button type="button" className={cn(PRIMARY_BUTTON_CLASS, "h-11 flex-1 text-base")} disabled={busy} onClick={() => void report(text)}>
              {busy ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
              {tc("send")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              {tc("cancel")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className={ERROR_CLASS}>
          {error}
        </p>
      )}
    </section>
  );
}
