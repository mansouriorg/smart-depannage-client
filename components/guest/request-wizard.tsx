"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Flame,
  Hammer,
  HelpCircle,
  Key,
  Loader2,
  LocateFixed,
  MapPin,
  Send,
  Snowflake,
  Square,
  Wrench,
  Zap,
} from "lucide-react";

import { Ltr } from "@/components/ltr";
import { PhotoPicker } from "@/components/guest/photo-picker";
import {
  ERROR_CLASS,
  FIELD_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  SECTION_LABEL_CLASS,
  TEXTAREA_CLASS,
} from "@/components/guest/styles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SLOT, SlotText } from "@/components/slot-text";
import { Textarea } from "@/components/ui/textarea";
import { send, sendCreate, sendSlow } from "@/lib/api";
import { BotCheckUnavailable } from "@/lib/bot-check-session";
import { failureOf, type Failure } from "@/lib/guest-errors";
import { rememberRequest, trackingPath } from "@/lib/saved-requests";
import { uploadPhotos } from "@/lib/upload-photos";
import {
  EMPTY_GUEST_FORM,
  GUEST_LIMITS,
  GUEST_STEPS,
  TRADE_CODES,
  buildGuestRequest,
  callApi,
  categoryOfTrade,
  coordinatesOf,
  durationText,
  firstStepWithProblem,
  isolateFor,
  normalizePhone,
  priceText,
  routes,
  stepProblems,
  tradeService,
  withTrade,
  type FieldProblems,
  type GuestRequestForm,
  type GuestStep,
  type PublicCategory,
  type TradeCode,
} from "@/lib/shared";
import { useAppLocale, useLatest, useOnLanguageChange } from "@/lib/use-app-locale";
import { typedDir } from "@/lib/text-direction";
import { useBotCheck } from "@/lib/use-bot-check";
import { cn } from "@/lib/utils";

// Un pictogramme par métier; `Record<TradeCode, …>` : un métier ajouté au serveur arrête la compilation ici (P1-10).
const TRADE_ICONS: Record<TradeCode, typeof Wrench> = {
  PLOMBIER: Wrench,
  ELECTRICIEN: Zap,
  SERRURIER: Key,
  MENUISIER: Hammer,
  CHAUFFAGISTE: Flame,
  VITRIER: Square,
  CLIMATICIEN: Snowflake,
  AUTRE: HelpCircle,
};

/** An example of a number with another country code (written in full), shown in the help under the phone field. */
const FOREIGN_PHONE_EXAMPLE = "+33\u00a06\u00a012\u00a034\u00a056\u00a078"; // no-break spaces: the number must not be cut between two lines

/** The field to put the cursor in for each field a step can complain about. */
const FIELD_IDS: Record<keyof GuestRequestForm, string> = {
  serviceType: "trade-group",
  subServiceId: "trade-group",
  description: "guest-description",
  photoCount: "guest-photos",
  address: "guest-address",
  accessInstructions: "guest-access",
  latitude: "guest-locate",
  longitude: "guest-locate",
  contactName: "guest-name",
  contactPhone: "guest-phone",
  contactEmail: "guest-email",
};

type Phase = "idle" | "checking" | "sending" | "photos";

interface CreatedRequest {
  id: number;
  token: string;
  phone: string;
  /** What the request is about: the words are chosen when they are shown, in the language of the page at that moment. */
  trade: TradeCode | null;
  photosSent: number;
  /** Pictures that did not go (the connection dropped): they can be sent again from here. */
  photosPending: File[];
  /** The server's reasons for the pictures it refused, in the language of the call that was made: they are let go on a language change. */
  photosRefused: string[];
  /** Pictures refused whose reasons are gone (the language changed since): only their number is said, in the new language. */
  photosRefusedCount: number;
}

/** What the position button said: the words are chosen when they are shown, in the language of the page at that moment. */
type LocationNote =
  | { kind: "ok"; code: "saved"; meters: number }
  | { kind: "error"; code: "unsupported" | "unusable" | "denied" | "timeout" | "unavailable" }
  | null;

