import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { AlertTriangle, ArrowLeft } from "lucide-react";

import {
  LEGAL_PATHS,
  LEGAL_REVIEW,
  legalRobots,
  legalSegments,
  legalStatus,
  legalText,
  legalVersionText,
  localeOrDefault,
  type LegalDocument,
} from "@/lib/shared";

/**
 * A legal text of the website (P3-08): the terms (`/conditions`) and the privacy policy (`/confidentialite`), read from the shared
 * catalogue in the visitor's language. Until somebody has read exactly these words and no passage is left open in any of the texts
 * (`legalStatus`, one answer for the whole set), a page says that it is a draft, shows the passages that are still open, and asks the search
 * engines to leave it alone (`legalRobots`): a draft must not be quoted as the company's word.
 */

const BRAND = "Smart-Dépannage";

/** The title of the tab and the line search engines would show, and the instruction to keep a draft out of them. */
export async function legalMetadata(document: LegalDocument): Promise<Metadata> {
  const locale = localeOrDefault(await getLocale());
  const text = legalText(locale, document);
  const { reviewed } = legalStatus(locale, document, LEGAL_REVIEW);

  return {
    title: `${text.title} | ${BRAND}`,
    description: text.intro,
    robots: legalRobots(reviewed),
  };
}

export async function LegalDocumentPage({ document }: { document: LegalDocument }) {
  const locale = localeOrDefault(await getLocale());
  const t = await getTranslations("legal");
  const text = legalText(locale, document);
  const status = legalStatus(locale, document, LEGAL_REVIEW);
  const other: LegalDocument = document === "terms" ? "privacy" : "terms";
  const otherTitle = legalText(locale, other).title;

  return (
    <div className="flex-1 bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-6 max-w-3xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" /> {t("back")}
        </Link>
      </div>

      <article className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:p-10">
        {!status.reviewed && (
          <div role="note" className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-bold">{t("draft.title")}</p>
              <p>{t("draft.text")}</p>
            </div>
          </div>
        )}

        <header className="space-y-3">
          <h1 className="text-3xl font-bold text-blue-950 md:text-4xl">
            <Passage value={text.title} />
          </h1>
          <p className="text-sm text-stone-500">{legalVersionText(locale, LEGAL_REVIEW, status.reviewed)}</p>
          <p className="text-lg text-stone-700">
            <Passage value={text.intro} />
          </p>
        </header>

        <nav aria-label={t("contents")}>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {text.sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="group flex items-baseline gap-3 rounded-md px-2 py-1 text-stone-700 hover:bg-stone-100 hover:text-[#6B540D]">
                  <span className="w-5 shrink-0 text-end font-semibold text-[#8A6D11] group-hover:text-[#6B540D]">{index + 1}</span>
                  <span>
                    <Passage value={section.title} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-8">
          {text.sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-6 space-y-3">
              <h2 className="flex items-baseline gap-3 text-xl font-bold text-blue-950">
                <span className="w-5 shrink-0 text-end text-[#8A6D11]">{index + 1}</span>
                <span>
                  <Passage value={section.title} />
                </span>
              </h2>
              <div className="space-y-3 text-stone-700 leading-relaxed">
                {section.blocks.map((block, position) =>
                  block.kind === "paragraph" ? (
                    <p key={position}>
                      <Passage value={block.text} />
                    </p>
                  ) : (
                    <ul key={position} className="list-disc space-y-1 ps-6">
                      {block.items.map((item, itemPosition) => (
                        <li key={itemPosition}>
                          <Passage value={item} />
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-stone-200 pt-6 text-sm">
          <p className="text-stone-500">{t("other")}</p>
          <Link href={LEGAL_PATHS[other]} className="font-semibold text-[#8A6D11] hover:underline">
            {otherTitle}
          </Link>
        </footer>
      </article>
    </div>
  );
}

/** A line of the text; the passages that are still to fill in or to check are marked so that nobody reads them as decided (a text that has been read has none). */
function Passage({ value }: { value: string }) {
  return (
    <>
      {legalSegments(value).map((segment, index) =>
        segment.kind === "gap" ? (
          <mark key={index} className="rounded bg-amber-100 px-1 text-amber-900">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}
