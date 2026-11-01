import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/phone-mockup";
import { Ltr } from "@/components/ltr";
import { GUEST_LIMITS } from "@/lib/shared";
import { 
  Wrench, 
  Zap, 
  Key, 
  ShieldCheck, 
  ArrowRight
} from "lucide-react";

export default async function Home() {
  const t = await getTranslations("website.home");

  return (
    // CHARTE : Fond Beige Pierre (stone-50) & Texte Bleu Nuit (blue-950) pour le contraste
    <div className="flex flex-col flex-1 font-sans bg-stone-50 text-stone-800">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 w-full border-b border-[#D4AF37]/20 bg-stone-50/90 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-950 tracking-tight">
            {/* LOGO : OR MASSIF */}
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white p-1.5 rounded-lg shadow-lg shadow-[#D4AF37]/40 ring-1 ring-[#D4AF37]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span>Smart-Dépannage</span>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-stone-600">
            <Link href="#services" className="hover:text-[#B69121] transition-colors">{t("nav.services")}</Link>
            <Link href="#comment-ca-marche" className="hover:text-[#B69121] transition-colors">{t("nav.how")}</Link>
            <Link href="/demande" className="hover:text-[#B69121] transition-colors">{t("nav.track")}</Link>
          </nav>
          
          <div className="flex gap-4 items-center">
            {/* ✅ MODIFICATION : Lien "Devenir Technicien" */}
            <Link href="/rejoindre" className="hidden sm:block">
               <Button variant="ghost" size="sm" className="text-stone-600 hover:text-[#B69121] hover:bg-[#D4AF37]/10 font-bold">
                 {t("header.join")}
               </Button>
            </Link>
            
            <Link href="/demande">
              {/* BOUTON HEADER : OR */}
              <Button size="sm" className="bg-gradient-to-r from-[#D4AF37] to-[#B69121] hover:from-[#E5C04A] hover:to-[#C7A02C] text-white shadow-md shadow-[#D4AF37]/30 border-none font-semibold">
                {t("header.report")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28 bg-stone-50">
        {/* Background Decorative Blob (OR DOMINANT) */}
        <div className="absolute top-0 end-0 -me-20 -mt-20 w-[700px] h-[700px] bg-[#D4AF37]/15 rounded-full blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 start-0 -ms-20 -mb-20 w-[400px] h-[400px] bg-[#B69121]/10 rounded-full blur-3xl opacity-40 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* GAUCHE : Texte & CTA */}
            <div className="flex-1 text-center lg:text-start space-y-8">
              {/* Badge Or */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-sm font-bold text-[#997b19] shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B69121]"></span>
                </span>
                {t("hero.badge")}
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-blue-950 sm:text-5xl md:text-6xl leading-[1.1]">
                {t("hero.titleFirst")}<br/>
                {/* TITRE PRINCIPAL EN OR DÉGRADÉ */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B69121] via-[#D4AF37] to-[#B69121] drop-shadow-sm">
                  {t("hero.titleSecond")}
                </span>
              </h1>
              
              <p className="max-w-xl mx-auto lg:mx-0 text-lg text-stone-600 leading-relaxed">
                {t("hero.lead")}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/demande" className="w-full sm:w-auto">
                  {/* GROS BOUTON OR MÉTALLIQUE */}
                  <Button size="lg" className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C04A] to-[#B69121] hover:brightness-110 text-white text-base h-14 px-8 shadow-xl shadow-[#D4AF37]/40 hover:scale-105 transition-transform duration-200 font-bold border-t border-[#FFF5D1]/50">
                    {t("hero.cta")} <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" />
                  </Button>
                </Link>
                <Link href="#comment-ca-marche" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full h-14 px-8 border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-medium">
                    {t("nav.how")}
                  </Button>
                </Link>
              </div>
              
              <p className="pt-4 text-sm text-stone-500">
                {t("hero.note")}
              </p>
            </div>

            {/* DROITE : VISUEL APP 3D (Gold Accents) — a drawing, the same in both languages (components/phone-mockup.tsx) */}
            <PhoneMockup />

          </div>
        </div>
      </section>

      {/* --- CE QUE LE SERVICE FAIT (des faits du service, pas des chiffres de performance) --- */}
      <div className="border-y border-[#D4AF37]/20 bg-[#FFFBF0]">
        <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1">
                    <h4 className="text-2xl md:text-3xl font-extrabold text-[#B69121]">{t("facts.noAccount.title")}</h4>
                    <p className="text-sm text-stone-500 font-bold uppercase tracking-wide">{t("facts.noAccount.text")}</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-2xl md:text-3xl font-extrabold text-[#B69121]">{t("facts.sms.title")}</h4>
                    <p className="text-sm text-stone-500 font-bold uppercase tracking-wide">{t("facts.sms.text")}</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-2xl md:text-3xl font-extrabold text-[#B69121]">{t("facts.photos.title")}</h4>
                    <p className="text-sm text-stone-500 font-bold uppercase tracking-wide">{t("facts.photos.text", { max: GUEST_LIMITS.photosTotal })}</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-2xl md:text-3xl font-extrabold text-[#B69121]">{t("facts.approved.title")}</h4>
                    <p className="text-sm text-stone-500 font-bold uppercase tracking-wide">{t("facts.approved.text")}</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="py-20 bg-stone-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">{t("services.title")}</h2>
            <p className="mt-4 text-lg text-stone-600">{t("services.lead")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/50 hover:-translate-y-1 transition-all duration-300">
              {/* ICONE AVEC FOND OR DÉGRADÉ */}
              <div className="h-16 w-16 bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#D4AF37]/30 group-hover:scale-110 transition-transform">
                <Wrench className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">{t("services.plumbing.title")}</h3>
              <p className="text-stone-600 leading-relaxed">
                {t("services.plumbing.text")}
              </p>
            </div>

            {/* Service 2 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/50 hover:-translate-y-1 transition-all duration-300">
              <div className="h-16 w-16 bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#D4AF37]/30 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">{t("services.electricity.title")}</h3>
              <p className="text-stone-600 leading-relaxed">
                {t("services.electricity.text")}
              </p>
            </div>

            {/* Service 3 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/50 hover:-translate-y-1 transition-all duration-300">
              <div className="h-16 w-16 bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#D4AF37]/30 group-hover:scale-110 transition-transform">
                <Key className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">{t("services.locksmith.title")}</h3>
              <p className="text-stone-600 leading-relaxed">
                {t("services.locksmith.text")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMMENT CA MARCHE --- */}
      <section id="comment-ca-marche" className="py-24 bg-[#0f111a] text-white relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 start-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-24 -start-24 w-96 h-96 bg-[#D4AF37] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 end-0 w-96 h-96 bg-[#B69121] rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-20 text-[#F3DFA2]">{t("how.title")}</h2>
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            
            {/* Ligne connectrice (OR) */}
            <div className="hidden md:block absolute top-8 start-[16%] end-[16%] h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

            {/* Step 1 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-900 border-2 border-[#D4AF37] text-[#D4AF37] text-2xl font-bold relative z-10 shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">1</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[#F3DFA2]">{t("how.step1.title")}</h3>
                <p className="text-stone-400 max-w-xs mx-auto">{t("how.step1.text")}</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37] border-2 border-white text-[#0f111a] text-2xl font-bold relative z-10 shadow-[0_0_30px_rgba(212,175,55,0.5)] group-hover:scale-110 transition-transform">2</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[#F3DFA2]">{t("how.step2.title")}</h3>
                <p className="text-stone-400 max-w-xs mx-auto">{t("how.step2.text")}</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-900 border-2 border-[#D4AF37] text-[#D4AF37] text-2xl font-bold relative z-10 shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">3</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[#F3DFA2]">{t("how.step3.title")}</h3>
                <p className="text-stone-400 max-w-xs mx-auto">{t("how.step3.text")}</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-20 bg-stone-50 border-t border-stone-200">
         <div className="container mx-auto px-4 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-950">{t("cta.title")}</h2>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">{t("cta.text")}</p>
            <Link href="/demande" className="inline-block">
              {/* CTA FINALE OR MASSIF */}
              <Button size="lg" className="h-16 px-10 text-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C04A] to-[#B69121] hover:brightness-110 text-white shadow-2xl shadow-[#D4AF37]/40 border-t border-[#FFF5D1]/30 rounded-full font-bold">
                {t("cta.button")}
              </Button>
            </Link>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-[#0f111a] text-stone-400 text-sm border-t border-[#D4AF37]/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
             <div>
                <div className="flex items-center gap-2 font-bold text-xl text-white mb-4">
                  <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
                  <span>Smart-Dépannage</span>
                </div>
                <p>{t("footer.tagline")}</p>
             </div>
             <div>
                <h4 className="font-bold text-white mb-4">{t("footer.services")}</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-[#D4AF37] transition">{t("services.plumbing.title")}</a></li>
                   <li><a href="#" className="hover:text-[#D4AF37] transition">{t("services.electricity.title")}</a></li>
                   <li><a href="#" className="hover:text-[#D4AF37] transition">{t("services.locksmith.title")}</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-white mb-4">{t("footer.company")}</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-[#D4AF37] transition">{t("footer.about")}</a></li>
                   <li><a href="#" className="hover:text-[#D4AF37] transition">{t("footer.contact")}</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-white mb-4">{t("footer.legal")}</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-[#D4AF37] transition">{t("footer.terms")}</a></li>
                   <li><a href="#" className="hover:text-[#D4AF37] transition">{t("footer.privacy")}</a></li>
                </ul>
             </div>
          </div>
          <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center">
            <p><Ltr>© 2026 Smart-Dépannage.</Ltr></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
