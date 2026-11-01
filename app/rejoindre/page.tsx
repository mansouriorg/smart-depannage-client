"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
import { LegalLink } from "@/components/legal-link";
import api from "@/lib/api"; // ✅ Use your API helper
import { CONSENT_PRIVACY_MARK, CONSENT_TERMS_MARK, TRADE_LIST, consentParts, tradeLabel } from "@/lib/shared";
import { useAppLocale, useOnLanguageChange } from "@/lib/use-app-locale";
import { typedDir } from "@/lib/text-direction";
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
  const t = useTranslations("website.join");
  const tn = useTranslations("website.nav");
  const tRequest = useTranslations("website.request");
  const tc = useTranslations("common.states");
  const locale = useAppLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // The sentences of the last refusal are in the language they were said in: they are let go when the language changes.
  useOnLanguageChange(() => setErrors([]));

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

    const problems = applicationProblems(formData, files, t, locale);

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
      setErrors(serverProblems(err, t("errors.generic")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 font-sans bg-stone-50 text-stone-800">
      
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
            {tn("backHome")}
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-start">
          
          {/* --- GAUCHE : ARGUMENTS --- */}
          <div className="flex-1 space-y-8 animate-in ltr:slide-in-from-left rtl:slide-in-from-right duration-700">
            <div>
              <h1 className="text-4xl lg:text-5xl font-extrabold text-blue-950 tracking-tight mb-4">
                {t("hero.titleFirst")} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r rtl:bg-gradient-to-l from-[#B69121] to-[#D4AF37]">
                  {t("hero.titleSecond")}
                </span>
              </h1>
              <p className="text-lg text-stone-600 leading-relaxed">
                {t("hero.lead")}
              </p>
            </div>

            {/* Avantages */}
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 shrink-0">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-950 text-lg">{t("benefits.income.title")}</h3>
                  <p className="text-stone-500">{t("benefits.income.text")}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#B69121] shrink-0">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-950 text-lg">{t("benefits.admin.title")}</h3>
                  <p className="text-stone-500">{t("benefits.admin.text")}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-12 w-12 bg-stone-100 rounded-xl flex items-center justify-center text-stone-600 shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-950 text-lg">{t("benefits.freedom.title")}</h3>
                  <p className="text-stone-500">{t("benefits.freedom.text")}</p>
                </div>
              </div>
            </div>

            {/* Preuve Sociale */}
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm italic rtl:not-italic text-stone-600">
              {t("testimonial.text")}
              <div className="mt-4 flex items-center gap-3 not-italic">
                <div className="h-10 w-10 bg-stone-200 rounded-full"></div>
                <div>
                  <p className="font-bold text-blue-950 text-sm">{t("testimonial.name")}</p>
                  <p className="text-xs text-[#D4AF37] font-bold">{t("testimonial.role")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- DROITE : FORMULAIRE --- */}
          <div className="flex-1 w-full max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-2xl shadow-stone-200 border border-stone-100 animate-in ltr:slide-in-from-right rtl:slide-in-from-left duration-700">
            
            {isSuccess ? (
              // --- ÉTAT SUCCÈS ---
              <div className="text-center py-12 space-y-6">
                <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-blue-950">{t("success.title")}</h2>
                <p className="text-stone-600">
                  {t("success.thanks", { name: formData.name })} <br/>
                  {t("success.next")}
                </p>
                <Link href="/">
                  <button className="mt-8 w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3 rounded-xl transition-colors">
                    {tn("backHome")}
                  </button>
                </Link>
              </div>
            ) : (
              // --- FORMULAIRE ---
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-blue-950">{t("form.title")}</h2>
                  <p className="text-stone-500 text-sm mt-1">{t("form.subtitle")}</p>
                </div>

                {/* Nom Complet */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">{t("form.name")}</label>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                    placeholder={t("form.namePlaceholder")}
                    dir={typedDir(formData.name)}
                  />
                </div>

                {/* Email & Téléphone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">{t("form.email")}</label>
                    <input
                      name="email"
                      type="email"
                      required
                      dir="ltr"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-start outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                      placeholder="contact@pro.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-500 uppercase">{t("form.phone")}</label>
                    <input
                      name="phone"
                      type="tel"
                      required
                      dir="ltr"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-start outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                      placeholder="+216 ..."
                    />
                  </div>
                </div>

                {/* Métiers: plusieurs, le premier choisi est le principal */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">
                    {t("form.trades")} <span className="font-normal normal-case text-stone-400">{t("form.tradesHint")}</span>
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
                          {trade.code === "AUTRE" ? t("form.tradeOther") : tradeLabel(trade.code, locale)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expérience */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">{t("form.years")}</label>
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
                    placeholder={t("form.yearsPlaceholder")}
                  />
                </div>

                {/* Zones d'intervention */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">
                    {t("form.zones")} <span className="font-normal normal-case text-stone-400">{t("form.zonesHint")}</span>
                  </label>

                  {zonesFailed ? (
                    <p className="text-sm text-red-600">{t("form.zonesFailed")}</p>
                  ) : zones === null ? (
                    <p className="flex items-center gap-2 text-sm text-stone-400"><Loader2 className="h-4 w-4 animate-spin" /> {tc("loading")}</p>
                  ) : zones.length === 0 ? (
                    <p className="text-sm text-red-600">{t("form.zonesNone")}</p>
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
                    {t("form.documents")} <span className="font-normal normal-case text-stone-400">{t("form.documentsHint", { mb: MAX_DOCUMENT_MB })}</span>
                  </label>

                  {([
                    ["identity", t("form.identity"), true],
                    ["company", t("form.companyDocument"), false],
                    ["insurance", t("form.insuranceDocument"), false],
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
                        className="block w-full text-sm text-stone-600 file:me-3 file:rounded-lg file:border-0 file:bg-blue-950 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-900"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-stone-500">{t("form.documentsNote")}</p>
                  {/* What happens to these documents and to the rest of the form (P3-08). */}
                  <p className="text-xs text-stone-500">
                    {consentParts(t("form.privacyLine", { terms: CONSENT_TERMS_MARK, privacy: CONSENT_PRIVACY_MARK })).map((part, index) =>
                      part.kind === "text" ? (
                        <span key={index}>{part.text}</span>
                      ) : part.kind === "privacy" ? (
                        <LegalLink key={index} document="privacy">
                          {tRequest("consent.privacy")}
                        </LegalLink>
                      ) : null,
                    )}
                  </p>
                </div>

                {/* Entreprise (facultatif) */}
                <details className="rounded-xl border border-stone-200 bg-white p-4">
                  <summary className="cursor-pointer text-sm font-medium text-stone-600">{t("form.companySummary")}</summary>
                  <div className="mt-4 space-y-4">
                    <input name="companyName" value={formData.companyName} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder={t("form.companyName")} />
                    <input name="companyNumber" value={formData.companyNumber} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder={t("form.companyNumber")} />
                    <input name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all" placeholder={t("form.insuranceNumber")} />
                  </div>
                </details>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-500 uppercase">{t("form.bio")}</label>
                  <textarea
                    name="bio"
                    rows={3}
                    maxLength={2000}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all"
                    placeholder={t("form.bioPlaceholder")}
                    dir={typedDir(formData.bio)}
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
                      <Loader2 className="h-5 w-5 animate-spin" /> {t("form.processing")}
                    </>
                  ) : (
                    <>
                      {t("form.submit")} <ArrowRight className="h-5 w-5 rtl:-scale-x-100" />
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