function focusField(problems: FieldProblems) {
  const first = (Object.keys(problems) as Array<keyof GuestRequestForm>)[0];

  if (!first) return;

  // After the step has been drawn.
  requestAnimationFrame(() => document.getElementById(FIELD_IDS[first])?.focus());
}

export function RequestWizard() {
  const t = useTranslations("website.request");
  const tc = useTranslations("common.actions");
  const tSaved = useTranslations("website.savedRequests");
  const locale = useAppLocale();
  // What the page says when an answer arrives: a request can take a minute, and the visitor may change the language meanwhile.
  const now = useLatest({ t, locale });
  const session = useBotCheck();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);
  const locatePrompt = useId();

  const [step, setStep] = useState<GuestStep>("problem");
  const [form, setForm] = useState<GuestRequestForm>(EMPTY_GUEST_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<FieldProblems>({});
  const [catalog, setCatalog] = useState<PublicCategory[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<LocationNote>(null);
  const [created, setCreated] = useState<CreatedRequest | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sentences kept in state (what a field lacks, what went wrong) are in the language they were said in: they are let go on a change.
  useOnLanguageChange(() => {
    setProblems({});
    setFailure(null);
    // The reasons the server gave for refused pictures are in the old language: only their number is kept.
    setCreated((kept) => (kept && kept.photosRefused.length > 0 ? { ...kept, photosRefused: [], photosRefusedCount: kept.photosRefusedCount + kept.photosRefused.length } : kept));
  });

  // The catalog is a help, not a condition: without it the person describes the problem and the team does the rest.
  useEffect(() => {
    let cancelled = false;

    callApi(send, routes.catalog.all())
      .then((categories) => {
        if (!cancelled) setCatalog(categories);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const category = form.serviceType ? categoryOfTrade(catalog, form.serviceType) : null;
  const subService = category?.subServices.find((item) => item.id === form.subServiceId) ?? null;
  const context = { requiresPhotos: subService?.requiresPhotos === true, locale };
  const stepTitles: Record<GuestStep, string> = { problem: t("steps.problem"), place: t("steps.place"), contact: t("steps.contact") };
  const stepIndex = GUEST_STEPS.indexOf(step);
  const busy = phase !== "idle";
  const formWith = (changes: Partial<GuestRequestForm>) => setForm((current) => ({ ...current, ...changes }));

  // A screen reader hears which step it is on after "Continuer" or "Retour"; the first draw leaves the focus where it is.
  const shownStep = useRef(step);

  useEffect(() => {
    if (shownStep.current === step) return;

    shownStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  const isDone = created !== null;

  useEffect(() => {
    if (isDone) headingRef.current?.focus();
  }, [isDone]);

  const photoForm = { ...form, photoCount: files.length };

  function goTo(next: GuestStep) {
    setProblems({});
    setFailure(null);
    setStep(next);
  }

  function onNext() {
    const found = stepProblems(step, photoForm, context);

    if (Object.keys(found).length > 0) {
      setProblems(found);
      focusField(found);

      return;
    }

    goTo(GUEST_STEPS[stepIndex + 1]);
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      setLocationNote({ kind: "error", code: "unsupported" });

      return;
    }

    setLocating(true);
    setLocationNote(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);

        const point = { latitude: Number(position.coords.latitude.toFixed(6)), longitude: Number(position.coords.longitude.toFixed(6)) };

        if (!coordinatesOf(point)) {
          setLocationNote({ kind: "error", code: "unusable" });

          return;
        }

        formWith(point);
        setProblems((current) => ({ ...current, latitude: undefined }));
        setLocationNote({ kind: "ok", code: "saved", meters: Math.max(1, Math.round(position.coords.accuracy)) });
      },
      (error) => {
        setLocating(false);
        setLocationNote({
          kind: "error",
          code: error.code === error.PERMISSION_DENIED ? "denied" : error.code === error.TIMEOUT ? "timeout" : "unavailable",
        });
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  }

  async function onSubmit() {
    if (submitting.current) return;

    const wrong = firstStepWithProblem(photoForm, context);

    if (wrong) {
      const found = stepProblems(wrong, photoForm, context);

      setStep(wrong);
      setProblems(found);
      focusField(found);

      return;
    }

    submitting.current = true;
    setFailure(null);
    setPhase("checking");

    try {
      // The check was prepared while the form was filled; this waits for what is left of the minimum delay the server asks for.
      const bot = await session.take(honeypotRef.current?.value ?? "");
      const built = buildGuestRequest(photoForm, bot, context);

      if (!built.ok) {
        setStep(built.step);
        setProblems(built.problems);
        focusField(built.problems);

        return;
      }

      setPhase("sending");

      const answer = await callApi(sendCreate, routes.guest.create(built.body));
      const token = answer.rawTrackingToken;
      const id = answer.intervention.id;
      const trade = form.serviceType || null;
      const phone = normalizePhone(form.contactPhone);

      // From here the request exists: whatever happens to the pictures, the link is kept.
      rememberRequest({ id, token, service: trade ? tradeService(trade, now.current.locale) : "", ...(trade ? { trade } : {}), savedAt: Date.now() });

      let report = { sent: 0, pending: [] as File[], refused: [] as string[] };

      if (files.length > 0) {
        setPhase("photos");

        try {
          report = await uploadPhotos(sendSlow, id, token, files, (done, total) => setProgress({ done, total }), locale);
        } catch {
          // The request exists: never show a failure that would invite sending it twice. The pictures can be sent again.
          report = { sent: 0, pending: files, refused: [] };
        }
      }

      // The reasons are in the language of the call; if the visitor changed the language while the pictures went, only their number is kept.
      const sameLanguage = now.current.locale === locale;

      setCreated({
        id,
        token,
        phone: phone.ok ? phone.display : form.contactPhone.trim(),
        trade,
        photosSent: report.sent,
        photosPending: report.pending,
        photosRefused: sameLanguage ? report.refused : [],
        photosRefusedCount: sameLanguage ? 0 : report.refused.length,
      });
    } catch (error) {
      // The words are those of the page now, not of the page when the request left.
      const { t: say, locale: language } = now.current;

      if (error instanceof BotCheckUnavailable) {
        const cause = failureOf(error.underlying, undefined, language);

        // Too many tries from this address is told as such; anything else is a connection (or a page without https).
        setFailure(
          cause.kind === "busy"
            ? cause
            : {
                kind: "network",
                message: say("errors.botUnavailable"),
              },
        );
      } else {
        setFailure(failureOf(error, say("errors.saveFailed"), language));
      }

      // A challenge is used once, whatever happened: the next try starts with a fresh one. The hidden field is emptied too:
      // nobody types in it, but a browser's autofill can, and the next try would be refused the same way.
      if (honeypotRef.current) honeypotRef.current.value = "";

      session.prepare();
    } finally {
      submitting.current = false;
      setPhase("idle");
      setProgress(null);
    }
  }

  async function retryPhotos() {
    if (!created || retrying) return;

    setRetrying(true);

    try {
      const report = await uploadPhotos(sendSlow, created.id, created.token, created.photosPending, () => undefined, locale);

      const sameLanguage = now.current.locale === locale;

      // From what is kept now, not from what was read when the button was pressed: the language may have changed since (see above).
      setCreated((kept) =>
        kept && {
          ...kept,
          photosSent: kept.photosSent + report.sent,
          photosPending: report.pending,
          photosRefused: sameLanguage ? [...kept.photosRefused, ...report.refused] : kept.photosRefused,
          photosRefusedCount: kept.photosRefusedCount + (sameLanguage ? 0 : report.refused.length),
        },
      );
    } catch {
      // Nothing changes: the pictures are still there to try again.
    } finally {
      setRetrying(false);
    }
  }

  async function copyLink() {
    if (!created) return;

    try {
      await navigator.clipboard.writeText(`${window.location.origin}${trackingPath(created)}`);
      setCopied(true);
    } catch {
      // Refused by the browser: the link is in the field above, selected when it is touched.
      setCopied(false);
    }
  }

  function startAgain() {
    setCreated(null);
    setForm(EMPTY_GUEST_FORM);
    setFiles([]);
    setProblems({});
    setFailure(null);
    setLocationNote(null);
    setCopied(false);
    setStep("problem");
    session.prepare();
  }

  // --- The request was made ---
  if (created) {
    const link = `${window.location.origin}${trackingPath(created)}`;

    return (
      <Card className="mx-auto w-full max-w-lg overflow-hidden border-[#D4AF37]/30 bg-white shadow-2xl shadow-[#D4AF37]/10">
        <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] to-[#B69121]" />
        <CardContent className="space-y-6 pb-8 pt-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#B69121]">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-blue-950" tabIndex={-1} ref={headingRef}>
              {t("done.title", { id: created.id })}
            </h2>
            <p className="mx-auto max-w-sm text-stone-600">
              <SlotText
                text={t("done.body", { service: created.trade ? tradeService(created.trade, locale).toLowerCase() : "", phone: SLOT })}
                slot={
                  <strong className="whitespace-nowrap">
                    <Ltr>{created.phone}</Ltr>
                  </strong>
                }
              />
            </p>
          </div>

          <div className="space-y-2 text-start">
            <Label htmlFor="guest-link" className="text-sm font-semibold text-stone-700">
              {t("done.linkLabel")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="guest-link"
                readOnly
                value={link}
                dir="ltr"
                onFocus={(event) => event.currentTarget.select()}
                className="h-11 min-w-0 flex-1 border-stone-200 bg-stone-50 text-start text-xs"
              />
              <Button type="button" variant="outline" className="h-11 shrink-0 gap-2" onClick={copyLink}>
                <Copy className="h-4 w-4" />
                {copied ? tc("copied") : tc("copy")}
              </Button>
            </div>
            <p className="text-xs text-stone-500">
              {t("done.linkNote", { listTitle: tSaved("title") })}
            </p>
          </div>

          {created.photosSent > 0 && (
            <p className="text-sm text-stone-600">
              {t("done.photosSent", { count: created.photosSent })}
            </p>
          )}

          {created.photosPending.length > 0 && (
            <div role="alert" className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-start text-sm text-amber-900">
              <p className="flex items-start gap-2 font-semibold">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {t("done.photosPending", { count: created.photosPending.length })}
              </p>
              <Button type="button" variant="outline" className="w-full" onClick={retryPhotos} disabled={retrying}>
                {retrying ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {t("done.retryPhotos")}
              </Button>
            </div>
          )}

          {created.photosRefusedCount > 0 && <p className="text-start text-sm text-amber-900">{t("done.photosRefusedCount", { count: created.photosRefusedCount })}</p>}

          {created.photosRefused.length > 0 && (
            <ul className="space-y-1 text-start text-sm text-amber-900">
              {created.photosRefused.map((reason, index) => (
                <li key={`${reason}-${index}`}>{reason}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Link href={trackingPath(created)} className="block">
              <span className={cn("inline-flex items-center justify-center gap-2 rounded-md", PRIMARY_BUTTON_CLASS)}>
                {t("done.track")} <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
              </span>
            </Link>
            <Button type="button" variant="outline" className={SECONDARY_BUTTON_CLASS} onClick={startAgain}>
              {t("done.again")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- The wizard ---
  return (
    <Card className="mx-auto w-full max-w-lg border-stone-200 bg-white shadow-2xl shadow-[#D4AF37]/10">
      <CardHeader className="space-y-3 rounded-t-xl border-b border-stone-100 bg-stone-50/50 pb-5">
        <CardTitle className="text-2xl font-bold text-blue-950">{t("title")}</CardTitle>
        <CardDescription className="text-base text-stone-500">{t("subtitle")}</CardDescription>

        <ol className="flex items-center gap-2 pt-1" aria-label={t("stepsLabel")}>
          {GUEST_STEPS.map((item, index) => (
            <li
              key={item}
              aria-current={item === step ? "step" : undefined}
              className={cn(
                "flex flex-1 items-center gap-2 text-xs font-semibold",
                index <= stepIndex ? "text-[#B69121]" : "text-stone-400",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px]",
                  index < stepIndex
                    ? "border-[#D4AF37] bg-[#D4AF37] text-white"
                    : index === stepIndex
                      ? "border-[#D4AF37] text-[#B69121]"
                      : "border-stone-300",
                )}
              >
                {index < stepIndex ? "✓" : index + 1}
              </span>
              <span className="hidden sm:inline">{stepTitles[item]}</span>
            </li>
          ))}
        </ol>
      </CardHeader>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          if (step === "contact") void onSubmit();
          else onNext();
        }}
      >
        <CardContent className="space-y-7 pt-7">
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-bold text-blue-950 outline-none">
            {t("heading", { current: stepIndex + 1, total: GUEST_STEPS.length, title: stepTitles[step] })}
          </h2>

          {step === "problem" && (
            <>
              <fieldset className="space-y-3">
                <legend className={SECTION_LABEL_CLASS}>{t("trade.legend")}</legend>
                <div id="trade-group" tabIndex={-1} role="radiogroup" aria-label={t("trade.legend")} className="grid grid-cols-2 gap-3 outline-none">
                  {TRADE_CODES.map((trade) => {
                    const Icon = TRADE_ICONS[trade];
                    const selected = form.serviceType === trade;

                    return (
                      <button
                        key={trade}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setForm((current) => withTrade(current, trade))}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200",
                          selected
                            ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#B69121] shadow-lg shadow-[#D4AF37]/10"
                            : "border-stone-200 bg-white text-stone-500 hover:border-[#D4AF37]/40 hover:bg-stone-50 hover:text-[#B69121]",
                        )}
                      >
                        <Icon className="mb-2 h-7 w-7" />
                        <span className="text-sm font-bold">{tradeService(trade, locale)}</span>
                      </button>
                    );
                  })}
                </div>
                {problems.serviceType && <p className={ERROR_CLASS}>{problems.serviceType}</p>}
              </fieldset>

              {category && category.subServices.length > 0 && (
                <fieldset className="space-y-3">
                  <legend className={SECTION_LABEL_CLASS}>{t("service.legend")}</legend>
                  <div role="radiogroup" aria-label={t("service.group")} className="space-y-2">
                    <SubServiceOption
                      selected={form.subServiceId === null}
                      onSelect={() => formWith({ subServiceId: null })}
                      title={t("service.unknown.title")}
                      detail={t("service.unknown.detail")}
                    />
                    {category.subServices.map((item) => (
                      <SubServiceOption
                        key={item.id}
                        selected={form.subServiceId === item.id}
                        onSelect={() => formWith({ subServiceId: item.id })}
                        title={item.name}
                        detail={[priceText(item, locale), durationText(item.estimatedDuration, locale)].filter(Boolean).join(" · ")}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-stone-500">{t("service.pricesNote")}</p>
                </fieldset>
              )}

              <div className="space-y-2">
                <Label htmlFor="guest-description" className="font-semibold text-stone-700">
                  {t("description.label")}
                </Label>
                <Textarea
                  id="guest-description"
                  value={form.description}
                  maxLength={GUEST_LIMITS.descriptionMax}
                  onChange={(event) => formWith({ description: event.target.value })}
                  aria-invalid={problems.description ? true : undefined}
                  aria-describedby="guest-description-help"
                  placeholder={t("description.placeholder")}
                  dir={typedDir(form.description)}
                  className={TEXTAREA_CLASS}
                />
                <p id="guest-description-help" className="text-end text-xs text-stone-500">
                  <Ltr>
                    {form.description.length}/{GUEST_LIMITS.descriptionMax}
                  </Ltr>
                </p>
                {problems.description && <p className={ERROR_CLASS}>{problems.description}</p>}
              </div>

              <div className="space-y-2" id="guest-photos" tabIndex={-1}>
                <Label className="font-semibold text-stone-700">
                  {context.requiresPhotos ? t("photos.labelRequired") : t("photos.labelOptional")}
                </Label>
                <PhotoPicker files={files} onChange={setFiles} disabled={busy} error={problems.photoCount} />
              </div>
            </>
          )}

          {step === "place" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="guest-address" className="font-semibold text-stone-700">
                  {t("address.label")}
                </Label>
                <Input
                  id="guest-address"
                  value={form.address}
                  maxLength={GUEST_LIMITS.addressMax}
                  autoComplete="street-address"
                  onChange={(event) => formWith({ address: event.target.value })}
                  aria-invalid={problems.address ? true : undefined}
                  placeholder={t("address.placeholder")}
                  dir={typedDir(form.address)}
                  className={FIELD_CLASS}
                />
                {problems.address && <p className={ERROR_CLASS}>{problems.address}</p>}
              </div>

              <div className="space-y-2">
                <Button
                  id="guest-locate"
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-2 border-stone-200 font-semibold hover:border-[#D4AF37] hover:text-[#B69121]"
                  onClick={locate}
                  disabled={locating}
                  aria-describedby={locatePrompt}
                >
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
                  {t("locate.button")}
                </Button>
                <p id={locatePrompt} className="text-xs text-stone-500">
                  {t("locate.help")}
                </p>

                {form.latitude !== null && form.longitude !== null && (
                  <p className="flex items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> {t("locate.attached")}
                    </span>
                    <button
                      type="button"
                      className="font-semibold underline"
                      onClick={() => {
                        formWith({ latitude: null, longitude: null });
                        setLocationNote(null);
                      }}
                    >
                      {tc("remove")}
                    </button>
                  </p>
                )}
                {locationNote && (
                  <p role="status" className={cn("text-sm", locationNote.kind === "ok" ? "text-green-800" : "text-red-600")}>
                    {t(`locate.notes.${locationNote.code}`, locationNote.code === "saved" ? { meters: locationNote.meters } : undefined)}
                  </p>
                )}
                {problems.latitude && <p className={ERROR_CLASS}>{problems.latitude}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-access" className="font-semibold text-stone-700">
                  {t("access.label")}
                </Label>
                <Textarea
                  id="guest-access"
                  value={form.accessInstructions}
                  maxLength={GUEST_LIMITS.accessMax}
                  onChange={(event) => formWith({ accessInstructions: event.target.value })}
                  placeholder={t("access.placeholder")}
                  dir={typedDir(form.accessInstructions)}
                  className={cn(TEXTAREA_CLASS, "min-h-[80px]")}
                />
                {problems.accessInstructions && <p className={ERROR_CLASS}>{problems.accessInstructions}</p>}
              </div>
            </>
          )}

          {step === "contact" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="guest-name" className="font-semibold text-stone-700">
                  {t("name.label")}
                </Label>
                <Input
                  id="guest-name"
                  value={form.contactName}
                  maxLength={GUEST_LIMITS.nameMax}
                  autoComplete="name"
                  onChange={(event) => formWith({ contactName: event.target.value })}
                  aria-invalid={problems.contactName ? true : undefined}
                  placeholder={t("name.placeholder")}
                  dir={typedDir(form.contactName)}
                  className={FIELD_CLASS}
                />
                {problems.contactName && <p className={ERROR_CLASS}>{problems.contactName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-phone" className="font-semibold text-stone-700">
                  {t("phone.label")}
                </Label>
                {/* A number is read left to right in both languages: the country code stays on the left of the digits. */}
                <div dir="ltr" className="flex gap-2">
                  <span className="flex h-11 shrink-0 items-center rounded-md border border-stone-200 bg-stone-100 px-3 text-sm font-semibold text-stone-600">
                    +216
                  </span>
                  <Input
                    id="guest-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.contactPhone}
                    onChange={(event) => formWith({ contactPhone: event.target.value })}
                    aria-invalid={problems.contactPhone ? true : undefined}
                    aria-describedby="guest-phone-help"
                    placeholder="22 123 456"
                    className={cn(FIELD_CLASS, "min-w-0 flex-1 text-start")}
                  />
                </div>
                <p id="guest-phone-help" className="text-xs text-stone-500">
                  {t("phone.help", { example: isolateFor(locale, FOREIGN_PHONE_EXAMPLE) })}
                </p>
                {problems.contactPhone && <p className={ERROR_CLASS}>{problems.contactPhone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-email" className="font-semibold text-stone-700">
                  {t("email.label")}
                </Label>
                <Input
                  id="guest-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  value={form.contactEmail}
                  maxLength={GUEST_LIMITS.emailMax}
                  onChange={(event) => formWith({ contactEmail: event.target.value })}
                  aria-invalid={problems.contactEmail ? true : undefined}
                  // An example address is typed with Latin letters in both languages (the catalogue test wants Arabic letters in every Arabic text).
                  placeholder={locale === "ar" ? "name@example.com" : "nom@exemple.com"}
                  className={cn(FIELD_CLASS, "text-start")}
                />
                {problems.contactEmail && <p className={ERROR_CLASS}>{problems.contactEmail}</p>}
              </div>

              {/* The trap for programs that fill every field: a person never sees it, so it stays empty. It is pushed off the START edge of the
                  page: a physical `left: -10000px` lies on the scrollable side of a right-to-left page and would give Arabic readers
                  a 10000 px wide page. */}
              <div aria-hidden="true" style={{ position: "absolute", insetInlineStart: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
                <label htmlFor="guest-website">{t("honeypot")}</label>
                <input id="guest-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" ref={honeypotRef} />
              </div>

              <section aria-label={t("recap.title")} className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-4 text-sm">
                <p className={SECTION_LABEL_CLASS}>{t("recap.title")}</p>
                <dl className="space-y-2">
                <Recap label={t("recap.problem")}>
                  {form.serviceType ? tradeService(form.serviceType, locale) : "—"}
                  {subService ? (
                    <>
                      {" · "}
                      <bdi>{subService.name}</bdi>
                    </>
                  ) : (
                    ""
                  )}
                </Recap>
                <Recap label={t("recap.description")}>
                  <span className="line-clamp-3 whitespace-pre-line">
                    <bdi>{form.description.trim()}</bdi>
                  </span>
                </Recap>
                <Recap label={t("recap.address")}>
                  <bdi>{form.address.trim()}</bdi>
                </Recap>
                <Recap label={t("recap.photos")}>{files.length === 0 ? t("recap.none") : String(files.length)}</Recap>
                </dl>
              </section>
            </>
          )}

          {failure && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="whitespace-pre-line">{failure.message}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pb-8 pt-2">
          {step === "contact" ? (
            <Button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="me-2 h-5 w-5 animate-spin" />
                  {progress ? t("send.photos", progress) : phase === "checking" ? t("send.checking") : t("send.sending")}
                </>
              ) : (
                <span className="flex items-center gap-2">
                  {t("send.submit")} <Send className="h-5 w-5 rtl:-scale-x-100" />
                </span>
              )}
            </Button>
          ) : (
            <Button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={busy}>
              <span className="flex items-center gap-2">
                {tc("continue")} <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
              </span>
            </Button>
          )}

          {stepIndex > 0 && (
            <Button
              type="button"
              variant="ghost"
              className="gap-2 text-stone-600"
              onClick={() => goTo(GUEST_STEPS[stepIndex - 1])}
              disabled={busy}
            >
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {tc("back")}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

function SubServiceOption({
  selected,
  onSelect,
  title,
  detail,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col items-start rounded-lg border-2 px-4 py-3 text-start transition-colors",
        selected ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-stone-200 bg-white hover:border-[#D4AF37]/40",
      )}
    >
      <span className="text-sm font-bold text-blue-950">{title}</span>
      {detail && <span className="text-xs text-stone-500">{detail}</span>}
    </button>
  );
}

function Recap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2">
      <dt className="text-stone-500">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-stone-800">{children}</dd>
    </div>
  );
}
