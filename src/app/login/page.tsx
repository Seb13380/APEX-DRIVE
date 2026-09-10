"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const [lienMagiqueOuvert, setLienMagiqueOuvert] = useState(false);
  const [lienEnvoye, setLienEnvoye] = useState(false);

  async function seConnecter(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
    setChargement(false);
    if (error) {
      setErreur(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message
      );
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function envoyerLienMagique(e: React.FormEvent) {
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
    setLienEnvoye(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-[var(--panel)] p-8">
        <h1 className="mb-1 font-serif text-2xl text-[var(--ink)]">Car AutoPilote</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">
          Connecte-toi avec ton email et ton mot de passe.
        </p>

        {!lienMagiqueOuvert ? (
          <>
            <form onSubmit={seConnecter} className="flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="ton.email@concession.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
              <input
                type="password"
                required
                placeholder="Mot de passe"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className="rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
              {erreur && <p className="text-xs text-red-400">{erreur}</p>}
              <button
                type="submit"
                disabled={chargement}
                className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {chargement ? "Connexion..." : "Se connecter"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setLienMagiqueOuvert(true);
                setErreur(null);
              }}
              className="mt-4 text-xs text-[var(--muted)] underline"
            >
              Pas encore de mot de passe ? Recevoir un lien de connexion par email
            </button>
          </>
        ) : lienEnvoye ? (
          <p className="text-sm text-[var(--good)]">
            Lien de connexion envoyé à {email}. Vérifie ta boîte mail, puis va dans{" "}
            <strong>Paramètres → Mon compte</strong> pour définir un mot de passe.
          </p>
        ) : (
          <form onSubmit={envoyerLienMagique} className="flex flex-col gap-3">
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
            <button
              type="button"
              onClick={() => setLienMagiqueOuvert(false)}
              className="text-xs text-[var(--muted)] underline"
            >
              ← Retour à la connexion par mot de passe
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
