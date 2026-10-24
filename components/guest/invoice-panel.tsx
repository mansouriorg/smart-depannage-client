"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { invoiceDocument, type TrackingInterventionInvoice, type TransferDetails } from "@/lib/shared";
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
  invoice,
  bank,
  onPrinting,
}: {
  invoice: TrackingInterventionInvoice | null | undefined;
  bank: TransferDetails | null;
  /** Tells the page to leave the rest out while the print window is open. */
  onPrinting: (printing: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [printRequested, setPrintRequested] = useState(false);
  const document_ = invoiceDocument(invoice);
  const fileName = document_?.fileName ?? "facture";

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
          {expanded ? "Masquer la facture" : "Voir la facture"}
        </Button>
        {document_.download.kind === "link" ? (
          <a
            href={document_.download.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-stone-200 bg-white px-4 text-sm font-semibold hover:border-[#D4AF37] hover:text-[#B69121]"
          >
            <Download className="h-4 w-4" aria-hidden /> Télécharger le PDF
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
            <Printer className="h-4 w-4" aria-hidden /> Télécharger ou imprimer
          </Button>
        )}
      </div>

      <div role="status" aria-live="polite" className="print:hidden">
        {printRequested && <p className="text-xs text-stone-500">Ouverture de la fenêtre d’impression…</p>}
      </div>

      {document_.download.kind === "print" && <p className="text-xs text-stone-500 print:hidden">Dans la fenêtre d’impression, choisissez « Enregistrer au format PDF » pour garder une copie.</p>}

      {showDocument && (
        <article className="space-y-5 rounded-lg border border-stone-200 p-4 text-sm text-stone-800 print:rounded-none print:border-0 print:p-0 print:text-black" aria-label={document_.title}>
          <header className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              <p className="break-words text-base font-bold text-blue-950 print:text-black">{document_.company.name ?? "Smart-Dépannage"}</p>
              {document_.company.address && <p className="break-words">{document_.company.address}</p>}
              {document_.company.phone && <p>Tél : {document_.company.phone}</p>}
              {document_.company.email && <p className="break-all">{document_.company.email}</p>}
              {document_.company.taxId && <p>Matricule fiscal : {document_.company.taxId}</p>}
            </div>
            <div className="space-y-0.5 sm:text-right">
              <p className="text-base font-bold text-blue-950 print:text-black">{document_.title}</p>
              {document_.issuedText && <p>{document_.issuedText}</p>}
              <p className="font-semibold">{document_.statusWords}</p>
            </div>
          </header>

          {(document_.client.name || document_.client.address || document_.client.phone || document_.client.email) && (
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">Facturé à</p>
              {document_.client.name && <p className="break-words font-semibold">{document_.client.name}</p>}
              {document_.client.address && <p className="break-words">{document_.client.address}</p>}
              {document_.client.phone && <p>{document_.client.phone}</p>}
              {document_.client.email && <p className="break-all">{document_.client.email}</p>}
            </div>
          )}

          {(document_.service || document_.address) && (
            <div className="space-y-0.5">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">Intervention</p>
              {document_.service && <p className="break-words">{document_.service}</p>}
              {document_.address && <p className="break-words">{document_.address}</p>}
            </div>
          )}

          {document_.lines.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-stone-300 text-xs uppercase tracking-wider text-stone-500 print:text-black">
                    <th scope="col" className="py-2 pr-2 font-bold">
                      Désignation
                    </th>
                    <th scope="col" className="hidden px-2 py-2 text-right font-bold sm:table-cell">
                      Qté
                    </th>
                    <th scope="col" className="hidden px-2 py-2 text-right font-bold sm:table-cell">
                      Prix unitaire
                    </th>
                    <th scope="col" className="py-2 pl-2 text-right font-bold">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {document_.lines.map((line, index) => (
                    <tr key={`${line.label}-${index}`} className="break-inside-avoid border-b border-stone-100 align-top">
                      <td className="py-2 pr-2">
                        <span className="break-words font-medium">{line.label}</span>
                        {line.description && <span className="block break-words text-xs text-stone-500 print:text-black">{line.description}</span>}
                        {/* On a narrow screen the quantity and the unit price go under the name, as on the quote. */}
                        <span className="block text-xs text-stone-500 sm:hidden">
                          {line.quantityText} × {line.unitText}
                        </span>
                      </td>
                      <td className="hidden px-2 py-2 text-right sm:table-cell">{line.quantityText}</td>
                      <td className="hidden whitespace-nowrap px-2 py-2 text-right sm:table-cell">{line.unitText}</td>
                      <td className="whitespace-nowrap py-2 pl-2 text-right font-medium">{line.totalText}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <dl className="ml-auto w-full max-w-xs space-y-1">
            <div className="flex justify-between gap-3">
              <dt>Total HT</dt>
              <dd className="font-medium">{document_.totals.subtotalText}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{document_.totals.taxLabel}</dt>
              <dd className="font-medium">{document_.totals.taxText}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-stone-300 pt-2 text-base font-bold">
              <dt>Total TTC</dt>
              <dd>{document_.totals.totalText}</dd>
            </div>
          </dl>

          {unpaid && bank && (
            <div className="space-y-0.5 border-t border-stone-200 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-500 print:text-black">Règlement par virement</p>
              {bank.holder && <p className="break-words">Bénéficiaire : {bank.holder}</p>}
              <p>
                RIB : <span className="font-mono">{bank.ribText}</span>
              </p>
              <p>
                Motif du virement : <span className="font-mono">{bank.reference}</span>
              </p>
            </div>
          )}

          {document_.notes && <p className="whitespace-pre-line break-words border-t border-stone-200 pt-3">{document_.notes}</p>}
        </article>
      )}
    </section>
  );
}
