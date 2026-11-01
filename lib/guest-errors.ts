import { DEFAULT_LOCALE, apiErrorMessage, apiErrorStatus, errorText, isBotCheckRefusal, type Locale } from '@/lib/shared';

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
 * says what to do (the server writes it in the language the call asked for); for a failure of the server or of the connection,
 * nothing it could say would help. The sentences that are ours come from the catalogue, in `locale`.
 */
export function failureOf(error: unknown, fallback?: string, locale: Locale = DEFAULT_LOCALE): Failure {
  if (isBotCheckRefusal(error)) {
    return { kind: 'bot', message: errorText('botCheck', locale) };
  }

  const status = apiErrorStatus(error);

  if (status === null) {
    return { kind: 'network', message: errorText('network', locale) };
  }

  if (status >= 500) {
    return { kind: 'server', message: errorText('server', locale) };
  }

  if (status === 429) {
    return { kind: 'busy', message: apiErrorMessage(error, errorText('tooManyAttempts', locale)) };
  }

  return { kind: 'refused', status, message: apiErrorMessage(error, fallback ?? errorText('generic', locale)) };
}
