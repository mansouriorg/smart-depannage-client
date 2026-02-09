"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Briefcase, 
  Wallet, 
  Clock 
} from "lucide-react";
import api from "@/lib/api"; // ✅ Use your API helper

export default function JoinPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "Plombier", // Default value
    experience: 0,
    description: "",
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "experience" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 🚀 POST to your NestJS endpoint
      await api.post("/artisan-applications", formData);
      setIsSuccess(true);
      window.scrollTo(0, 0); // Scroll to top to see success message
    } catch (err: any) {
      console.error("Application failed:", err);
      if (err.response?.status === 400) {
        setError("Cet email a déjà envoyé une candidature.");
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-stone-50 text-stone-800">
      
      {/* --- HEADER SIMPLE --- */}
      <header className="w-full border-b border-[#D4AF37]/20 bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-950">
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white p-1.5 rounded-lg shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span>Smart-Dépannage</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-stone-500 hover:text-[#B69121] transition-colors">
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
          
          {/* --- GAUCHE : ARGUMENTS --- */}
          <div className="flex-1 space-y-8 animate-in slide-in-from-left duration-700">
            <div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight mb-4">
                Rejoignez l'élite des <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B69121] to-[#D4AF37]">
                  artisans certifiés.
                </span>
              </h1>
              <p className="text-lg text-stone-600 leading-relaxed">
                Boostez votre chiffre d'affaires sans effort commercial. Nous vous envoyons des missions qualifiées, proches de chez vous.
              </p>
            </div>

            {/* Avantages */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 shrink-0">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-950 text-lg">Revenus Garantis</h3>
                  <p className="text-stone-500">Paiement sécurisé et rapide après chaque intervention validée.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#B69121] shrink-0">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-950 text-lg">Zéro Administratif</h3>
                  <p className="text-stone-500">Nous gérons la facturation et le service client. Concentrez-vous sur votre métier.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-950 text-lg">Liberté Totale</h3>
                  <p className="text-stone-500">Acceptez ou refusez les missions selon votre emploi du temps.</p>
                </div>
              </div>
            </div>

            {/* Preuve Sociale */}
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm italic text-stone-600">
              "Depuis que j'ai rejoint Smart-Dépannage, mon agenda est plein et je n'ai plus à courir après les impayés."
              <div className="mt-4 flex items-center gap-3 not-italic">
                <div className="h-10 w-10 bg-stone-200 rounded-full"></div>
                <div>
                  <p className="font-bold text-blue-950 text-sm">Karim S.</p>
                  <p className="text-xs text-[#D4AF37] font-bold">Plombier Partenaire</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- DROITE : FORMULAIRE --- */}
          <div className="flex-1 w-full max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-2xl shadow-stone-200 border border-stone-100 animate-in slide-in-from-right duration-700">
            
            {isSuccess ? (
              // --- ÉTAT SUCCÈS ---
              <div className="text-center py-12 space-y-6">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-blue-950">Candidature envoyée !</h2>
                <p className="text-stone-600">
                  Merci {formData.name}. Notre équipe va examiner votre profil. <br/>
                  Si votre candidature est retenue, vous recevrez vos accès sous 24h.
                </p>
                <Link href="/">
                  <button className="mt-8 w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 rounded-xl transition-colors">
                    Retour à l'accueil
                  </button>
                </Link>
              </div>
            ) : (
              // --- FORMULAIRE ---
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-blue-950">Devenir Partenaire</h2>
                  <p className="text-stone-500 text-sm mt-1">Remplissez ce formulaire pour postuler.</p>
                </div>

                {/* Nom Complet */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Nom de l'entreprise / Artisan</label>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                    placeholder="Ex: Tounsi Plomberie"
                  />
                </div>

                {/* Email & Téléphone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Email Pro</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                      placeholder="contact@pro.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Téléphone</label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                      placeholder="+216 ..."
                    />
                  </div>
                </div>

                {/* Spécialité & Expérience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Spécialité</label>
                    <div className="relative">
                      <select
                        name="specialty"
                        value={formData.specialty}
                        onChange={handleChange}
                        className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                      >
                        <option value="Plombier">Plombier</option>
                        <option value="Électricien">Électricien</option>
                        <option value="Serrurier">Serrurier</option>
                        <option value="Chauffagiste">Chauffagiste</option>
                        <option value="Vitrier">Vitrier</option>
                        <option value="Climatisation">Climatisation</option>
                      </select>
                      {/* Chevron custom */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">Années d'expérience</label>
                    <input
                      name="experience"
                      type="number"
                      min="0"
                      required
                      value={formData.experience}
                      onChange={handleChange}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                      placeholder="Ex: 5"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Pourquoi vous ?</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]"
                    placeholder="Certifications, zones d'intervention..."
                  />
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                     <ShieldCheck className="h-4 w-4" /> {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B69121] hover:brightness-110 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Traitement...
                    </>
                  ) : (
                    <>
                      Envoyer ma candidature <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      </main>

    </div>
  );
}