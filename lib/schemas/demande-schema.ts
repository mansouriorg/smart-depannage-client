// src/lib/schemas/demande-schema.ts
import { z } from "zod";
import { TRADE_CODES } from "@/lib/shared";

// 1. Définition des types: les métiers du serveur (P1-10). Ce sont aussi les types de service d'une demande,
// il n'y a donc plus de table de correspondance à tenir à jour ici.
export const PROBLEM_TYPES = TRADE_CODES;

export const demandeSchema = z.object({
  // CORRECTION: On utilise la propriété 'error' qui est acceptée par votre version
  type: z.enum(PROBLEM_TYPES, {
    error: "Veuillez sélectionner une catégorie valide.",
  }),

  description: z.string().min(10, {
    message: "Décrivez le problème en au moins 10 caractères.",
  }).max(500, {
    message: "La description ne peut pas dépasser 500 caractères.",
  }),

  address: z.string().min(5, {
    message: "Veuillez entrer une adresse complète.",
  }),

  // Optionnels
  latitude: z.number().optional(),
  longitude: z.number().optional(),

  contactName: z.string().min(2, {
    message: "Votre nom est requis.",
  }),
  
  contactPhone: z.string().regex(/^[0-9]{8,}$/, {
    message: "Numéro de téléphone invalide (8 chiffres minimum).",
  }),

  contactEmail: z.string().email({
    message: "Email invalide.",
  }).optional().or(z.literal("")),
});

export type DemandeFormValues = z.infer<typeof demandeSchema>;
