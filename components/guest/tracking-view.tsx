"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Check, Loader2, MapPin, Phone, WifiOff } from "lucide-react";

import { AddPhotosPanel, FeedbackPanel, FeedbackThanks, ProblemPanel } from "@/components/guest/tracking-panels";
import { send } from "@/lib/api";
import { forgetRequest, isTrackingToken, rememberRequest } from "@/lib/saved-requests";
import { TrackingPoller } from "@/lib/tracking-poller";
import {
  TRACKING_REFRESH_MS,
  TRADES,
  callApi,
  canAddPhotos,
  canGiveFeedback,
  hasGivenFeedback,
  recordIdOf,
  routes,
  statusGroupOf,
  trackingProgress,
  visitorStatus,
  type StatusTone,
  type TrackingIntervention,
} from "@/lib/shared";
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

const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dayAndTime = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

function when(value: string | null | undefined, format: Intl.DateTimeFormat): string | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : format.format(date);
}

function serviceName(job: TrackingIntervention): string {
  const trades = TRADES as Record<string, { service: string } | undefined>;

  return job.subService?.name ?? trades[job.serviceType]?.service ?? "Intervention";
}

/** A phone number the browser may be asked to dial: digits, spaces, "+", "-", "(", ")" only. */
function dialable(phone: string | null | undefined): string | null {
  const text = (phone ?? "").trim();

  return /^\+?[0-9 ()\-.]{6,25}$/.test(text) ? text.replace(/[ ()\-.]/g, "") : null;
}

function InvalidLink({ expired }: { expired?: boolean }) {
  return (
    <div role="alert" className="mx-auto w-full max-w-lg rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
      <h1 className="text-xl font-bold text-blue-950">Lien de suivi invalide</h1>
      <p className="mt-2 text-stone-600">
        {expired
          ? "Ce lien ne correspond à aucune demande (ou il a expiré). Utilisez le lien reçu par SMS."
          : "Ce lien est incomplet. Ouvrez-le depuis le SMS reçu, en entier."}
      </p>
      <Link href="/demande" className="mt-6 inline-block font-semibold text-[#B69121] underline">
        Faire une nouvelle demande
      </Link>
    </div>
  );
}

