"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client, TypeRdv } from "@/lib/supabase/types";

export function NouveauRdvForm({ clients }: { clients: Pick<Client, "id" | "nom">[] }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [dateHeure, setDateHeure] = useState("");
  const [type, setType] = useState("rdv");
  const [clientId, setClientId] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    setErreur(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("rendez_vous").insert({
      user_id: user!.id,
      titre,
      date_heure: new Date(dateHeure).toISOString(),
      type: type as TypeRdv,
      client_id: clientId || null,
    });

    setChargement(false);
    if (error) {
      setErreur(error.message);
      return;
    }
    setTitre("");
    setDateHeure("");
    setType("rdv");
    setClientId("");
    setOuvert(false);
    router.refresh();
  }

  if (!ouvert) {
    return (
      <button className="link" type="button" onClick={() => setOuvert(true)}>
        + Ajouter un rendez-vous
      </button>
    );
  }

  return (
    <form onSubmit={ajouter} className="inline-form">
      <label>
        Titre
        <input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Essai Macan" />
      </label>
      <label>
        Client (optionnel)
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Aucun</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </label>
      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="appel">Appel</option>
          <option value="rdv">RDV</option>
          <option value="envoi">Envoi</option>
        </select>
      </label>
      <label>
        Date et heure
        <input required type="datetime-local" value={dateHeure} onChange={(e) => setDateHeure(e.target.value)} />
      </label>
      <div className="actions">
        <button type="submit" disabled={chargement} className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white disabled:opacity-60">
          {chargement ? "Ajout..." : "Ajouter"}
        </button>
        <button type="button" onClick={() => setOuvert(false)} style={{ fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
          Annuler
        </button>
        {erreur && <span className="erreur">{erreur}</span>}
      </div>
    </form>
  );
}
