"use client";

import { useState } from "react";
import { Clock, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api"; // ✅ Imported your Axios instance directly

interface ActiveIssueActionsProps {
  interventionId: number;
  token: string;
}

export function ActiveIssueActions({ interventionId, token }: ActiveIssueActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleReport(type: "LATE" | "OTHER") {
    setIsLoading(type);
    
    // Determine the message based on the button clicked
    const message = type === "LATE" 
      ? "Le technicien est en retard." 
      : "Le client signale un problème avec l'artisan sur place.";

    try {
      // ✅ Make the POST request directly here
      await api.post(`/interventions/track/${interventionId}/issue?token=${token}`, {
        issueDescription: message
      });
      
      setSuccessMessage("Votre signalement a été transmis à notre équipe.");
      
      // Hide the success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Erreur lors du signalement:", error);
      alert("Une erreur est survenue.");
    } finally {
      setIsLoading(null);
    }
  }

  if (successMessage) {
    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
        <CheckCircle2 className="h-5 w-5" />
        <p className="font-medium text-sm">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-6 border-t border-stone-200 space-y-3">
      <p className="text-sm font-bold text-stone-500 uppercase tracking-wider">Un problème ?</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          onClick={() => handleReport("LATE")}
          disabled={isLoading !== null}
          variant="outline"
          className="h-12 border-stone-200 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 hover:text-[#B69121] text-stone-600 font-bold transition-all"
        >
          {isLoading === "LATE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
          Signaler un retard
        </Button>

        <Button
          onClick={() => handleReport("OTHER")}
          disabled={isLoading !== null}
          variant="outline"
          className="h-12 border-stone-200 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-stone-600 font-bold transition-all"
        >
          {isLoading === "OTHER" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
          Autre problème
        </Button>
      </div>
    </div>
  );
}