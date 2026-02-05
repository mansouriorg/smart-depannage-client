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
    // CHARTE GLOBALE : Fond Beige Pierre (stone-50) et Texte Bleu Nuit (blue-950)
    <div className="flex flex-col min-h-screen font-sans bg-stone-50 text-stone-800">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-stone-50/90 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-950 tracking-tight">
            <div className="bg-blue-950 text-amber-50 p-1.5 rounded-lg">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span>Smart-Dépannage</span>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-medium text-stone-600">
            <Link href="#services" className="hover:text-blue-900 transition-colors">Services</Link>
            <Link href="#comment-ca-marche" className="hover:text-blue-900 transition-colors">Comment ça marche</Link>
            <Link href="#" className="hover:text-blue-900 transition-colors">Avis clients</Link>
          </nav>
          
          <div className="flex gap-4 items-center">
            <Link href="/login" className="hidden sm:block">
               <Button variant="ghost" size="sm" className="text-stone-600 hover:text-blue-950 hover:bg-stone-100">Espace Pro</Button>
            </Link>
            <Link href="/demande">
              {/* Bouton Bleu Nuit */}
              <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20 border border-blue-950">
                Signaler un problème
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-32 lg:pb-28 bg-stone-50">
        {/* Background Decorative Blob (Beige/Gold) */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-3xl opacity-40 pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            {/* GAUCHE : Texte & CTA */}
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-900/10 bg-white px-4 py-1.5 text-sm font-semibold text-blue-950 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                Intervention rapide 24/7
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-blue-950 sm:text-5xl md:text-6xl leading-[1.1]">
                Votre urgence technique,<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-700">
                  gérée avec excellence.
                </span>
              </h1>
              
              <p className="max-w-xl mx-auto lg:mx-0 text-lg text-stone-600 leading-relaxed">
                Plomberie, Électricité, Serrurerie. Ne laissez pas le hasard décider. 
                Nous localisons l'expert certifié le plus proche pour une intervention soignée.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/demande" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-blue-950 hover:bg-blue-900 text-white text-base h-12 px-8 shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform duration-200">
                    Trouver un dépanneur <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700">
                  Voir les tarifs
                </Button>
              </div>
              
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-sm text-stone-500">
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                </div>
                <p><span className="font-bold text-blue-950">4.9/5</span> de satisfaction client.</p>
              </div>
            </div>

            {/* DROITE : VISUEL APP 3D AMÉLIORÉ */}
            <div className="flex-1 w-full max-w-md lg:max-w-full relative [perspective:1000px]">
              
              {/* Conteneur du téléphone (Rotation et Ombre) */}
              <div className="relative z-10 bg-stone-800 rounded-[2.5rem] shadow-2xl shadow-blue-900/40 border-8 border-stone-800 p-2 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-all duration-700 overflow-hidden">
                 
                 {/* Écran du téléphone */}
                 <div className="bg-stone-900 rounded-[2rem] overflow-hidden aspect-[4/3] flex flex-col relative">
                    
                    {/* --- 1. FOND DE CARTE "DARK MODE" --- */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-blue-950">
                      {/* Motif de rues subtil */}
                      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                        <pattern id="roads" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                          <path d="M30 0 L30 60 M0 30 L60 30" stroke="#ffffff" strokeWidth="1" fill="none"/>
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#roads)"/>
                      </svg>
                      {/* Effet lumineux ville */}
                      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"></div>
                    </div>

                    {/* --- 2. TRAJET & PINS --- */}
                    <div className="absolute inset-0 font-sans z-10">
                        
                        {/* Ligne de trajet animée (SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 300">
                          <path 
                            d="M100,80 Q250,150 320,220" 
                            stroke="#3b82f6" 
                            strokeWidth="4"
                            strokeDasharray="12,12"
                            fill="none"
                            strokeLinecap="round"
                          >
                            <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
                          </path>
                        </svg>

                        {/* PIN CLIENT (Urgence - Haut Gauche) */}
                        <div className="absolute top-[25%] left-[25%] transform -translate-x-1/2 -translate-y-1/2">
                            {/* Halo pulsant */}
                            <div className="absolute -inset-6 bg-amber-500/20 rounded-full animate-ping"></div>
                            {/* Icône */}
                            <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 text-white p-3 rounded-full shadow-lg shadow-amber-500/50 border-2 border-white">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            {/* Label */}
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-stone-900/90 text-stone-100 text-[10px] font-bold px-2 py-1 rounded-md border border-stone-700 whitespace-nowrap backdrop-blur-sm">
                              Votre Position
                            </div>
                        </div>

                        {/* PIN TECHNICIEN (En mouvement - Bas Droite) */}
                        <div className="absolute bottom-[25%] right-[20%] transform translate-x-1/2 translate-y-1/2 z-20">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-2 rounded-full shadow-lg shadow-blue-500/50 border-2 border-white animate-bounce">
                                {/* Icône Camion */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            </div>
                        </div>
                    </div>

                    {/* --- 3. NOTIFICATION DRIVER (Overlay bas) --- */}
                    <div className="absolute bottom-4 left-4 right-4 bg-stone-800/95 backdrop-blur-md p-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-3 z-30 animate-in slide-in-from-bottom-5 duration-1000">
                       <div className="h-10 w-10 bg-stone-600 rounded-full border-2 border-blue-500 overflow-hidden flex-shrink-0 relative">
                         <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-stone-300"></div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="text-sm font-bold text-white truncate">Sami B. (Plombier)</p>
                            <span className="text-[10px] font-bold text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded-full border border-green-900/50">En route</span>
                          </div>
                          <div className="flex justify-between text-xs text-stone-400">
                            <p className="truncate">Peugeot Partner • 185 TN 204</p>
                            <p className="text-blue-400 font-bold ml-2">5 min</p>
                          </div>
                       </div>
                    </div>

                    {/* Barres status téléphone (Faux UI) */}
                    <div className="absolute top-3 left-6 text-[10px] text-white font-medium z-30">09:41</div>
                    <div className="absolute top-3 right-6 flex gap-1 z-30">
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                      <div className="h-2 w-2 bg-white rounded-full"></div>
                      <div className="h-2 w-3 bg-white rounded-[2px]"></div>
                    </div>
                 </div>
              </div>
              
              {/* Ombre portée arrière plan */}
              <div className="absolute top-10 -right-5 w-full h-full bg-stone-200 rounded-[2.5rem] -z-10 rotate-3 opacity-50" />
            </div>

          </div>
        </div>
      </section>

      {/* --- STATS STRIP --- */}
      <div className="border-y border-stone-200 bg-stone-100">
        <div className="container mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="space-y-1">
                    <h4 className="text-3xl font-bold text-blue-900">30 min</h4>
                    <p className="text-sm text-stone-500 font-medium uppercase tracking-wide">Délai moyen</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-3xl font-bold text-blue-900">24/7</h4>
                    <p className="text-sm text-stone-500 font-medium uppercase tracking-wide">Disponibilité</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-3xl font-bold text-blue-900">500+</h4>
                    <p className="text-sm text-stone-500 font-medium uppercase tracking-wide">Experts</p>
                </div>
                <div className="space-y-1">
                    <h4 className="text-3xl font-bold text-blue-900">100%</h4>
                    <p className="text-sm text-stone-500 font-medium uppercase tracking-wide">Sécurisé</p>
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
            <div className="group relative p-8 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-xl hover:border-blue-900/20 hover:-translate-y-1 transition-all duration-300">
              <div className="h-14 w-14 bg-blue-50 text-blue-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-900 group-hover:text-white transition-colors">
                <Wrench className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">Plomberie</h3>
              <p className="text-stone-600 leading-relaxed">
                Fuites d'eau urgentes, débouchage de canalisations, réparation de chauffe-eau et installations sanitaires.
              </p>
            </div>

            {/* Service 2 */}
            <div className="group relative p-8 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-xl hover:border-amber-500/20 hover:-translate-y-1 transition-all duration-300">
              <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Zap className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">Électricité</h3>
              <p className="text-stone-600 leading-relaxed">
                Pannes de courant, mise aux normes, installation de prises et dépannage de tableaux électriques.
              </p>
            </div>

            {/* Service 3 */}
            <div className="group relative p-8 bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-xl hover:border-stone-500/20 hover:-translate-y-1 transition-all duration-300">
              <div className="h-14 w-14 bg-stone-100 text-stone-700 rounded-lg flex items-center justify-center mb-6 group-hover:bg-stone-700 group-hover:text-white transition-colors">
                <Key className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-950">Serrurerie</h3>
              <p className="text-stone-600 leading-relaxed">
                Ouverture de porte claquée ou fermée à clé, changement de serrure haute sécurité et blindage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMMENT CA MARCHE (Fond Bleu Nuit) --- */}
      <section id="comment-ca-marche" className="py-24 bg-blue-950 text-white relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl font-bold text-center mb-20">Le processus simplifié</h2>
          
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            
            {/* Ligne connectrice (Desktop) */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-blue-900 via-stone-500 to-blue-900 opacity-50" />

            {/* Step 1 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stone-50 text-blue-950 text-2xl font-bold relative z-10 shadow-lg group-hover:scale-110 transition-transform">1</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-stone-50">Décrivez le problème</h3>
                <p className="text-blue-200/80 max-w-xs mx-auto">Remplissez le formulaire intelligent, ajoutez une photo et validez votre position.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-900 border border-blue-800 text-stone-50 text-2xl font-bold relative z-10 group-hover:border-amber-500 transition-colors">2</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-stone-50">Expert assigné</h3>
                <p className="text-blue-200/80 max-w-xs mx-auto">Notre équipe identifie le meilleur technicien disponible à proximité.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-900 border border-blue-800 text-stone-50 text-2xl font-bold relative z-10 group-hover:border-green-500 transition-colors">3</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-stone-50">Problème résolu</h3>
                <p className="text-blue-200/80 max-w-xs mx-auto">Le technicien intervient. Vous validez la fin des travaux directement.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-20 bg-stone-100 border-t border-stone-200">
         <div className="container mx-auto px-4 text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-950">Ne laissez pas un souci technique s'aggraver.</h2>
            <p className="text-stone-600 text-lg max-w-2xl mx-auto">Rejoignez les syndics et particuliers qui exigent la qualité.</p>
            <Link href="/demande" className="inline-block">
              <Button size="lg" className="h-14 px-8 text-lg bg-blue-900 hover:bg-blue-800 text-white shadow-xl shadow-blue-900/10">
                Demander une intervention maintenant
              </Button>
            </Link>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 bg-blue-950 text-blue-200/60 text-sm border-t border-blue-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
             <div>
                <div className="flex items-center gap-2 font-bold text-xl text-stone-50 mb-4">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Smart-Dépannage</span>
                </div>
                <p>La référence du dépannage d'urgence en France.</p>
             </div>
             <div>
                <h4 className="font-bold text-stone-50 mb-4">Services</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-white transition">Plomberie</a></li>
                   <li><a href="#" className="hover:text-white transition">Électricité</a></li>
                   <li><a href="#" className="hover:text-white transition">Serrurerie</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-stone-50 mb-4">Entreprise</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-white transition">À propos</a></li>
                   <li><a href="#" className="hover:text-white transition">Contact Pro</a></li>
                </ul>
             </div>
             <div>
                <h4 className="font-bold text-stone-50 mb-4">Légal</h4>
                <ul className="space-y-2">
                   <li><a href="#" className="hover:text-white transition">CGU / CGV</a></li>
                   <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                </ul>
             </div>
          </div>
          <div className="pt-8 border-t border-blue-900/50 flex flex-col md:flex-row justify-between items-center">
            <p>© 2026 Smart-Dépannage.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}