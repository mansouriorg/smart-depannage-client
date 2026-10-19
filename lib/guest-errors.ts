import { apiErrorMessage, apiErrorStatus, isBotCheckRefusal } from '@/lib/shared';

/** What went wrong when the visitor's form or action was sent, and the sentence to show. */
export type Failure =
  | { kind: 'bot'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'busy'; message: string }
  | { kind: 'server'; message: string }
  | { kind: 'refused'; status: number; message: string };

/**
 * One place that turns a failed call into a sentence, for the request form and for the actions of the tracking page. The
 * server's own sentence is shown for a refusal (a 400, a 404, a 409: "Un compte existe déjà avec ce numéro...") because it
 * says what to do; for a failure of the server or of the connection, nothing it could say would help.
 */
export function failureOf(error: unknown, fallback = 'Une erreur est survenue. Réessayez.'): Failure {
  if (isBotCheckRefusal(error)) {
    return { kind: 'bot', message: 'La vérification de sécurité a échoué. Réessayez : une nouvelle vérification est en cours.' };
  }

  const status = apiErrorStatus(error);

  if (status === null) {
    return { kind: 'network', message: 'Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.' };
  }

  if (status >= 500) {
    return { kind: 'server', message: 'Le service est momentanément indisponible. Réessayez dans un instant.' };
  }

  if (status === 429) {
    return { kind: 'busy', message: apiErrorMessage(error, 'Trop de tentatives depuis cette connexion. Réessayez dans quelques minutes.') };
  }

  return { kind: 'refused', status, message: apiErrorMessage(error, fallback) };
}
