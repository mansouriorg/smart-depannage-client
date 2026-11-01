import type { Metadata } from "next";

import { LegalDocumentPage, legalMetadata } from "@/components/legal-document";

export async function generateMetadata(): Promise<Metadata> {
  return legalMetadata("privacy");
}

export default function ConfidentialitePage() {
  return <LegalDocumentPage document="privacy" />;
}
