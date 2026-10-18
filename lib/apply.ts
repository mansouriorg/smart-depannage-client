/**
 * The artisan application form (P1-11): what is checked before sending, and how the request is
 * made. One multipart request: the fields as JSON in `data`, the documents as files. The server
 * checks everything again (and reads the first bytes of each file); this only saves a round trip.
 */
import { apiErrorBody, apiErrorStatus } from "./shared";

export const MAX_DOCUMENT_MB = 5;
export const MAX_DOCUMENT_BYTES = MAX_DOCUMENT_MB * 1024 * 1024;
export const DOCUMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const DOCUMENT_ACCEPT = DOCUMENT_TYPES.join(",");

export interface ApplicationForm {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyNumber: string;
  insuranceNumber: string;
  /** Trade labels, in the order picked: the first is the main one. */
  trades: string[];
  yearsExperience: string;
  bio: string;
  /** Numbers from GET /service-zones. */
  zoneIds: number[];
}

export interface ApplicationFiles {
  identity: File | null;
  company: File | null;
  insurance: File | null;
}

export const EMPTY_FORM: ApplicationForm = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  companyNumber: "",
  insuranceNumber: "",
  trades: [],
  yearsExperience: "0",
  bio: "",
  zoneIds: [],
};

/** Why a chosen file cannot be sent, or null. A missing file is a problem only when required. */
export function documentProblem(file: File | null | undefined, label: string, required: boolean): string | null {
  if (!file) return required ? `${label} : ajoutez un fichier.` : null;

  if (!(DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
    return `${label} : envoyez une photo (JPEG, PNG, WebP) ou un PDF.`;
  }

  if (file.size > MAX_DOCUMENT_BYTES) return `${label} : ${MAX_DOCUMENT_MB} Mo au maximum.`;
  if (file.size === 0) return `${label} : le fichier est vide.`;

  return null;
}

/** Everything wrong with the form, one sentence each; empty when it can be sent. */
export function applicationProblems(form: ApplicationForm, files: ApplicationFiles): string[] {
  const problems: string[] = [];

  if (!form.name.trim()) problems.push("Indiquez votre nom.");
  if (!form.email.trim()) problems.push("Indiquez votre e-mail.");
  if (!form.phone.trim()) problems.push("Indiquez votre téléphone.");
  if (!form.trades.length) problems.push("Choisissez au moins un métier.");
  if (!form.zoneIds.length) problems.push("Choisissez au moins une zone d’intervention.");

  const years = Number(form.yearsExperience);

  if (form.yearsExperience.trim() === "" || !Number.isInteger(years) || years < 0 || years > 60) {
    problems.push("Les années d’expérience doivent être un nombre entier entre 0 et 60.");
  }

  for (const [file, label, required] of [
    [files.identity, "Pièce d’identité", true],
    [files.company, "Document de l’entreprise", false],
    [files.insurance, "Attestation d’assurance", false],
  ] as const) {
    const problem = documentProblem(file, label, required);

    if (problem) problems.push(problem);
  }

  return problems;
}

/** The `data` field: only what the server's form knows (it refuses any other field). */
export function applicationData(form: ApplicationForm): string {
  const optional = (value: string) => value.trim() || undefined;

  return JSON.stringify({
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    companyName: optional(form.companyName),
    companyNumber: optional(form.companyNumber),
    insuranceNumber: optional(form.insuranceNumber),
    specialty: form.trades[0],
    specialties: form.trades,
    yearsExperience: Number(form.yearsExperience),
    bio: optional(form.bio),
    zoneIds: form.zoneIds,
  });
}

export function applicationFormData(form: ApplicationForm, files: ApplicationFiles): FormData {
  const body = new FormData();

  body.append("data", applicationData(form));

  if (files.identity) body.append("identityDocument", files.identity);
  if (files.company) body.append("companyDocument", files.company);
  if (files.insurance) body.append("insuranceCertificate", files.insurance);

  return body;
}

export function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/**
 * What the server refused, one problem per line. A form with several mistakes comes back as a
 * list ("L'e-mail n'est pas valide.", "Choisissez au moins une zone..."), and each is shown on its
 * own line; a failure of the server, or no answer at all, gives the fallback sentence.
 */
export function serverProblems(error: unknown, fallback: string): string[] {
  const status = apiErrorStatus(error);

  if (status !== null && status >= 500) return [fallback];

  const body = apiErrorBody(error);
  const messages = Array.isArray(body?.message) ? body.message : typeof body?.message === "string" ? [body.message] : [];
  const issues = Array.isArray(body?.issues) ? body.issues : [];

  const lines = [...messages, ...issues]
    .filter((line): line is string => typeof line === "string")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length ? [...new Set(lines)] : [fallback];
}
