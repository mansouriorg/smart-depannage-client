"use client";

import { useState } from "react";
import { Clock, AlertTriangle, Loader2, CheckCircle2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // ✅ Ajout du Textarea
import api from "@/lib/api";

interface ActiveIssueActionsProps {
  interventionId: number;
  token: string;
}

export function ActiveIssueActions({ interventionId, token }: ActiveIssueActionsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Nouveaux états pour gérer le champ de texte libre
  const [showIssueInput, setShowIssueInput] = useState(false);
  const [customIssueText, setCustomIssueText] = useState("");

  async function handleReport(type: "LATE" | "OTHER", customMessage?: string) {
    setIsLoading(type);
    
    // Détermine le message final (soit le retard par défaut, soit le texte saisi par le client)
    const message = type === "LATE" 
      ? "Le technicien est en retard." 
      : customMessage || "Le client a signalé un problème mais n'a pas laissé de détails.";

    try {
      await api.post(`/interventions/track/${interventionId}/issue?token=${token}`, {
        issueDescription: message
      });
      
      setSuccessMessage("Votre signalement a été transmis à notre équipe.");
      setShowIssueInput(false);
      setCustomIssueText(""); // On réinitialise le champ
      
      // Cache le message de succès après 5 secondes
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
    <div className="mt-6 pt-6 border-t border-stone-200 space-y-4">
      <p className="text-sm font-bold text-stone-500 uppercase tracking-wider">Un problème ?</p>
      
      {!showIssueInput ? (
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
            onClick={() => setShowIssueInput(true)} // ✅ Ouvre le champ de texte au lieu d'envoyer directement
            disabled={isLoading !== null}
            variant="outline"
            className="h-12 border-stone-200 hover:border-red-500 hover:bg-red-50 hover:text-red-600 text-stone-600 font-bold transition-all"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Autre problème
          </Button>
        </div>
      ) : (
        /* ✅ Nouveau bloc : Formulaire pour un problème personnalisé */
        <div className="space-y-3 bg-red-50/50 p-4 rounded-xl border border-red-100">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-red-900">Décrivez le problème :</label>
            <button 
              onClick={() => setShowIssueInput(false)}
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <Textarea 
            value={customIssueText}
            onChange={(e) => setCustomIssueText(e.target.value)}
            placeholder="Ex: Le technicien me demande un supplément en espèces..."
            className="min-h-[80px] bg-white border-red-200 focus-visible:ring-red-500"
          />
          
          <Button
            onClick={() => handleReport("OTHER", customIssueText)}
            disabled={isLoading === "OTHER" || customIssueText.trim().length === 0}
            className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
          >
            {isLoading === "OTHER" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer le signalement
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}