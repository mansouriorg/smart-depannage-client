import type { Metadata } from "next";

import { LegalDocumentPage, legalMetadata } from "@/components/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  return legalMetadata("terms");
}

export default function ConditionsPage() {
  return <LegalDocumentPage document="terms" />;
}
