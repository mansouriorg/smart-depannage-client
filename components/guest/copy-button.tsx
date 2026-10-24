"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/** Selects what is written in an element, so that the person can copy it with the keyboard or the menu of the phone. */
function selectContents(id: string) {
  try {
    const node = document.getElementById(id);
    const selection = window.getSelection();

    if (!node || !selection) return;

    const range = document.createRange();

    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    // Nothing to select: the button still says to copy it by hand.
  }
}

/**
 * Copies a text (the account of a transfer, its reference) and says so. The clipboard can be refused (an old browser, a page
 * in a frame): the text is then selected where it is written (`targetId` is the element that holds it), and the button says to copy
 * it by hand. Never throws.
 */
export function CopyButton({ text, label, targetId }: { text: string; label: string; targetId?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      if (targetId) selectContents(targetId);

      setState("failed");
    }

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(() => setState("idle"), 2500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void copy()}
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]",
          state === "copied" ? "border-green-300 bg-green-50 text-green-800" : "border-stone-200 bg-white text-stone-700 hover:border-[#D4AF37] hover:text-[#B69121]",
        )}
      >
        {state === "copied" ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
        {state === "copied" ? "Copié" : state === "failed" ? "Copiez à la main" : "Copier"}
        <span className="sr-only"> {label}</span>
      </button>
      {/* Always on the page, so that a screen reader says what is put in it. */}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied" ? `Copié : ${label}.` : state === "failed" ? `Copie impossible : ${label} est sélectionné, copiez-le à la main.` : ""}
      </span>
    </>
  );
}
