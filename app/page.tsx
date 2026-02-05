// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Zap, 
  Key, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Star
} from "lucide-react";

export default function Home() {
  return (
    // CHARTE : Fond Beige Pierre (stone-50) & Texte Bleu Nuit (blue-950) pour le contraste
    <div className="flex flex-col min-h-screen font-sans bg-stone-50 text-stone-800">
      
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
            <Link href="#services" className="hover:text-[#B69121] transition-colors">Services</Link>
            <Link href="#comment-ca-marche" className="hover:text-[#B69121] transition-colors">Comment ça marche</Link>
            <Link href="#" className="hover:text-[#B69121] transition-colors">Avis clients</Link>
          </nav>
          
          <div className="flex gap-4 items-center">
            <Link href="/login" className="hidden sm:block">
               <Button variant="ghost" size="sm" className="text-stone-600 hover:text-[#B69121] hover:bg-[#D4AF37]/10">Espace Pro</Button>
            </Link>
            <Link href="/demande">
              {/* BOUTON HEADER : OR */}
              <Button size="sm" className="bg-gradient-to-r from-[#D4AF37] to-[#B69121] hover:from-[#E5C04A] hover:to-[#C7A02C] text-white shadow-md shadow-[#D4AF37]/30 border-none font-semibold">
                Signaler un problème
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28 bg-stone-50">
        {/* Background Decorative Blob (OR DOMINANT) */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[700px] h-[700px] bg-[#D4AF37]/15 rounded-full blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-[#B69121]/10 rounded-full blur-3xl opacity-40 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* GAUCHE : Texte & CTA */}
            <div className="flex-1 text-center lg:text-left space-y-8">
              {/* Badge Or */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5 text-sm font-bold text-[#997b19] shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B69121]"></span>
                </span>
                Intervention rapide 24/7
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-blue-950 sm:text-5xl md:text-6xl leading-[1.1]">
                Votre urgence technique,<br/>
                {/* TITRE PRINCIPAL EN OR DÉGRADÉ */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B69121] via-[#D4AF37] to-[#B69121] drop-shadow-sm">
                  gérée avec excellence.
                </span>
              </h1>
              
              <p className="max-w-xl mx-auto lg:mx-0 text-lg text-stone-600 leading-relaxed">
                Plomberie, Électricité, Serrurerie. Ne laissez pas le hasard décider. 
                Nous localisons l'expert certifié le plus proche pour une intervention soignée.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/demande" className="w-full sm:w-auto">
                  {/* GROS BOUTON OR MÉTALLIQUE */}
                  <Button size="lg" className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C04A] to-[#B69121] hover:brightness-110 text-white text-base h-14 px-8 shadow-xl shadow-[#D4AF37]/40 hover:scale-105 transition-transform duration-200 font-bold border-t border-[#FFF5D1]/50">
                    Trouver un dépanneur <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-medium">
                  Voir les tarifs
                </Button>
              </div>
              
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-sm text-stone-500">
                <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((i) => (
                         <Star key={i} className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
                    ))}
                </div>
                <p><span className="font-bold text-[#997b19]">4.9/5</span> de satisfaction client.</p>
              </div>
            </div>

            {/* DROITE : VISUEL APP 3D (Gold Accents) */}
            <div className="flex-1 w-full max-w-md lg:max-w-full relative [perspective:1000px]">
              
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
                              Vous
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
                    <div className="absolute bottom-4 left-4 right-4 bg-stone-900/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-[#D4AF37]/50 flex items-center gap-3 z-30 animate-in slide-in-from-bottom-5 duration-1000">
                       <div className="h-10 w-10 bg-stone-800 rounded-full border-2 border-[#D4AF37] overflow-hidden flex-shrink-0 relative">
                         <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37] to-[#8a6c12]"></div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="text-sm font-bold text-white truncate">Sami B. (Plombier)</p>
                            <span className="text-[10px] font-bold text-[#F3DFA2] bg-[#D4AF37]/20 px-1.5 py-0.5 rounded-full border border-[#D4AF37]/30">En route</span>
                          </div>
                          <div className="flex justify-between text-xs text-stone-400">
                            <p className="truncate">Peugeot Partner • 185 TN</p>
                            <p className="text-[#D4AF37] font-bold ml-2">5 min</p>
                          </div>
                       </div>
                    </div>

                 </div>
              </div>
              {/* Ombre portée */}
              <div className="absolute top-10 -right-5 w-full h-full bg-[#D4AF37]/10 rounded-[2.5rem] -z-10 rotate-3 opacity-50 blur-sm" />
            </div>

          </div>
        </div>
      </section>

      {/* --- STATS STRIP (Dominante Or) --- */}
      <div className="border-y border-[#D4AF37]/20 bg-[#FFFBF0]">
        <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1">
                    <h4 className="text-4xl font-extrabold text-[#B69121]">30 min</h4>
                    <p className="text-sm text-stone-500 font-bold uppercase tracking-wide">Délai moyen</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-4xl font-extrabold text-[#B69121]">24/7</h4>
                    <p className="text-sm text-stone-500 font-bold uppercase tracking-wide">Disponibilité</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-4xl font-extrabold text-[#B69121]">500+</h4>
                    <p className="text-sm text-stone-500 font-bold uppercase tracking-wide">Experts</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-4xl font-extrabold text-[#B69121]">100%</h4>
                    <p className="text-sm text-stone-500 font-bold uppercase tracking-wide">Sécurisé</p>
                </div>
            </div>
        </div>
      </div>

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="py-20 bg-stone-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">Nos domaines d'expertise</h2>
            <p className="mt-4 text-lg text-stone-600">Nous ne faisons pas tout, mais ce que nous faisons, nous le maîtrisons parfaitement.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/50 hover:-translate-y-1 transition-all duration-300">
              {/* ICONE AVEC FOND OR DÉGRADÉ */}
              <div className="h-16 w-16 bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#D4AF37]/30 group-hover:scale-110 transition-transform">
                <Wrench className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">Plomberie</h3>
              <p className="text-stone-600 leading-relaxed">
                Fuites d'eau urgentes, débouchage de canalisations, réparation de chauffe-eau et installations sanitaires.
              </p>
            </div>

            {/* Service 2 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/50 hover:-translate-y-1 transition-all duration-300">
              <div className="h-16 w-16 bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#D4AF37]/30 group-hover:scale-110 transition-transform">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">Électricité</h3>
              <p className="text-stone-600 leading-relaxed">
                Pannes de courant, mise aux normes, installation de prises et dépannage de tableaux électriques.
              </p>
            </div>

            {/* Service 3 */}
            <div className="group relative p-8 bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-xl hover:shadow-[#D4AF37]/10 hover:border-[#D4AF37]/50 hover:-translate-y-1 transition-all duration-300">
              <div className="h-16 w-16 bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#D4AF37]/30 group-hover:scale-110 transition-transform">
                <Key className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">Serrurerie</h3>
              <p className="text-stone-600 leading-relaxed">
                Ouverture de porte claquée ou fermée à clé, changement de serrure haute sécurité et blindage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMMENT CA MARCHE --- */}
      <section id="comment-ca-marche" className="py-24 bg-[#0f111a] text-white relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#D4AF37] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#B69121] rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-20 text-[#F3DFA2]">Le processus simplifié</h2>
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            
            {/* Ligne connectrice (OR) */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />

            {/* Step 1 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-900 border-2 border-[#D4AF37] text-[#D4AF37] text-2xl font-bold relative z-10 shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">1</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[#F3DFA2]">Décrivez le problème</h3>
                <p className="text-stone-400 max-w-xs mx-auto">Remplissez le formulaire intelligent, ajoutez une photo et validez votre position.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37] border-2 border-white text-[#0f111a] text-2xl font-bold relative z-10 shadow-[0_0_30px_rgba(212,175,55,0.5)] group-hover:scale-110 transition-transform">2</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[#F3DFA2]">Expert assigné</h3>
                <p className="text-stone-400 max-w-xs mx-auto">Notre équipe identifie le meilleur technicien disponible à proximité.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-900 border-2 border-[#D4AF37] text-[#D4AF37] text-2xl font-bold relative z-10 shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:scale-110 transition-transform">3</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-[#F3DFA2]">Problème résolu</h3>
                <p className="text-stone-400 max-w-xs mx-auto">Le technicien intervient. Vous validez la fin des travaux directement.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-20 bg-stone-50 border-t border-stone-200">
         <div className="container mx-auto px-4 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-950">Ne laissez pas un souci technique s'aggraver.</h2>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">Rejoignez les syndics et particuliers qui exigent la qualité.</p>
            <Link href="/demande" className="inline-block">
              {/* CTA FINALE OR MASSIF */}
              <Button size="lg" className="h-16 px-10 text-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C04A] to-[#B69121] hover:brightness-110 text-white shadow-2xl shadow-[#D4AF37]/40 border-t border-[#FFF5D1]/30 rounded-full font-bold">
                Demander une intervention maintenant
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
                <p>La référence du dépannage d'urgence en France.</p>
             </div>
             <div>
                <h4 className="font-bold text-white mb-4">Services</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-[#D4AF37] transition">Plomberie</a></li>
                   <li><a href="#" className="hover:text-[#D4AF37] transition">Électricité</a></li>
                   <li><a href="#" className="hover:text-[#D4AF37] transition">Serrurerie</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-white mb-4">Entreprise</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-[#D4AF37] transition">À propos</a></li>
                   <li><a href="#" className="hover:text-[#D4AF37] transition">Contact Pro</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-white mb-4">Légal</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-[#D4AF37] transition">CGU / CGV</a></li>
                   <li><a href="#" className="hover:text-[#D4AF37] transition">Confidentialité</a></li>
                </ul>
             </div>
          </div>
          <div className="pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between items-center">
            <p>© 2026 Smart-Dépannage.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}