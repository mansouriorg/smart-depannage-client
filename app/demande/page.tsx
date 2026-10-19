import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RequestWizard } from "@/components/guest/request-wizard";
import { SavedRequests } from "@/components/guest/saved-requests";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Demander une intervention | Smart-Dépannage",
  description: "Décrivez votre problème en trois étapes, sans créer de compte. Le lien de suivi vous est envoyé par SMS.",
};

export default function DemandePage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto mb-6 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
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
