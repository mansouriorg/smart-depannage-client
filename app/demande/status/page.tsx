import { notFound } from "next/navigation";
import { FeedbackForm } from "@/components/forms/feedback-form"; 
import { ActiveIssueActions } from "@/components/forms/active-issue-actions"; // ✅ NEW: Import active actions
import { CheckCircle2 } from "lucide-react";

async function getInterventionStatus(id: string, token: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${API_URL}/interventions/track/${id}?token=${token}`, {
    cache: 'no-store' 
  });
  
  if (!res.ok) return null;
  return res.json();
}

// ✅ CORRECTION NEXT.JS 15 : searchParams est maintenant une Promise
export default async function TrackingPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ id?: string; token?: string }> 
}) {
  // ✅ CORRECTION NEXT.JS 15 : On utilise await avant d'extraire les variables
  const { id, token } = await searchParams;

  if (!id || !token) {
    return (
      <main className="min-h-screen bg-stone-50 text-blue-950 p-6 flex items-center justify-center">
        <h1 className="text-2xl font-bold uppercase tracking-tighter">Lien de suivi invalide.</h1>
      </main>
    );
  }

  const intervention = await getInterventionStatus(id, token);

  if (!intervention) return notFound();

  return (
    <main className="min-h-screen bg-stone-50 p-6 font-sans flex justify-center items-start pt-10">
      <div className="w-full max-w-lg bg-white shadow-2xl shadow-[#D4AF37]/10 rounded-xl border border-stone-200 overflow-hidden">
        
        {/* Header - Raccord avec ton design premium */}
        <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] to-[#B69121]" />
        <div className="p-6 border-b border-stone-100 bg-stone-50/50">
          <h1 className="text-2xl font-bold text-blue-950">
            Intervention #{intervention.id}
          </h1>
          <p className="text-stone-500 font-medium mt-1">
            {intervention.serviceType} • {intervention.address}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* STATE 1: PENDING */}
          {intervention.status === "PENDING" && (
            <div className="border border-[#D4AF37]/30 p-8 bg-[#D4AF37]/5 rounded-xl flex flex-col items-center text-center">
              <div className="w-4 h-4 bg-[#D4AF37] rounded-full animate-ping mb-6"></div>
              <h2 className="text-xl font-bold text-[#B69121]">Traitement en cours</h2>
              <p className="mt-2 text-stone-600 font-medium">
                Nous cherchons le meilleur technicien disponible pour votre zone.
              </p>
            </div>
          )}

          {/* STATE 2: ACCEPTED or IN_PROGRESS */}
          {(intervention.status === "ACCEPTED" || intervention.status === "IN_PROGRESS") && (
            <div className="space-y-4">
              <div className="bg-blue-950 text-white p-4 rounded-xl shadow-md">
                <h2 className="text-lg font-bold">Technicien Assigné</h2>
              </div>
              
              <div className="border border-stone-200 rounded-xl p-6 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-950">{intervention.artisan?.name}</p>
                    <p className="text-[#B69121] font-bold mt-1">{intervention.artisan?.phone}</p>
                  </div>
                </div>

                {/* ✅ NEW: Boutons pour signaler un retard ou un problème en cours de route */}
                <ActiveIssueActions interventionId={intervention.id} token={token} />
              </div>
            </div>
          )}

          {/* STATE 3: COMPLETED (Waiting for Feedback) */}
          {intervention.status === "COMPLETED" && !intervention.rating && (
            <FeedbackForm interventionId={intervention.id} token={token} />
          )}

          {/* STATE 4: COMPLETED & RATED (Thank You) */}
          {intervention.status === "COMPLETED" && intervention.rating && (
            <div className="border border-[#D4AF37]/30 p-8 text-center bg-[#D4AF37]/5 rounded-xl">
              <CheckCircle2 className="h-12 w-12 text-[#D4AF37] mx-auto mb-4" />
              <h2 className="text-xl font-bold text-blue-950">Merci pour votre retour.</h2>
              <p className="mt-2 text-stone-600 font-medium">Votre avis a bien été enregistré.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}