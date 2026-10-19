"use client";

import { useEffect, useState } from "react";

import { send } from "@/lib/api";
import { BotCheckSession } from "@/lib/bot-check-session";
import { failureOf } from "@/lib/guest-errors";
import { callApi, routes } from "@/lib/shared";

/** SHA-256 in the browser. `crypto.subtle` exists on https pages and on localhost only: elsewhere the check cannot be made. */
async function sha256(text: string): Promise<Uint8Array> {
  const subtle = typeof crypto === "undefined" ? undefined : crypto.subtle;

  if (!subtle) throw new Error("This page cannot compute a SHA-256 (it needs https).");

  return new Uint8Array(await subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

/**
 * The bot check of a form (P1-16): the challenge is fetched and solved in the background as soon as the form opens, so that
 * sending it costs the person a few seconds at most. Keep one session per form; `session.take()` when sending,
 * `session.prepare()` again after a failure (a challenge is used once).
 */
export function useBotCheck(): BotCheckSession {
  // Created once. The constructor touches nothing in the browser, so it is safe to build while the page is rendered on the server.
  const [session] = useState(
    () =>
      new BotCheckSession({
        fetchChallenge: () => callApi(send, routes.guest.challenge()),
        sha256,
        now: () => Date.now(),
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
        // Too many tries from this address: a second ask would only use up one more.
        retryable: (error) => failureOf(error).kind !== "busy",
      }),
  );

  useEffect(() => {
    session.prepare();

    return () => session.dispose();
  }, [session]);

  return session;
}
