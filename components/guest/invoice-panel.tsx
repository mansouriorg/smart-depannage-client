"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, FileText, Printer } from "lucide-react";

import { Bidi, Ltr } from "@/components/ltr";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";
import { formatRib, guestPdfLinks, invoiceDocument, isolateFor, type TrackingInterventionInvoice, type TransferDetails } from "@/lib/shared";
import { useAppLocale } from "@/lib/use-app-locale";
import { cn } from "@/lib/utils";

const TONE_PILL: Record<string, string> = {
  warning: "border-orange-200 bg-orange-50 text-orange-900",
  success: "border-green-200 bg-green-50 text-green-900",
  danger: "border-red-200 bg-red-50 text-red-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
};

/**
 * How long the page stays cut down to the invoice after the print call came back, if the browser never says that the print window
 * was closed (most browsers hold the call while the window is open; the ones that do not have already taken what they print).
 */
const PRINT_FALLBACK_MS = 15_000;

/**
 * The sheet while the invoice is printed. No margin on the sheet means no header or footer of the browser on it (they carry the address of
 * the page, which holds the private link of the request); the margin is the invoice's own, and it is repeated on every sheet. These rules are
 * on the page only while the print window is open: any other print of the page keeps the margins of the browser.
 */
const PRINT_RULES =
  "@page { margin: 0; } @media print { #invoice-document { padding: 14mm; box-decoration-break: clone; -webkit-box-decoration-break: clone; } }";

/**
 * The invoice of the request: its summary, the document itself, and the way to keep it. The PDF is linked when the invoice has one
 * at a complete https address; until then the page prints the invoice itself (the print window of the browser saves a PDF), with the
 * rest of the page left out. The account of the company is added under the totals while the invoice is unpaid.
 */
