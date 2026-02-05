// src/app/demande/page.tsx
import { DemandeForm } from "@/components/forms/demande-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DemandePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto mb-6">
        <Link href="/">
          <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-blue-600">
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <DemandeForm />
      </div>
    </div>
  );
}