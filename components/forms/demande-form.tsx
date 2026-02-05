// src/components/forms/demande-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wrench, Zap, Key, HelpCircle, Loader2, Send } from "lucide-react"; // Icônes

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

  // Initialisation du formulaire
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DemandeFormValues>({
    resolver: zodResolver(demandeSchema),
    defaultValues: {
      type: "PLOMBERIE", // Valeur par défaut
      contactEmail: "",
    },
  });

  // On observe la valeur "type" pour mettre en surbrillance le bon bouton
  const selectedType = watch("type");

  // Fonction d'envoi (Simulation pour l'instant)
  async function onSubmit(data: DemandeFormValues) {
    setIsSubmitting(true);
    
    // Simulation d'appel API (attente 2 secondes)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    console.log("Données envoyées :", data);
    setIsSubmitting(false);
    setIsSuccess(true);
  }

  // Si l'envoi est réussi, on affiche un message de succès
  if (isSuccess) {
    return (
      <Card className="w-full max-w-lg mx-auto border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="mx-auto h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <Send className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold text-green-800">Demande reçue !</h3>
          <p className="text-green-700">
            Notre équipe a bien reçu votre signalement. Un expert va vous contacter dans les plus brefs délais sur votre numéro.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 bg-white">
            Faire une nouvelle demande
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Signaler un problème</CardTitle>
        <CardDescription>
          Remplissez ce formulaire pour qu'un technicien intervienne.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          
          {/* 1. SÉLECTION DU TYPE (Boutons visuels) */}
          <div className="space-y-3">
            <Label>Quel est le type de problème ?</Label>
            <div className="grid grid-cols-2 gap-4">
              {PROBLEM_TYPES.map((type) => {
                // Configuration des icônes et labels pour chaque type
                const icons = {
                  PLOMBERIE: <Wrench className="h-6 w-6 mb-2" />,
                  ELECTRICITE: <Zap className="h-6 w-6 mb-2" />,
                  SERRURERIE: <Key className="h-6 w-6 mb-2" />,
                  AUTRE: <HelpCircle className="h-6 w-6 mb-2" />,
                };
                
                const labels = {
                  PLOMBERIE: "Plomberie",
                  ELECTRICITE: "Électricité",
                  SERRURERIE: "Serrurerie",
                  AUTRE: "Autre",
                };

                const isSelected = selectedType === type;

                return (
                  <div
                    key={type}
                    onClick={() => setValue("type", type)}
                    className={cn(
                      "cursor-pointer flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:bg-slate-50",
                      isSelected 
                        ? "border-blue-600 bg-blue-50 text-blue-700" 
                        : "border-slate-100 text-slate-500"
                    )}
                  >
                    {icons[type]}
                    <span className="font-medium text-sm">{labels[type]}</span>
                  </div>
                );
              })}
            </div>
            {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
          </div>

          {/* 2. DESCRIPTION */}
          <div className="space-y-2">
            <Label htmlFor="desc">Description du problème</Label>
            <Textarea 
              id="desc" 
              placeholder="Ex: Le robinet de la cuisine fuit abondamment..." 
              {...register("description")}
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
          </div>

          {/* 3. ADRESSE */}
          <div className="space-y-2">
            <Label htmlFor="address">Adresse d'intervention</Label>
            <Input 
              id="address" 
              placeholder="Ex: 12 Rue de la République, Tunis" 
              {...register("address")}
            />
            {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
          </div>

          {/* 4. CONTACT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Votre Nom</Label>
              <Input id="name" placeholder="Mohamed Ali" {...register("contactName")} />
              {errors.contactName && <p className="text-red-500 text-sm">{errors.contactName.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" type="tel" placeholder="20 123 456" {...register("contactPhone")} />
              {errors.contactPhone && <p className="text-red-500 text-sm">{errors.contactPhone.message}</p>}
            </div>
          </div>

        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full text-lg h-12" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours...
              </>
            ) : (
              "Envoyer la demande"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}