// src/components/forms/demande-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench, Zap, Key, HelpCircle, Loader2, Send, CheckCircle2 } from "lucide-react";

// Import des composants UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Import du schéma et des types
import { demandeSchema, type DemandeFormValues, PROBLEM_TYPES } from "@/lib/schemas/demande-schema";
import { cn } from "@/lib/utils";

export function DemandeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DemandeFormValues>({
    resolver: zodResolver(demandeSchema),
    defaultValues: {
      type: "PLOMBERIE",
      contactEmail: "",
    },
  });

  const selectedType = watch("type");

  async function onSubmit(data: DemandeFormValues) {
    setIsSubmitting(true);
    // Simulation API
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log("Données envoyées :", data);
    setIsSubmitting(false);
    setIsSuccess(true);
  }

  // --- ÉCRAN DE SUCCÈS ---
  if (isSuccess) {
    return (
      <Card className="w-full max-w-lg mx-auto border-stone-200 bg-white shadow-2xl shadow-blue-900/10 overflow-hidden">
        {/* Bandeau supérieur vert */}
        <div className="h-2 w-full bg-green-500" />
        
        <CardContent className="pt-10 pb-10 text-center space-y-6">
          <div className="mx-auto h-20 w-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center border-4 border-green-100">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-blue-950">Demande confirmée !</h3>
            <p className="text-stone-600 max-w-xs mx-auto">
              Votre signalement a été transmis à notre équipe technique. Un expert va vous contacter d'ici 15 minutes.
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 text-sm text-stone-500">
            Gardez votre téléphone à proximité, nous allons vous appeler sur le numéro indiqué.
          </div>

          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4 border-stone-200 hover:bg-stone-50 text-stone-700 w-full"
          >
            Faire une nouvelle demande
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- FORMULAIRE ---
  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl shadow-blue-900/10 border-stone-200 bg-white">
      <CardHeader className="space-y-1 pb-6 border-b border-stone-100 bg-stone-50/50 rounded-t-xl">
        <CardTitle className="text-2xl font-bold text-blue-950">
          Signaler un problème
        </CardTitle>
        <CardDescription className="text-stone-500 text-base">
          Remplissez ce formulaire pour une intervention rapide.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-8 pt-8">
          
          {/* 1. SÉLECTION DU TYPE */}
          <div className="space-y-4">
            <Label className="text-stone-700 font-semibold text-sm uppercase tracking-wide">
              Type de problème
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {PROBLEM_TYPES.map((type) => {
                const isSelected = selectedType === type;

                // Configuration icônes
                const Icon = {
                  PLOMBERIE: Wrench,
                  ELECTRICITE: Zap,
                  SERRURERIE: Key,
                  AUTRE: HelpCircle,
                }[type];
                
                const label = {
                  PLOMBERIE: "Plomberie",
                  ELECTRICITE: "Électricité",
                  SERRURERIE: "Serrurerie",
                  AUTRE: "Autre",
                }[type];

                return (
                  <div
                    key={type}
                    onClick={() => setValue("type", type)}
                    className={cn(
                      "cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                      // STYLE SÉLECTIONNÉ : Bordure Bleu Nuit, Fond léger, Texte foncé
                      isSelected 
                        ? "border-blue-900 bg-blue-50/50 text-blue-950 shadow-md ring-1 ring-blue-900/10" 
                        // STYLE NON SÉLECTIONNÉ : Gris pierre, hover beige
                        : "border-stone-200 bg-white text-stone-500 hover:border-amber-400/50 hover:bg-stone-50 hover:text-stone-700"
                    )}
                  >
                    <Icon className={cn(
                      "h-8 w-8 mb-3 transition-colors",
                      // L'icône devient Ambre (Doré) quand sélectionnée
                      isSelected ? "text-amber-500 fill-amber-500/10" : "text-stone-400"
                    )} />
                    <span className="font-bold text-sm">{label}</span>
                  </div>
                );
              })}
            </div>
            {errors.type && <p className="text-red-500 text-sm font-medium">{errors.type.message}</p>}
          </div>

          {/* 2. DESCRIPTION */}
          <div className="space-y-3">
            <Label htmlFor="desc" className="text-stone-700 font-semibold">Description détaillée</Label>
            <Textarea 
              id="desc" 
              placeholder="Ex: Le robinet de la cuisine fuit abondamment..." 
              className="min-h-[100px] border-stone-200 focus-visible:ring-blue-900 bg-stone-50/30"
              {...register("description")}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>

          {/* 3. ADRESSE */}
          <div className="space-y-3">
            <Label htmlFor="address" className="text-stone-700 font-semibold">Adresse d'intervention</Label>
            <Input 
              id="address" 
              placeholder="Ex: 12 Rue de la République, Tunis" 
              className="h-11 border-stone-200 focus-visible:ring-blue-900 bg-stone-50/30"
              {...register("address")}
            />
            {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
          </div>

          {/* 4. CONTACT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-stone-700 font-semibold">Votre Nom</Label>
              <Input 
                id="name" 
                placeholder="Mohamed Ali" 
                className="h-11 border-stone-200 focus-visible:ring-blue-900 bg-stone-50/30"
                {...register("contactName")} 
              />
              {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="phone" className="text-stone-700 font-semibold">Téléphone</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="20 123 456" 
                className="h-11 border-stone-200 focus-visible:ring-blue-900 bg-stone-50/30"
                {...register("contactPhone")} 
              />
              {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone.message}</p>}
            </div>
          </div>

        </CardContent>

        <CardFooter className="pb-8 pt-2">
          <Button 
            type="submit" 
            className="w-full text-lg h-14 bg-blue-900 hover:bg-blue-800 text-white shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.01]" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Envoi en cours...
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span>Envoyer la demande</span>
                <Send className="h-5 w-5" />
              </div>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}