export function InvoicePanel({
  id,
  token,
  invoice,
  bank,
  onPrinting,
}: {
  /** The request and its private link: the PDF files are asked from the server with them. */
  id: number;
  token: string;
  invoice: TrackingInterventionInvoice | null | undefined;
  bank: TransferDetails | null;
  /** Tells the page to leave the rest out while the print window is open. */
  onPrinting: (printing: boolean) => void;
}) {
  const t = useTranslations("website.invoice");
  const locale = useAppLocale();
  const [expanded, setExpanded] = useState(false);
  const [printRequested, setPrintRequested] = useState(false);
  const pdf = useMemo(() => guestPdfLinks(API_URL, id, token), [id, token]);
  const document_ = invoiceDocument(invoice, { pdf, locale });
  const fileName = document_?.fileName ?? t("fileName");

  useEffect(() => {
    if (!printRequested) return;

    const previousTitle = document.title;
    const sheet = document.createElement("style");
    let finished = false;

    sheet.setAttribute("data-invoice-print", "");
    sheet.textContent = PRINT_RULES;
    document.head.appendChild(sheet);

    const finish = () => {
      if (finished) return;

      finished = true;
      window.removeEventListener("afterprint", finish);
      sheet.remove();
      document.title = previousTitle;
      onPrinting(false);
      setPrintRequested(false);
    };

    let fallback: ReturnType<typeof setTimeout> | null = null;

    window.addEventListener("afterprint", finish);

    document.title = fileName;
    // Let the page draw without the rest first.
    const timer = setTimeout(() => {
      try {
        window.print();
        // A browser that never says the window was closed must not leave the page cut down.
        fallback = setTimeout(finish, PRINT_FALLBACK_MS);
      } catch {
        finish();
      }
    }, 80);

    return () => {
      clearTimeout(timer);
      if (fallback) clearTimeout(fallback);
      finish();
    };
  }, [printRequested, fileName, onPrinting]);

  if (!document_) return null;

  const unpaid = document_.tone === "warning";
  const showDocument = expanded || printRequested;

  return (
    <section id="invoice-document" className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm print:border-0 print:p-0 print:shadow-none" aria-labelledby="invoice-title">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="min-w-0">
          <h2 id="invoice-title" className="flex items-center gap-2 font-bold text-blue-950">
            <FileText className="h-5 w-5 text-[#B69121]" aria-hidden /> {document_.title}
          </h2>
          {document_.issuedText && <p className="text-sm text-stone-500">{document_.issuedText}</p>}
        </div>
        <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold", TONE_PILL[document_.tone] ?? TONE_PILL.info)}>{document_.statusWords}</span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row print:hidden">
        <Button type="button" variant="outline" className="h-11 flex-1 border-stone-200 font-semibold" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? t("hide") : t("show")}
        </Button>
        {document_.download.kind === "link" ? (
          <a
            href={document_.download.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold hover:border-[#D4AF37] hover:text-[#B69121]"
          >
            <Download className="h-4 w-4" aria-hidden /> {t("downloadPdf")}
          </a>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 gap-2 border-stone-200 font-semibold"
            disabled={printRequested}
            onClick={() => {
              setExpanded(true);
              onPrinting(true);
              setPrintRequested(true);
            }}
          >
            <Printer className="h-4 w-4" aria-hidden /> {t("printOrDownload")}
          </Button>
        )}
      </div>

      <div role="status" aria-live="polite" className="print:hidden">
        {printRequested && <p className="text-xs text-stone-500">{t("opening")}</p>}
      </div>

      {document_.download.kind === "print" && <p className="text-xs text-stone-500 print:hidden">{t("printHint")}</p>}

      {showDocument && (
        <article className="space-y-5 rounded-lg border border-stone-200 p-4 text-sm text-stone-800 print:rounded-none print:border-0 print:p-0 print:text-black" aria-label={document_.title}>
          <header className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              {document_.company.name && <p className="break-words text-base font-bold text-blue-950 print:text-black" dir="auto">{document_.company.name}</p>}
              {document_.company.address && <p className="break-words" dir="auto">{document_.company.address}</p>}
              {document_.company.phone && <p>{t("company.phone", { phone: isolateFor(locale, document_.company.phone) })}</p>}
              {document_.company.email && (
                <p className="break-all">
                  <Ltr wrap>{document_.company.email}</Ltr>
                </p>
              )}
              {document_.company.taxId && <p>{t("company.taxId", { taxId: isolateFor(locale, document_.company.taxId) })}</p>}
              {document_.company.registre && <p>{t("company.registre", { registre: isolateFor(locale, document_.company.registre) })}</p>}
            </div>
            <div className="space-y-0.5 sm:text-end">
              <p className="text-base font-bold text-blue-950 print:text-black">{document_.title}</p>
              {document_.issuedText && <p>{document_.issuedText}</p>}
              <p className="font-semibold">{document_.statusWords}</p>
            </div>
          </header>

          {(document_.client.name || document_.client.address || document_.client.phone || document_.client.email || document_.client.taxId) && (
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">{t("billedTo")}</p>
              {document_.client.name && <p className="break-words font-semibold" dir="auto">{document_.client.name}</p>}
              {document_.client.address && <p className="break-words" dir="auto">{document_.client.address}</p>}
              {document_.client.phone && (
                <p>
                  <Ltr>{document_.client.phone}</Ltr>
                </p>
              )}
              {document_.client.email && (
                <p className="break-all">
                  <Ltr wrap>{document_.client.email}</Ltr>
                </p>
              )}
              {document_.client.taxId && <p>{t("company.taxId", { taxId: isolateFor(locale, document_.client.taxId) })}</p>}
            </div>
          )}

          {(document_.service || document_.address) && (
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">{t("service")}</p>
              {document_.service && <p className="break-words" dir="auto">{document_.service}</p>}
              {document_.address && <p className="break-words" dir="auto">{document_.address}</p>}
            </div>
          )}

          {document_.lines.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start">
                <thead>
                  <tr className="border-b border-stone-300 text-xs uppercase tracking-wider text-stone-500 print:text-black">
                    <th scope="col" className="py-2 pe-2 text-start font-bold">
                      {t("table.designation")}
                    </th>
                    <th scope="col" className="hidden px-2 py-2 text-end font-bold sm:table-cell">
                      {t("table.quantity")}
                    </th>
                    <th scope="col" className="hidden px-2 py-2 text-end font-bold sm:table-cell">
                      {t("table.unitPrice")}
                    </th>
                    <th scope="col" className="py-2 ps-2 text-end font-bold">
                      {t("table.total")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {document_.lines.map((line, index) => (
                    <tr key={`${line.label}-${index}`} className="break-inside-avoid border-b border-stone-100 align-top">
                      <td className="py-2 pe-2">
                        <span className="break-words font-medium" dir="auto">{line.label}</span>
                        {line.description && <span className="block break-words text-xs text-stone-500 print:text-black" dir="auto">{line.description}</span>}
                        {/* On a narrow screen the quantity and the unit price go under the name, as on the quote. */}
                        <span className="block text-xs text-stone-500 sm:hidden">
                          <Bidi>{line.quantityText}</Bidi> × <Bidi>{line.unitText}</Bidi>
                        </span>
                      </td>
                      <td className="hidden px-2 py-2 text-end sm:table-cell">
                        <Bidi>{line.quantityText}</Bidi>
                      </td>
                      <td className="hidden whitespace-nowrap px-2 py-2 text-end sm:table-cell">
                        <Bidi>{line.unitText}</Bidi>
                      </td>
                      <td className="whitespace-nowrap py-2 ps-2 text-end font-medium">
                        <Bidi>{line.totalText}</Bidi>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="ms-auto w-full max-w-xs space-y-1">
            <div className="flex justify-between gap-3">
              <dt>{t("totals.excl")}</dt>
              <dd className="font-medium">
                <Bidi>{document_.totals.subtotalText}</Bidi>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{document_.totals.taxLabel}</dt>
              <dd className="font-medium">
                <Bidi>{document_.totals.taxText}</Bidi>
              </dd>
            </div>
            <div className={cn("flex justify-between gap-3 border-t border-stone-300 pt-2", !document_.totals.stampText && document_.totals.creditNotes.length === 0 ? "text-base font-bold" : "font-medium")}>
              <dt>{t("totals.incl")}</dt>
              <dd>
                <Bidi>{document_.totals.totalText}</Bidi>
              </dd>
            </div>
            {document_.totals.stampText && (
              <>
                <div className="flex justify-between gap-3">
                  <dt>{t("totals.stamp")}</dt>
                  <dd className="font-medium">
                    <Bidi>{document_.totals.stampText}</Bidi>
                  </dd>
                </div>
                <div className={cn("flex justify-between gap-3 border-t border-stone-200 pt-2", document_.totals.creditNotes.length === 0 ? "text-base font-bold" : "font-medium")}>
                  <dt>{document_.totals.toPayLabel}</dt>
                  <dd>
                    <Bidi>{document_.totals.toPayText}</Bidi>
                  </dd>
                </div>
              </>
            )}
            {document_.totals.creditNotes.map((note) => (
              <div key={note.id} className="flex justify-between gap-3">
                <dt className="min-w-0 break-words">{t("totals.creditNote", { number: isolateFor(locale, note.number) })}</dt>
                <dd className="whitespace-nowrap font-medium">
                  {/* Signed: read left to right, or the minus lands at the other end of the figure in an Arabic page */}
                  <Ltr>{note.amountText}</Ltr>
                </dd>
              </div>
            ))}
            {document_.totals.netToPayText && (
              <div className="flex justify-between gap-3 border-t border-stone-300 pt-2 text-base font-bold">
                <dt>{document_.totals.netLabel}</dt>
                <dd>
                  <Bidi>{document_.totals.netToPayText}</Bidi>
                </dd>
              </div>
            )}
          </dl>

          {document_.totals.creditNotes.length > 0 && (
            <div className="space-y-2 border-t border-stone-200 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">{t("creditNotes.title")}</p>
              <ul className="space-y-2">
                {document_.totals.creditNotes.map((note) => (
                  <li key={note.id} className="break-inside-avoid">
                    <p className="font-medium">
                      <Ltr>{note.number}</Ltr>
                      {note.issuedText ? ` · ${note.issuedText}` : ""}
                    </p>
                    {note.reason && <p className="break-words text-stone-600 print:text-black" dir="auto">{t("creditNotes.reason", { reason: note.reason })}</p>}
                    {note.href && (
                      <a
                        href={note.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("creditNotes.downloadLabel", { number: isolateFor(locale, note.number) })}
                        className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-800 underline underline-offset-2 hover:text-blue-950 print:hidden"
                      >
                        {t("creditNotes.download")}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {unpaid && bank && (
            <div className="space-y-0.5 border-t border-stone-200 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">{t("transfer.title")}</p>
              {bank.holder && <p className="break-words" dir="auto">{t("transfer.holder", { holder: bank.holder })}</p>}
              <p>
                {t("transfer.rib")}{" "}
                <span dir="ltr" className="font-mono">
                  {bank.ribText}
                </span>
              </p>
              <p>
                {t("transfer.reason")}{" "}
                <span dir="ltr" className="font-mono">
                  {bank.reference}
                </span>
              </p>
            </div>
          )}

          {unpaid && !bank && document_.company.rib && (
            <div className="space-y-0.5 border-t border-stone-200 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">{t("transfer.bankDetails")}</p>
              <p>
                {t("transfer.rib")}{" "}
                <span dir="ltr" className="font-mono">
                  {formatRib(document_.company.rib)}
                </span>
              </p>
            </div>
          )}

          {document_.paymentTerms && (
            <div className="space-y-0.5 border-t border-stone-200 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">{t("terms")}</p>
              <p className="break-words" dir="auto">{document_.paymentTerms}</p>
            </div>
          )}

          {document_.notes && (
            <div className="space-y-0.5 border-t border-stone-200 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">{t("notes")}</p>
              <p className="whitespace-pre-line break-words" dir="auto">{document_.notes}</p>
            </div>
          )}

          {document_.legalMentions && <p className="whitespace-pre-line break-words border-t border-stone-200 pt-3 text-xs text-stone-500 print:text-black" dir="auto">{document_.legalMentions}</p>}
        </article>
      )}
    </section>
  );
}
