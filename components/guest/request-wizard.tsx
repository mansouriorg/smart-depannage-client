"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
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
  TRADES,
  TRADE_CODES,
  buildGuestRequest,
  callApi,
  categoryOfTrade,
  coordinatesOf,
  durationText,
  firstStepWithProblem,
  normalizePhone,
  priceText,
  routes,
  stepProblems,
  withTrade,
  type FieldProblems,
  type GuestRequestForm,
  type GuestStep,
  type PublicCategory,
  type TradeCode,
} from "@/lib/shared";
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

const STEP_TITLES: Record<GuestStep, string> = {
  problem: "Le problème",
  place: "Le lieu",
  contact: "Vos coordonnées",
};

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
  service: string;
  photosSent: number;
  /** Pictures that did not go (the connection dropped): they can be sent again from here. */
  photosPending: File[];
  photosRefused: string[];
}

type LocationNote = { kind: "ok" | "error"; text: string } | null;

function focusField(problems: FieldProblems) {
  const first = (Object.keys(problems) as Array<keyof GuestRequestForm>)[0];

  if (!first) return;

  // After the step has been drawn.
  requestAnimationFrame(() => document.getElementById(FIELD_IDS[first])?.focus());
}

export function RequestWizard() {
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
  const [progress, setProgress] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState<LocationNote>(null);
  const [created, setCreated] = useState<CreatedRequest | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [copied, setCopied] = useState(false);

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
  const context = { requiresPhotos: subService?.requiresPhotos === true };
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
      setLocationNote({ kind: "error", text: "Ce navigateur ne peut pas donner votre position. Écrivez l’adresse." });

      return;
    }

    setLocating(true);
    setLocationNote(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);

        const point = { latitude: Number(position.coords.latitude.toFixed(6)), longitude: Number(position.coords.longitude.toFixed(6)) };

        if (!coordinatesOf(point)) {
          setLocationNote({ kind: "error", text: "La position reçue n’est pas utilisable. Écrivez l’adresse." });

          return;
        }

        formWith(point);
        setProblems((current) => ({ ...current, latitude: undefined }));
        setLocationNote({
          kind: "ok",
          text: `Position enregistrée (à ${Math.max(1, Math.round(position.coords.accuracy))} m près). Écrivez tout de même l’adresse.`,
        });
      },
      (error) => {
        setLocating(false);
        setLocationNote({
          kind: "error",
          text:
            error.code === error.PERMISSION_DENIED
              ? "La position est refusée par ce navigateur. Écrivez l’adresse."
              : error.code === error.TIMEOUT
                ? "La position n’a pas pu être trouvée à temps. Réessayez ou écrivez l’adresse."
                : "La position n’est pas disponible. Écrivez l’adresse.",
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
      const service = form.serviceType ? TRADES[form.serviceType].service : "";
      const phone = normalizePhone(form.contactPhone);

      // From here the request exists: whatever happens to the pictures, the link is kept.
      rememberRequest({ id, token, service, savedAt: Date.now() });

      let report = { sent: 0, pending: [] as File[], refused: [] as string[] };

      if (files.length > 0) {
        setPhase("photos");

        try {
          report = await uploadPhotos(sendSlow, id, token, files, (done, total) => setProgress(`Envoi des photos (${done}/${total})…`));
        } catch {
          // The request exists: never show a failure that would invite sending it twice. The pictures can be sent again.
          report = { sent: 0, pending: files, refused: [] };
        }
      }

      setCreated({
        id,
        token,
        phone: phone.ok ? phone.display : form.contactPhone.trim(),
        service,
        photosSent: report.sent,
        photosPending: report.pending,
        photosRefused: report.refused,
      });
    } catch (error) {
      if (error instanceof BotCheckUnavailable) {
        const cause = failureOf(error.underlying);

        // Too many tries from this address is told as such; anything else is a connection (or a page without https).
        setFailure(
          cause.kind === "busy"
            ? cause
            : {
                kind: "network",
                message:
                  "La vérification de sécurité n’a pas pu être préparée (connexion coupée, ou page ouverte sans https). Réessayez dans un instant.",
              },
        );
      } else {
        setFailure(failureOf(error, "La demande n’a pas pu être enregistrée. Vérifiez les informations et réessayez."));
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
      const report = await uploadPhotos(sendSlow, created.id, created.token, created.photosPending, () => undefined);

      setCreated({
        ...created,
        photosSent: created.photosSent + report.sent,
        photosPending: report.pending,
        photosRefused: [...created.photosRefused, ...report.refused],
      });
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
              Demande n° {created.id} envoyée
            </h2>
            <p className="mx-auto max-w-sm text-stone-600">
              Notre équipe examine votre demande de {created.service.toLowerCase()}. Le lien de suivi vous est aussi envoyé par SMS au{" "}
              <strong className="whitespace-nowrap">{created.phone}</strong>.
            </p>
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="guest-link" className="text-sm font-semibold text-stone-700">
              Votre lien de suivi
            </Label>
            <div className="flex gap-2">
              <Input
                id="guest-link"
                readOnly
                value={link}
                onFocus={(event) => event.currentTarget.select()}
                className="h-11 min-w-0 flex-1 border-stone-200 bg-stone-50 text-xs"
              />
              <Button type="button" variant="outline" className="h-11 shrink-0 gap-2" onClick={copyLink}>
                <Copy className="h-4 w-4" />
                {copied ? "Copié" : "Copier"}
              </Button>
            </div>
            <p className="text-xs text-stone-500">
              Ce lien est la clé de votre demande : ne le partagez pas. Il est gardé sur cet appareil ; vous le retrouverez en rouvrant cette page (« Vos demandes sur cet appareil »).
            </p>
          </div>

          {created.photosSent > 0 && (
            <p className="text-sm text-stone-600">
              {created.photosSent} photo{created.photosSent > 1 ? "s" : ""} envoyée{created.photosSent > 1 ? "s" : ""}.
            </p>
          )}

          {created.photosPending.length > 0 && (
            <div role="alert" className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-900">
              <p className="flex items-start gap-2 font-semibold">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {created.photosPending.length} photo{created.photosPending.length > 1 ? "s" : ""} n’{created.photosPending.length > 1 ? "ont" : "a"} pas pu être envoyée
                {created.photosPending.length > 1 ? "s" : ""}. Votre demande, elle, est bien enregistrée.
              </p>
              <Button type="button" variant="outline" className="w-full" onClick={retryPhotos} disabled={retrying}>
                {retrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Renvoyer les photos
              </Button>
            </div>
          )}

          {created.photosRefused.length > 0 && (
            <ul className="space-y-1 text-left text-sm text-amber-900">
              {created.photosRefused.map((reason, index) => (
                <li key={`${reason}-${index}`}>{reason}</li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Link href={trackingPath(created)} className="block">
              <span className={cn("inline-flex items-center justify-center gap-2 rounded-md", PRIMARY_BUTTON_CLASS)}>
                Suivre ma demande <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
            <Button type="button" variant="outline" className={SECONDARY_BUTTON_CLASS} onClick={startAgain}>
              Faire une autre demande
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
        <CardTitle className="text-2xl font-bold text-blue-950">Demander une intervention</CardTitle>
        <CardDescription className="text-base text-stone-500">Sans compte. Trois étapes, un lien de suivi par SMS.</CardDescription>

        <ol className="flex items-center gap-2 pt-1" aria-label="Étapes">
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
              <span className="hidden sm:inline">{STEP_TITLES[item]}</span>
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
            Étape {stepIndex + 1} sur {GUEST_STEPS.length} : {STEP_TITLES[step]}
          </h2>

          {step === "problem" && (
            <>
              <fieldset className="space-y-3">
                <legend className={SECTION_LABEL_CLASS}>Type de problème</legend>
                <div id="trade-group" tabIndex={-1} role="radiogroup" aria-label="Type de problème" className="grid grid-cols-2 gap-3 outline-none">
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
                        <span className="text-sm font-bold">{TRADES[trade].service}</span>
                      </button>
                    );
                  })}
                </div>
                {problems.serviceType && <p className={ERROR_CLASS}>{problems.serviceType}</p>}
              </fieldset>

              {category && category.subServices.length > 0 && (
                <fieldset className="space-y-3">
                  <legend className={SECTION_LABEL_CLASS}>Quel service ? (facultatif)</legend>
                  <div role="radiogroup" aria-label="Service" className="space-y-2">
                    <SubServiceOption
                      selected={form.subServiceId === null}
                      onSelect={() => formWith({ subServiceId: null })}
                      title="Je ne sais pas / autre"
                      detail="Notre équipe choisira avec vous."
                    />
                    {category.subServices.map((item) => (
                      <SubServiceOption
                        key={item.id}
                        selected={form.subServiceId === item.id}
                        onSelect={() => formWith({ subServiceId: item.id })}
                        title={item.name}
                        detail={[priceText(item), durationText(item.estimatedDuration)].filter(Boolean).join(" · ")}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-stone-500">Les prix sont indicatifs ; le devis définitif est établi après examen de votre demande.</p>
                </fieldset>
              )}

              <div className="space-y-2">
                <Label htmlFor="guest-description" className="font-semibold text-stone-700">
                  Décrivez le problème
                </Label>
                <Textarea
                  id="guest-description"
                  value={form.description}
                  maxLength={GUEST_LIMITS.descriptionMax}
                  onChange={(event) => formWith({ description: event.target.value })}
                  aria-invalid={problems.description ? true : undefined}
                  aria-describedby="guest-description-help"
                  placeholder="Ex : le robinet de la cuisine fuit sous l’évier depuis ce matin…"
                  className={TEXTAREA_CLASS}
                />
                <p id="guest-description-help" className="text-right text-xs text-stone-500">
                  {form.description.length}/{GUEST_LIMITS.descriptionMax}
                </p>
                {problems.description && <p className={ERROR_CLASS}>{problems.description}</p>}
              </div>

              <div className="space-y-2" id="guest-photos" tabIndex={-1}>
                <Label className="font-semibold text-stone-700">
                  Photos {context.requiresPhotos ? "(au moins une)" : "(facultatif)"}
                </Label>
                <PhotoPicker files={files} onChange={setFiles} disabled={busy} error={problems.photoCount} />
              </div>
            </>
          )}

          {step === "place" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="guest-address" className="font-semibold text-stone-700">
                  Adresse de l’intervention
                </Label>
                <Input
                  id="guest-address"
                  value={form.address}
                  maxLength={GUEST_LIMITS.addressMax}
                  autoComplete="street-address"
                  onChange={(event) => formWith({ address: event.target.value })}
                  aria-invalid={problems.address ? true : undefined}
                  placeholder="Ex : 12 rue de la République, La Marsa, Tunis"
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
                  Utiliser ma position
                </Button>
                <p id={locatePrompt} className="text-xs text-stone-500">
                  Facultatif : aide le technicien à trouver l’endroit. Votre position n’est envoyée qu’avec cette demande.
                </p>

                {form.latitude !== null && form.longitude !== null && (
                  <p className="flex items-center justify-between gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Position jointe à la demande
                    </span>
                    <button
                      type="button"
                      className="font-semibold underline"
                      onClick={() => {
                        formWith({ latitude: null, longitude: null });
                        setLocationNote(null);
                      }}
                    >
                      Retirer
                    </button>
                  </p>
                )}
                {locationNote && (
                  <p role="status" className={cn("text-sm", locationNote.kind === "ok" ? "text-green-800" : "text-red-600")}>
                    {locationNote.text}
                  </p>
                )}
                {problems.latitude && <p className={ERROR_CLASS}>{problems.latitude}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-access" className="font-semibold text-stone-700">
                  Précisions pour accéder au lieu (facultatif)
                </Label>
                <Textarea
                  id="guest-access"
                  value={form.accessInstructions}
                  maxLength={GUEST_LIMITS.accessMax}
                  onChange={(event) => formWith({ accessInstructions: event.target.value })}
                  placeholder="Ex : immeuble bleu, 2e étage, sonnette « Ben Ali »"
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
                  Votre nom
                </Label>
                <Input
                  id="guest-name"
                  value={form.contactName}
                  maxLength={GUEST_LIMITS.nameMax}
                  autoComplete="name"
                  onChange={(event) => formWith({ contactName: event.target.value })}
                  aria-invalid={problems.contactName ? true : undefined}
                  placeholder="Mohamed Ben Ali"
                  className={FIELD_CLASS}
                />
                {problems.contactName && <p className={ERROR_CLASS}>{problems.contactName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-phone" className="font-semibold text-stone-700">
                  Téléphone
                </Label>
                <div className="flex gap-2">
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
                    className={cn(FIELD_CLASS, "min-w-0 flex-1")}
                  />
                </div>
                <p id="guest-phone-help" className="text-xs text-stone-500">
                  Le lien de suivi est envoyé par SMS à ce numéro. Un numéro avec un autre indicatif s’écrit en entier : +33 6 12 34 56 78.
                </p>
                {problems.contactPhone && <p className={ERROR_CLASS}>{problems.contactPhone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-email" className="font-semibold text-stone-700">
                  E-mail (facultatif)
                </Label>
                <Input
                  id="guest-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={form.contactEmail}
                  maxLength={GUEST_LIMITS.emailMax}
                  onChange={(event) => formWith({ contactEmail: event.target.value })}
                  aria-invalid={problems.contactEmail ? true : undefined}
                  placeholder="nom@exemple.com"
                  className={FIELD_CLASS}
                />
                {problems.contactEmail && <p className={ERROR_CLASS}>{problems.contactEmail}</p>}
              </div>

              {/* The trap for programs that fill every field: a person never sees it, so it stays empty. */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
                <label htmlFor="guest-website">Ne pas remplir ce champ</label>
                <input id="guest-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" ref={honeypotRef} />
              </div>

              <section aria-label="Récapitulatif" className="space-y-2 rounded-xl border border-stone-200 bg-stone-50/60 p-4 text-sm">
                <p className={SECTION_LABEL_CLASS}>Récapitulatif</p>
                <dl className="space-y-2">
                <Recap label="Problème">
                  {form.serviceType ? TRADES[form.serviceType].service : "—"}
                  {subService ? ` · ${subService.name}` : ""}
                </Recap>
                <Recap label="Description">
                  <span className="line-clamp-3 whitespace-pre-line">{form.description.trim()}</span>
                </Recap>
                <Recap label="Adresse">{form.address.trim()}</Recap>
                <Recap label="Photos">{files.length === 0 ? "Aucune" : String(files.length)}</Recap>
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
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {progress ?? (phase === "checking" ? "Vérification de sécurité…" : "Envoi en cours…")}
                </>
              ) : (
                <span className="flex items-center gap-2">
                  Envoyer la demande <Send className="h-5 w-5" />
                </span>
              )}
            </Button>
          ) : (
            <Button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={busy}>
              <span className="flex items-center gap-2">
                Continuer <ArrowRight className="h-5 w-5" />
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
              <ArrowLeft className="h-4 w-4" /> Retour
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
        "flex w-full flex-col items-start rounded-lg border-2 px-4 py-3 text-left transition-colors",
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
