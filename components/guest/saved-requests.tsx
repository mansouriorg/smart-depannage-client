"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, Trash2 } from "lucide-react";

import { forgetRequest, parseSaved, readSavedText, subscribeSaved, trackingPath } from "@/lib/saved-requests";

const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

/**
 * The requests made from this browser, to come back to their tracking page. The list lives in the browser (see
 * lib/saved-requests.ts); on a shared computer, "Oublier" removes a request from it.
 */
export function SavedRequests() {
  // The server has no browser storage and says "nothing"; the browser reads its own on the first draw after that, so both agree.
  const text = useSyncExternalStore(subscribeSaved, readSavedText, () => "");
  const list = useMemo(() => parseSaved(text), [text]);

  if (list.length === 0) return null;

  return (
    <section aria-labelledby="saved-title" className="mx-auto mb-8 w-full max-w-lg rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 id="saved-title" className="font-bold text-blue-950">
        Vos demandes sur cet appareil
      </h2>
      <ul className="mt-3 divide-y divide-stone-100">
        {list.map((entry) => (
          <li key={entry.id} className="flex items-center gap-3 py-3">
            <Link href={trackingPath(entry)} className="group flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block font-semibold text-blue-950">
                  Demande n° {entry.id}
                  {entry.service ? ` · ${entry.service}` : ""}
                </span>
                {entry.savedAt > 0 && <span className="block text-xs text-stone-500">{day.format(entry.savedAt)}</span>}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 group-hover:text-[#B69121]" />
            </Link>
            <button
              type="button"
              onClick={() => forgetRequest(entry.id)}
              aria-label={`Oublier la demande n° ${entry.id} sur cet appareil`}
              className="flex h-9 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" /> Oublier
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-stone-500">
        Le lien de chaque demande est gardé dans ce navigateur seulement. Sur un appareil partagé, cliquez sur « Oublier » après usage.
      </p>
    </section>
  );
}
