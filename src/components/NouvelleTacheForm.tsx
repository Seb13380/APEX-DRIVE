"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client, PrioriteTache } from "@/lib/supabase/types";

export function NouvelleTacheForm({ clients }: { clients: Pick<Client, "id" | "nom">[] }) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [titre, setTitre] = useState("");
  const [priorite, setPriorite] = useState("normale");
  const [echeance, setEcheance] = useState("");
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

    const { error } = await supabase.from("taches").insert({
      user_id: user!.id,
      titre,
      priorite: priorite as PrioriteTache,
      echeance: echeance ? new Date(echeance).toISOString() : null,
      client_id: clientId || null,
    });

    setChargement(false);
    if (error) {
      setErreur(error.message);
      return;
    }
    setTitre("");
    setEcheance("");
    setClientId("");
    setOuvert(false);
    router.refresh();
  }

  if (!ouvert) {
    return (
      <button className="link" type="button" onClick={() => setOuvert(true)}>
        + Ajouter une tâche
      </button>
    );
  }

  return (
    <form onSubmit={ajouter} className="inline-form">
      <label>
        Titre
        <input required value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Rappeler M. Dupont" />
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
        Priorité
        <select value={priorite} onChange={(e) => setPriorite(e.target.value)}>
          <option value="basse">Basse</option>
          <option value="normale">Normale</option>
          <option value="haute">Haute</option>
        </select>
      </label>
      <label>
        Échéance
        <input type="datetime-local" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
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
