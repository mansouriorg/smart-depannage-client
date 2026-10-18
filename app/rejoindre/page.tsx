"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Briefcase, 
  Wallet, 
  Clock,
  FileText
} from "lucide-react";
import api from "@/lib/api"; // ✅ Use your API helper
import { TRADE_LIST } from "@/lib/shared";
import {
  type ApplicationFiles,
  type ApplicationForm,
  DOCUMENT_ACCEPT,
  EMPTY_FORM,
  MAX_DOCUMENT_MB,
  applicationFormData,
  applicationProblems,
  serverProblems,
  toggled,
} from "@/lib/apply";

interface ZoneChoice {
  id: number;
  name: string;
  city: string | null;
}

export default function JoinPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState<ApplicationForm>(EMPTY_FORM);
  const [files, setFiles] = useState<ApplicationFiles>({ identity: null, company: null, insurance: null });

  // The zones come from the platform's list (the governorates): an applicant picks, never types.
  const [zones, setZones] = useState<ZoneChoice[] | null>(null);
  const [zonesFailed, setZonesFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<ZoneChoice[] | { data: ZoneChoice[] }>("/service-zones")
      .then((response) => {
        if (cancelled) return;

        const body = response.data;

        setZones(Array.isArray(body) ? body : body.data);
      })
      .catch(() => {
        if (!cancelled) setZonesFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const pickFile = (key: keyof ApplicationFiles) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles((prev) => ({ ...prev, [key]: e.target.files?.[0] ?? null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const problems = applicationProblems(formData, files);

    if (problems.length) {
      setErrors(problems);
      window.scrollTo({ top: 0, behavior: "smooth" });

      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      // One multipart request: the fields as JSON in `data`, the documents as files.
      await api.post("/artisans/apply", applicationFormData(formData, files), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsSuccess(true);
      window.scrollTo(0, 0); // Scroll to top to see success message
    } catch (err) {
      // The server's own sentences (an e-mail already used, a file it cannot read...), one per line.
      setErrors(serverProblems(err, "Une erreur est survenue. Veuillez réessayer."));
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
                  Si votre candidature est retenue, vous recevrez par e-mail un lien pour choisir votre mot de passe.
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
                  <label className="text-xs font-bold text-stone-500 uppercase">Nom complet</label>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                    placeholder="Ex: Karim Tounsi"
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
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
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
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                      placeholder="+216 ..."
                    />
                  </div>
                </div>

                {/* Métiers: plusieurs, le premier choisi est le principal */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">
                    Vos métiers <span className="font-normal normal-case text-stone-400">(le premier choisi est le principal)</span>
                  </label>
                  {/* Les métiers du serveur (P1-10): un mot qu'il ne connaît pas est refusé. */}
                  <div className="flex flex-wrap gap-2">
                    {TRADE_LIST.map((trade) => {
                      const on = formData.trades.includes(trade.label);
                      const main = formData.trades[0] === trade.label;

                      return (
                        <button
                          type="button"
                          key={trade.code}
                          aria-pressed={on}
                          onClick={() => setFormData((prev) => ({ ...prev, trades: toggled(prev.trades, trade.label) }))}
                          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                            on ? "border-blue-950 bg-blue-950 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                          }`}
                        >
                          {main ? "★ " : ""}
                          {trade.code === "AUTRE" ? "Autre / polyvalent" : trade.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expérience */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Années d'expérience</label>
                  <input
                    name="yearsExperience"
                    type="number"
                    min="0"
                    max="60"
                    step="1"
                    required
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all sm:w-40"
                    placeholder="Ex: 5"
                  />
                </div>

                {/* Zones d'intervention */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">
                    Où acceptez-vous de travailler ? <span className="font-normal normal-case text-stone-400">(une zone au moins)</span>
                  </label>

                  {zonesFailed ? (
                    <p className="text-sm text-red-600">La liste des zones n'a pas pu être chargée. Rechargez la page.</p>
                  ) : zones === null ? (
                    <p className="flex items-center gap-2 text-sm text-stone-400"><Loader2 className="h-4 w-4 animate-spin" /> Chargement…</p>
                  ) : zones.length === 0 ? (
                    <p className="text-sm text-red-600">Aucune zone n'est proposée pour le moment. Réessayez plus tard ou contactez-nous.</p>
                  ) : (
                    <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-xl border border-stone-100 bg-stone-50 p-2">
                      {zones.map((zone) => {
                        const on = formData.zoneIds.includes(zone.id);

                        return (
                          <button
                            type="button"
                            key={zone.id}
                            aria-pressed={on}
                            onClick={() => setFormData((prev) => ({ ...prev, zoneIds: toggled(prev.zoneIds, zone.id) }))}
                            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                              on ? "border-[#B69121] bg-[#D4AF37] text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                            }`}
                          >
                            {zone.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-stone-500 uppercase">
                    Documents <span className="font-normal normal-case text-stone-400">(photo ou PDF, {MAX_DOCUMENT_MB} Mo max)</span>
                  </label>

                  {([
                    ["identity", "Pièce d'identité (obligatoire)", true],
                    ["company", "Document de l'entreprise (facultatif)", false],
                    ["insurance", "Attestation d'assurance (facultatif)", false],
                  ] as const).map(([key, label, required]) => (
                    <div key={key} className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-3">
                      <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-stone-700">
                        <FileText className="h-4 w-4 text-[#B69121]" /> {label}
                      </div>
                      <input
                        type="file"
                        accept={DOCUMENT_ACCEPT}
                        required={required}
                        onChange={pickFile(key)}
                        className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-950 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-900"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-stone-400">Vos documents ne sont vus que par notre équipe de vérification.</p>
                </div>

                {/* Entreprise (facultatif) */}
                <details className="rounded-xl border border-stone-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-600">Entreprise (facultatif)</summary>
                  <div className="mt-4 space-y-4">
                    <input name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="Nom de l'entreprise" />
                    <input name="companyNumber" value={formData.companyNumber} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="Matricule fiscal / registre de commerce" />
                    <input name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder="N° de police d'assurance" />
                  </div>
                </details>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">Pourquoi vous ?</label>
                  <textarea
                    name="bio"
                    rows={3}
                    maxLength={2000}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                    placeholder="Certifications, spécialités, réalisations..."
                  />
                </div>

                {/* Messages d'erreur */}
                {errors.length > 0 && (
                  <div role="alert" className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 space-y-1">
                    {errors.map((message) => (
                      <div key={message} className="flex items-start gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> <span>{message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || zonesFailed || zones?.length === 0}
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
