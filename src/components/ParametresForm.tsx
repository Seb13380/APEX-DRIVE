"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profil } from "@/lib/supabase/types";

export function ParametresForm({ email, profil }: { email: string; profil: Profil | null }) {
  const router = useRouter();
  const [nomCommercial, setNomCommercial] = useState(profil?.nom_commercial ?? "");
  const [nomConcession, setNomConcession] = useState(profil?.nom_concession ?? "");
  const [objectifMensuel, setObjectifMensuel] = useState(profil?.objectif_mensuel ?? 0);
  const [enregistrementProfil, setEnregistrementProfil] = useState(false);
  const [messageProfil, setMessageProfil] = useState<string | null>(null);

  const [nouvelEmail, setNouvelEmail] = useState(email);
  const [messageEmail, setMessageEmail] = useState<string | null>(null);
  const [nouveauMdp, setNouveauMdp] = useState("");
  const [messageMdp, setMessageMdp] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const fondInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(profil?.logo_url ?? null);
  const [fondUrl, setFondUrl] = useState(profil?.photo_fond_url ?? null);

  async function enregistrerProfil(e: React.FormEvent) {
    e.preventDefault();
    setEnregistrementProfil(true);
    setMessageProfil(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("profil").upsert(
      {
        user_id: user!.id,
        nom_commercial: nomCommercial,
        nom_concession: nomConcession,
        objectif_mensuel: objectifMensuel,
        logo_url: logoUrl,
        photo_fond_url: fondUrl,
      },
      { onConflict: "user_id" }
    );

    setEnregistrementProfil(false);
    if (error) {
      setMessageProfil(`Erreur : ${error.message}`);
      return;
    }
    setMessageProfil("Profil enregistré.");
    router.refresh();
  }

  async function televerser(fichier: File, dossier: "logo" | "fond") {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const chemin = `${dossier}/${user!.id}/${crypto.randomUUID()}-${fichier.name}`;
    const { error } = await supabase.storage.from("profil").upload(chemin, fichier, {
      upsert: true,
    });
    if (error) {
      setMessageProfil(`Échec de l'upload : ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from("profil").getPublicUrl(chemin);
    if (dossier === "logo") setLogoUrl(data.publicUrl);
    else setFondUrl(data.publicUrl);
  }

  async function changerEmail(e: React.FormEvent) {
    e.preventDefault();
    setMessageEmail(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: nouvelEmail });
    setMessageEmail(
      error ? `Erreur : ${error.message}` : "Vérifie ta boîte mail pour confirmer le changement."
    );
  }

  async function changerMotDePasse(e: React.FormEvent) {
    e.preventDefault();
    setMessageMdp(null);
    if (nouveauMdp.length < 6) {
      setMessageMdp("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: nouveauMdp });
    setMessageMdp(error ? `Erreur : ${error.message}` : "Mot de passe mis à jour.");
    if (!error) setNouveauMdp("");
  }

  async function deconnexion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="row2" style={{ alignItems: "start" }}>
      <div className="panel">
        <div className="panel-head"><h3>Ma concession</h3></div>
        <form onSubmit={enregistrerProfil} className="flex flex-col gap-3">
          <label className="empty-hint" style={{ display: "block" }}>
            Votre nom
            <input
              type="text"
              value={nomCommercial}
              onChange={(e) => setNomCommercial(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="empty-hint" style={{ display: "block" }}>
            Nom de la concession
            <input
              type="text"
              value={nomConcession}
              onChange={(e) => setNomConcession(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="empty-hint" style={{ display: "block" }}>
            Objectif mensuel (nombre de ventes)
            <input
              type="number"
              min={0}
              value={objectifMensuel}
              onChange={(e) => setObjectifMensuel(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </label>

          <div className="empty-hint">
            Logo
            <div className="flex items-center gap-3 mt-1">
              {logoUrl && <img src={logoUrl} alt="Logo" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />}
              <button type="button" className="ai-actions .a" onClick={() => logoInputRef.current?.click()}
                style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "var(--muted)" }}>
                Choisir un fichier
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && televerser(e.target.files[0], "logo")}
              />
            </div>
          </div>

          <div className="empty-hint">
            Photo de fond
            <div className="flex items-center gap-3 mt-1">
              {fondUrl && <img src={fondUrl} alt="Fond" style={{ width: 64, height: 40, borderRadius: 6, objectFit: "cover" }} />}
              <button type="button" onClick={() => fondInputRef.current?.click()}
                style={{ border: "1px solid var(--line)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "var(--muted)" }}>
                Choisir un fichier
              </button>
              <input
                ref={fondInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && televerser(e.target.files[0], "fond")}
              />
            </div>
          </div>

          {messageProfil && <p className="empty-hint" style={{ color: "var(--good)" }}>{messageProfil}</p>}

          <button
            type="submit"
            disabled={enregistrementProfil}
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ alignSelf: "flex-start" }}
          >
            {enregistrementProfil ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Mon compte</h3></div>

        <form onSubmit={changerEmail} className="flex flex-col gap-2" style={{ marginBottom: 20 }}>
          <label className="empty-hint" style={{ display: "block" }}>
            Email
            <input
              type="email"
              value={nouvelEmail}
              onChange={(e) => setNouvelEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          {messageEmail && <p className="empty-hint">{messageEmail}</p>}
          <button type="submit" style={{ alignSelf: "flex-start" }} className="rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)]">
            Changer l&apos;email
          </button>
        </form>

        <form onSubmit={changerMotDePasse} className="flex flex-col gap-2" style={{ marginBottom: 20 }}>
          <label className="empty-hint" style={{ display: "block" }}>
            Nouveau mot de passe
            <input
              type="password"
              value={nouveauMdp}
              onChange={(e) => setNouveauMdp(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--panel-raised)] px-3 py-2 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </label>
          {messageMdp && <p className="empty-hint">{messageMdp}</p>}
          <button type="submit" style={{ alignSelf: "flex-start" }} className="rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--ink)]">
            Changer le mot de passe
          </button>
        </form>

        <button type="button" onClick={deconnexion} className="rounded-md border border-[var(--line)] px-3 py-2 text-sm text-[var(--muted)]">
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
