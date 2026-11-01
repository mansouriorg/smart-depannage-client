"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";

import { LEGAL_PATHS, type LegalDocument } from "@/lib/shared";

/**
 * A link to one of the legal texts (P3-08) from a form: it opens in a tab of its own, so that what was typed stays where it is, and it says so
 * to a screen reader and with an icon. The gold is the darker one of the text links (#8A6D11: 4.9 to 1 on white, which #B69121 does not reach).
 */
export function LegalLink({ document, children }: { document: LegalDocument; children: ReactNode }) {
  const t = useTranslations("website.request");

  return (
    <Link
      href={LEGAL_PATHS[document]}
      target="_blank"
      rel="noopener"
      className="font-semibold text-[#8A6D11] underline underline-offset-2 hover:text-[#6B540D]"
    >
      {children}
      <ExternalLink aria-hidden="true" className="ms-1 inline h-3 w-3 align-baseline" />
      <span className="sr-only"> {t("newTab")}</span>
    </Link>
  );
}
