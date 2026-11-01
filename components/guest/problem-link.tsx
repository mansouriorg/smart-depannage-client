"use client";

import { useTranslations } from "next-intl";

/** Spaces that may sit inside the quotation marks: French writes « Un problème ? », Arabic «هل لديك مشكلة؟». */
const SPACES = "[\\s\\u00a0\\u202f]*";

/**
 * Words that may name the block « Un problème ? » (in Arabic «هل لديك مشكلة؟») further down the page (the only way to write to the team
 * from this page): the name is a link to it, so that a keyboard or a screen reader gets there without going through the whole page.
 * The name is the title of that block in the language of the page; the sentences of the shared package quote it in the same words.
 */
export function LinkedWords({ text }: { text: string }) {
  const t = useTranslations("website.panels.problem");
  const escaped = t("title").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = new RegExp(`«${SPACES}${escaped}${SPACES}»`).exec(text);

  if (!found) return <>{text}</>;

  return (
    <>
      {text.slice(0, found.index)}
      <a href="#problem-title" className="font-semibold underline underline-offset-2">
        {found[0]}
      </a>
      {text.slice(found.index + found[0].length)}
    </>
  );
}
