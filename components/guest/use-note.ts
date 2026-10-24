"use client";

import { useCallback, useState } from "react";

/** A message under a panel: what an action did ("done"), or why it did not work ("error"). */
export interface Note {
  text: string;
  kind: "done" | "error";
}

interface Held extends Note {
  /** The state of the panel the message was written about; `null` until the panel is drawn once after the message (it is the state then). */
  signature: string | null;
  /** How many changes of state the message outlives: 1 when the action itself moves the state (the page is read again after it). */
  grace: number;
  /** While the message waits for that change: how many finished reads it still waits for before it stops waiting (a change of state ends the wait sooner). */
  reads: number;
  /** The stage in which the message has nothing left to say (an acceptance refused because the quote was already accepted). */
  hideAtStage?: string;
}

export interface ShowOptions {
  /** The page is read again after this message: the change of state that brings does not make the message stale. */
  rereads?: boolean;
  /** The message is not shown any more once the panel is in this stage. */
  hideAtStage?: string;
}

/**
 * How many finished reads a message waits for the change its action causes. The first may have been on its way before the action
 * (it can bring the state from before); the second was asked after it. If neither brings a change, nothing was going to move.
 */
const READS_WAITED = 2;

/** What is left of a message when the panel is drawn in this state, `readsDone` reads after it was last drawn. */
function kept(held: Held | null, signature: string, stage: string, readsDone = 0): Held | null {
  if (!held || held.hideAtStage === stage) return null;
  if (held.signature === null) return { ...held, signature };
  if (held.signature !== signature) return held.grace > 0 ? { ...held, signature, grace: held.grace - 1 } : null;

  if (held.grace > 0 && readsDone > 0) {
    const left = held.reads - readsDone;

    return left > 0 ? { ...held, reads: left } : { ...held, reads: 0, grace: 0 };
  }

  return held;
}

/**
 * The message of a panel, kept only while it is true. A message belongs to the state the panel was in when it was written
 * (`signature`): when the page moves to another state (the technician edited the quote, the payment was confirmed), the message
 * goes — except for the one change that the action itself causes, which a message about a read-again action outlives.
 *
 * `reads` counts the reads of the page that finished (good or not). `settling` is true between such an action and the read that shows
 * its result: the panel has done what it was asked, and what it still shows (the answers to the quote, the choice of a way of paying)
 * is the state from before. It ends with the change of state, or after two finished reads if none came.
 */
export function useNote(signature: string, stage: string, reads: number) {
  const [held, setHeld] = useState<Held | null>(null);
  const [seen, setSeen] = useState({ signature, stage, reads });

  // The panel is drawn in another state (the documented way of adjusting state to what was just drawn: no effect, no frame of the old one).
  if (seen.signature !== signature || seen.stage !== stage || seen.reads !== reads) {
    setSeen({ signature, stage, reads });
    setHeld(kept(held, signature, stage, reads - seen.reads));
  } else if (held && held.signature === null) {
    setHeld(kept(held, signature, stage));
  }

  const show = useCallback((note: Note, options: ShowOptions = {}) => {
    setHeld({ ...note, signature: null, grace: options.rereads ? 1 : 0, reads: READS_WAITED, hideAtStage: options.hideAtStage });
  }, []);

  const clear = useCallback(() => setHeld(null), []);

  return {
    done: held?.kind === "done" ? held.text : null,
    error: held?.kind === "error" ? held.text : null,
    /** The message is still there after the next change of state (it was written about a change that is on its way). */
    lasting: held !== null && held.grace > 0,
    settling: held !== null && held.kind === "done" && held.grace > 0,
    show,
    clear,
  };
}