function Tracking({ id, token }: { id: number; token: string }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [job, setJob] = useState<TrackingIntervention | null>(null);
  const [failures, setFailures] = useState(0);
  const [answeredAt, setAnsweredAt] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const refreshNow = useRef<() => void>(() => undefined);

  useEffect(() => {
    let remembered = false;

    const poller = new TrackingPoller({
      load: () => callApi(send, routes.guest.track(id, token)),
      now: () => Date.now(),
      isHidden: () => document.hidden,
      setTimer: (run, ms) => setTimeout(run, ms),
      clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
      onAnswer: (data, said) => {
        // Nothing is announced for the first answer (the page is simply opening), only for a change.
        if (said) setNotice(said);

        setJob(data);
        setPhase("ready");
        setFailures(0);
        setAnsweredAt(Date.now());

        if (!remembered) {
          remembered = true;
          rememberRequest({ id, token, service: serviceName(data), savedAt: Date.now() });
        }
      },
      onFailure: setFailures,
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
  }, [id, token]);

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
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement de votre demande…
        </p>
        {failures >= 1 && (
          <div role="alert" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="flex items-start justify-center gap-2">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
              Connexion difficile : la demande n’a pas pu être chargée. La page réessaie toute seule.
            </p>
            <button
              type="button"
              onClick={() => refreshNow.current()}
              className="h-10 rounded-md border border-amber-400 bg-white px-4 font-semibold text-amber-900 hover:bg-amber-100"
            >
              Réessayer maintenant
            </button>
          </div>
        )}
      </div>
    );
  }

  const words = visitorStatus(job.status);
  const group = statusGroupOf(job.status);
  const { steps, halted } = trackingProgress(job.status);
  const artisanPhone = dialable(job.artisan?.phone);
  const showArtisan = group === "active" && Boolean(job.artisan?.name);
  const created = when(job.createdAt, dayAndTime);
  const changed = when(job.lastStatusChangedAt, dayAndTime);
  const photoCount = job.photos?.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      {failures >= 2 && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
          Connexion instable. Ce que vous voyez date de {answeredAt ? time.format(answeredAt) : "tout à l’heure"} ; la page réessaie toute seule.
        </p>
      )}

      <header className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] to-[#B69121]" />
        <div className="space-y-1 p-5">
          <h1 className="text-2xl font-bold text-blue-950">Demande n° {job.id}</h1>
          <p className="font-medium text-stone-700">{serviceName(job)}</p>
          <p className="flex items-start gap-1.5 text-sm text-stone-500">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{job.address}</span>
          </p>
          {created && <p className="text-xs text-stone-500">Demandée le {created}</p>}
        </div>
      </header>

      <section className={cn("rounded-xl border p-5", TONE_CLASS[words.tone])} aria-labelledby="status-title">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">État de la demande</p>
        <h2 id="status-title" className="mt-1 text-xl font-bold">
          {words.title}
        </h2>
        <p className="mt-1 text-sm opacity-90">{words.message}</p>
        {halted === "cancelled" && job.cancelledReason && <p className="mt-3 text-sm font-medium">Motif : {job.cancelledReason}</p>}
        {changed && <p className="mt-3 text-xs opacity-70">Dernier changement : {changed}</p>}
      </section>

      {/* Read out by a screen reader when the status changes, never on the first draw. */}
      <p className="sr-only" aria-live="polite" role="status">
        {notice}
      </p>

      {!halted && (
        <ol className="grid grid-cols-5 gap-1" aria-label="Avancement">
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
                <span className="sr-only">{step.state === "done" ? " (fait)" : step.state === "current" ? " (en cours)" : " (à venir)"}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {showArtisan && (
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm" aria-labelledby="artisan-title">
          <h2 id="artisan-title" className="text-xs font-bold uppercase tracking-wider text-[#B69121]">
            Votre technicien
          </h2>
          <p className="mt-1 text-xl font-bold text-blue-950">{job.artisan?.name}</p>
          {artisanPhone && (
            <a
              href={`tel:${artisanPhone}`}
              className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg border border-stone-200 px-4 font-semibold text-blue-950 hover:border-[#D4AF37] hover:text-[#B69121]"
            >
              <Phone className="h-4 w-4" /> {job.artisan?.phone}
            </a>
          )}
        </section>
      )}

      {photoCount > 0 && (
        <p className="text-sm text-stone-500">
          {photoCount} photo{photoCount > 1 ? "s" : ""} jointe{photoCount > 1 ? "s" : ""} à votre demande.
        </p>
      )}

      {canGiveFeedback(job) && <FeedbackPanel id={id} token={token} onSaved={onSaved} />}
      {group === "completed" && hasGivenFeedback(job) && <FeedbackThanks rating={job.review?.rating ?? job.rating ?? null} />}
      {canAddPhotos(job) && <AddPhotosPanel id={id} token={token} held={photoCount} onSent={() => refreshNow.current()} />}
      <ProblemPanel id={id} token={token} status={job.status} />

      <footer className="space-y-1 text-center text-xs text-stone-500">
        <p>
          Cette page se met à jour toute seule (toutes les {TRACKING_REFRESH_MS / 1000} secondes).
          {answeredAt ? ` Dernière mise à jour : ${time.format(answeredAt)}.` : ""}
        </p>
        <p>
          <Link href="/demande" className="font-semibold text-[#B69121] underline">
            Mes demandes
          </Link>
        </p>
      </footer>
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
  // useSearchParams needs a Suspense boundary in a statically rendered page.
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-lg items-center justify-center gap-3 p-10 text-stone-600" role="status">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
        </div>
      }
    >
      <FromAddress />
    </Suspense>
  );
}
