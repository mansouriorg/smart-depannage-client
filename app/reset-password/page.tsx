"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import api from "@/lib/api";

/**
 * Landing page of the one-time links sent by the API:
 *   - new artisan / staff account: "choose your password";
 *   - "forgot password".
 * Link format: /reset-password?token=<token>
 * The API call is POST /auth/reset-password { token, newPassword }.
 */

// Same rules as the API (ResetPasswordDto).
function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Au moins 8 caractères.";
  if (!/[A-Z]/.test(password)) return "Au moins une majuscule.";
  if (!/[0-9]/.test(password)) return "Au moins un chiffre.";
  return null;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();

  // The token is read ONCE, at the first render. Removing it from the address
  // bar below changes `searchParams` (Next.js keeps them in sync with the
  // History API), so it must not be read again from there.
  const [token] = useState<string | null>(() => searchParams.get("token"));
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Take the token out of the address bar, so it does not stay in the history
  // or leak through a Referer header.
  useEffect(() => {
    if (token) {
      window.history.replaceState(null, "", "/reset-password");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const problem = passwordProblem(password);

    if (problem) {
      setError(problem);
      return;
    }

    if (password !== confirmation) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setIsDone(true);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Trop de tentatives. Réessayez dans quelques minutes.");
      } else if (err.response?.status === 400 || err.response?.status === 401) {
        setError(
          "Ce lien n'est plus valable (expiré ou déjà utilisé). Demandez un nouveau lien.",
        );
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-stone-50 text-stone-800">
      <header className="w-full border-b border-[#D4AF37]/20 bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-950">
            <div className="bg-gradient-to-br from-[#D4AF37] to-[#B69121] text-white p-1.5 rounded-lg shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span>Smart-Dépannage</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex justify-center">
        <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm p-8">
          {isDone ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h1 className="text-2xl font-bold text-blue-950">Mot de passe enregistré</h1>
              <p className="text-stone-600">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe
                dans l&apos;application.
              </p>
              <Link href="/" className="inline-block text-sm font-medium text-[#B69121] hover:underline">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-blue-950">Lien incomplet</h1>
              <p className="text-stone-600">
                Ouvrez le lien tel que vous l&apos;avez reçu, ou demandez-en un nouveau.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#D4AF37]/15 text-[#B69121]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold text-blue-950">Choisissez votre mot de passe</h1>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700" htmlFor="password">
                  Nouveau mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <p className="text-xs text-stone-500">
                  8 caractères minimum, avec une majuscule et un chiffre.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700" htmlFor="confirmation">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#B69121] py-3 font-bold text-white shadow-md hover:brightness-110 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Enregistrement...
                  </>
                ) : (
                  "Enregistrer le mot de passe"
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
