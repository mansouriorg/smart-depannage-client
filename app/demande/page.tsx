import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import { RequestWizard } from "@/components/guest/request-wizard";
import { SavedRequests } from "@/components/guest/saved-requests";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("website.metadata.request");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function DemandePage() {
  const t = await getTranslations("website.nav");

  return (
    <div className="flex-1 bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-6 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="gap-2 ps-0 hover:bg-transparent hover:text-blue-600">
            <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" /> {t("backHome")}
          </Button>
        </Link>
      </div>

      <SavedRequests />

      <div className="flex flex-col items-center justify-center">
        <RequestWizard />
      </div>
    </div>
  );
}
