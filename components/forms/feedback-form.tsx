"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Loader2, Send, Check } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
  interventionId: number;
  token: string;
}

export function FeedbackForm({ interventionId, token }: FeedbackFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [isOnTime, setIsOnTime] = useState<boolean | null>(null);
  const [hasIssue, setHasIssue] = useState<boolean>(false);
  const [notes, setNotes] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return alert("Veuillez donner une note sur 5.");
    if (isOnTime === null) return alert("Veuillez indiquer si le technicien était à l'heure.");

    setIsSubmitting(true);
    try {
      await api.patch(`/interventions/track/${interventionId}/feedback?token=${token}`, {
        rating,
        isOnTime,
        hasIssue,
        feedbackNotes: notes,
      });
      
      // Refresh the page to show the "Thank You" state
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'envoi du feedback:", error);
      alert("Erreur lors de l'envoi. Veuillez réessayer.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="border border-stone-200 rounded-xl p-6 bg-white shadow-sm space-y-8 mt-4">
      <h2 className="text-xl font-bold text-blue-950 border-b border-stone-100 pb-4">
        Clôture de l'intervention
      </h2>

      {/* Rating Stars */}
      <div className="space-y-3">
        <label className="block font-bold text-stone-700 text-sm">Note globale</label>
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star 
                className={cn(
                  "h-10 w-10 stroke-[1.5px] transition-colors duration-300", 
                  rating >= star 
                    ? "fill-[#D4AF37] text-[#D4AF37] drop-shadow-md" 
                    : "fill-stone-50 text-stone-300 hover:text-[#D4AF37]/50"
                )} 
              />
            </button>
          ))}
        </div>
      </div>

      {/* On Time Buttons */}
      <div className="space-y-3">
        <label className="block font-bold text-stone-700 text-sm">Le technicien était-il à l'heure ?</label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setIsOnTime(true)}
            className={cn(
              "py-3 rounded-xl border-2 font-bold transition-all duration-300",
              isOnTime === true 
                ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#B69121] shadow-sm" 
                : "bg-stone-50 border-stone-200 text-stone-500 hover:border-[#D4AF37]/40 hover:text-[#B69121]"
            )}
          >
            Oui
          </button>
          <button
            type="button"
            onClick={() => setIsOnTime(false)}
            className={cn(
              "py-3 rounded-xl border-2 font-bold transition-all duration-300",
              isOnTime === false 
                ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#B69121] shadow-sm" 
                : "bg-stone-50 border-stone-200 text-stone-500 hover:border-[#D4AF37]/40 hover:text-[#B69121]"
            )}
          >
            Non
          </button>
        </div>
      </div>

      {/* Issue Toggle */}
      <div className="flex items-center space-x-3 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={() => setHasIssue(!hasIssue)}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center transition-all duration-200 border-2",
            hasIssue 
              ? "border-[#D4AF37] bg-[#D4AF37]" 
              : "border-stone-300 bg-stone-50 hover:border-[#D4AF37]/50"
          )}
        >
          {hasIssue && <Check className="w-4 h-4 text-white stroke-[3]" />}
        </button>
        <label 
          className="font-bold text-stone-700 text-sm cursor-pointer select-none" 
          onClick={() => setHasIssue(!hasIssue)}
        >
          Signaler un problème
        </label>
      </div>

      {/* Notes Textarea */}
      <div className="space-y-3">
        <label className="block font-bold text-stone-700 text-sm">
          {hasIssue ? "Détails du problème" : "Un commentaire ? (Optionnel)"}
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={hasIssue ? "Veuillez expliquer le problème rencontré..." : "Ex: Service rapide et efficace !"}
          className="min-h-[100px] border-stone-200 rounded-xl focus-visible:ring-[#D4AF37] focus-visible:border-[#D4AF37] bg-stone-50/50 placeholder:text-stone-400"
          required={hasIssue}
        />
      </div>

      <Button 
        type="submit" 
        disabled={isSubmitting || rating === 0 || isOnTime === null}
        className="w-full text-lg h-14 bg-gradient-to-r from-[#D4AF37] to-[#B69121] hover:from-[#E5C04A] hover:to-[#C7A02C] text-white shadow-xl shadow-[#D4AF37]/20 rounded-xl border-t border-[#FFF5D1]/30 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
      >
        {isSubmitting ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <div className="flex items-center gap-2 font-bold">
            <span>Soumettre l'avis</span>
            <Send className="h-5 w-5" />
          </div>
        )}
      </Button>
    </form>
  );
}