"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function envoyerLien(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setChargement(false);
    if (error) {
      setErreur(error.message);
      return;
    }
    setEnvoye(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--panel)] p-8">
        <h1 className="mb-1 font-serif text-2xl text-[var(--ink)]">Car AutoPilote</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Connecte-toi avec ton email pour accéder à ton copilote commercial.
        </p>

        {envoye ? (
          <p className="text-sm text-[var(--good)]">
            Lien de connexion envoyé à {email}. Vérifie ta boîte mail.
          </p>
        ) : (
          <form onSubmit={envoyerLien} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="ton.email@concession.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
            {erreur && <p className="text-xs text-red-400">{erreur}</p>}
            <button
              type="submit"
              disabled={chargement}
              className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {chargement ? "Envoi..." : "Recevoir le lien de connexion"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
