/* i18n-physical-ok: a drawing of a map and a route, drawn the same in both languages. Its container is dir="ltr", so the pins, the
   route and the tilt keep their places; only the words (and the notification card, which reads like any other card) follow the language. */
import { getLocale, getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

import { directionOf, localeOrDefault } from "@/lib/shared";

/** The picture of the phone on the home page: a route, the customer's pin, the technician's pin and a notification. */
export async function PhoneMockup() {
  const t = await getTranslations("website.home.mock");
  const dir = directionOf(localeOrDefault(await getLocale()));

  return (
    <div dir="ltr" className="flex-1 w-full max-w-md lg:max-w-full relative [perspective:1000px]">
    
      {/* Conteneur du téléphone */}
      <div className="relative z-10 bg-stone-800 rounded-[2.5rem] shadow-2xl shadow-[#D4AF37]/20 border-[6px] border-stone-700 p-2 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-all duration-700 overflow-hidden">
       
         {/* Écran */}
         <div className="bg-stone-900 rounded-[2rem] overflow-hidden aspect-[4/3] flex flex-col relative">
          
            {/* --- 1. FOND DE CARTE --- */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c2e] to-[#0f111a]">
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <pattern id="roads" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M30 0 L30 60 M0 30 L60 30" stroke="#ffffff" strokeWidth="1" fill="none"/>
                </pattern>
                <rect width="100%" height="100%" fill="url(#roads)"/>
              </svg>
              {/* Glow Or au centre */}
              <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-2xl"></div>
            </div>

            {/* --- 2. UI CARTE (OR) --- */}
            <div className="absolute inset-0 font-sans z-10">
              
                {/* Ligne de trajet (OR BRILLANT) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
                  <path 
                    d="M100,80 Q250,150 320,220" 
                    stroke="#FFD700" /* Or vif pour le tracé */
                    strokeWidth="3"
                    strokeDasharray="8,8"
                    fill="none"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]"
                  >
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                  </path>
                </svg>

                {/* PIN CLIENT (OR) */}
                <div className="absolute top-[25%] left-[25%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute -inset-6 bg-[#D4AF37]/30 rounded-full animate-ping"></div>
                    <div className="relative bg-gradient-to-br from-[#F3DFA2] to-[#B69121] text-white p-3 rounded-full shadow-lg shadow-[#D4AF37]/40 border-2 border-white">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#B69121] text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                      {t("you")}
                    </div>
                </div>

                {/* PIN TECHNICIEN */}
                <div className="absolute bottom-[25%] right-[20%] transform translate-x-1/2 translate-y-1/2 z-20">
                    <div className="bg-gradient-to-br from-stone-700 to-stone-900 text-[#D4AF37] p-2 rounded-full shadow-lg border border-[#D4AF37] animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                    </div>
                </div>
            </div>

            {/* --- 3. NOTIFICATION (Bordure Or) --- */}
            <div dir={dir} className="absolute bottom-4 left-4 right-4 bg-stone-900/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-[#D4AF37]/50 flex items-center gap-3 z-30 animate-in slide-in-from-bottom-5 duration-1000">
               <div className="h-10 w-10 bg-stone-800 rounded-full border-2 border-[#D4AF37] overflow-hidden flex-shrink-0 relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37] to-[#8a6c12]"></div>
               </div>
               <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-sm font-bold text-white truncate">{t("title")}</p>
                    <span className="text-[10px] font-bold text-[#F3DFA2] bg-[#D4AF37]/20 px-1.5 py-0.5 rounded-full border border-[#D4AF37]/30">{t("example")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-400">
                    <p className="truncate">{t("text")}</p>
                  </div>
               </div>
            </div>

         </div>
      </div>
      {/* Ombre portée */}
      <div className="absolute top-10 -right-5 w-full h-full bg-[#D4AF37]/10 rounded-[2.5rem] -z-10 rotate-3 opacity-50 blur-sm" />
    </div>
  );
}
