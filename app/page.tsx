// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, Zap, Key, ShieldCheck, ArrowRight, Smartphone, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* --- HEADER / NAVIGATION --- */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <ShieldCheck className="h-6 w-6" />
            <span>Smart-Dépannage</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <Link href="#services" className="hover:text-blue-600 transition">Services</Link>
            <Link href="#comment-ca-marche" className="hover:text-blue-600 transition">Comment ça marche</Link>
          </nav>
          <div className="flex gap-4">
            <Link href="/login">
               <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Connexion Pro</Button>
            </Link>
            <Link href="/demande">
              <Button size="sm">Signaler un problème</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="flex-1 py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-slate-100">
        <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-6">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
            🚀 Intervention rapide 24/7
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl">
            Un problème technique ? <br/>
            <span className="text-blue-600">On s'occupe de tout.</span>
          </h1>
          <p className="max-w-[700px] text-lg text-slate-600 md:text-xl">
            Plomberie, Électricité, Serrurerie. Signalez votre urgence en quelques clics. 
            Nous localisons le technicien qualifié le plus proche de chez vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Link href="/demande">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-12 gap-2">
                Commencer maintenant <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12">
              En savoir plus
            </Button>
          </div>
        </div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="py-12 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Nos domaines d'intervention</h2>
            <p className="mt-4 text-lg text-slate-600">Des experts qualifiés pour chaque situation.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Wrench className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Plomberie</h3>
              <p className="text-center text-slate-600">Fuites d'eau, canalisations bouchées, réparation de chauffe-eau et installations sanitaires.</p>
            </div>

            {/* Service 2 */}
            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Électricité</h3>
              <p className="text-center text-slate-600">Pannes de courant, mise aux normes, installation de prises et dépannage tableaux électriques.</p>
            </div>

            {/* Service 3 */}
            <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <div className="h-12 w-12 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center mb-4">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Serrurerie</h3>
              <p className="text-center text-slate-600">Ouverture de porte, changement de serrure, blindage et intervention suite à effraction.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMMENT CA MARCHE --- */}
      <section id="comment-ca-marche" className="py-12 md:py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold">1</div>
              <h3 className="text-xl font-bold">Décrivez le problème</h3>
              <p className="text-slate-400">Remplissez le formulaire en ligne, ajoutez une photo et validez votre adresse.</p>
            </div>

            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold">2</div>
              <h3 className="text-xl font-bold">Expert assigné</h3>
              <p className="text-slate-400">Notre équipe interne analyse la demande et envoie le technicien le plus proche.</p>
            </div>

            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold">3</div>
              <h3 className="text-xl font-bold">Problème résolu</h3>
              <p className="text-slate-400">Le technicien intervient. Vous validez la fin des travaux directement sur l'app.</p>
            </div>

          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 bg-slate-950 text-slate-400 text-sm border-t border-slate-800">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p>© 2026 Smart-Dépannage. Tous droits réservés.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition">Mentions légales</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}