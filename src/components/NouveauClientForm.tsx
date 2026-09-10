"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { StatutLead } from "@/lib/supabase/types";

export function NouveauClientForm() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [vehicule, setVehicule] = useState("");
  const [budget, setBudget] = useState("");
  const [statutLead, setStatutLead] = useState("tiede");
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

    const { error } = await supabase.from("clients").insert({
      user_id: user!.id,
      nom,
      telephone: telephone || null,
      vehicule_recherche: vehicule || null,
      budget: budget ? Number(budget) : null,
      statut_lead: statutLead as StatutLead,
    });

    setChargement(false);
    if (error) {
      setErreur(error.message);
      return;
    }
    setNom("");
    setTelephone("");
    setVehicule("");
    setBudget("");
    setStatutLead("tiede");
    setOuvert(false);
    router.refresh();
  }

  if (!ouvert) {
    return (
      <button className="link" type="button" onClick={() => setOuvert(true)}>
        + Ajouter un client
      </button>
    );
  }

  return (
    <form onSubmit={ajouter} className="inline-form">
      <label>
        Nom
        <input required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. M. Dupont" />
      </label>
      <label>
        Téléphone
        <input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06..." />
      </label>
      <label>
        Véhicule recherché
        <input value={vehicule} onChange={(e) => setVehicule(e.target.value)} placeholder="Ex. Porsche 911" />
      </label>
      <label>
        Budget (€)
        <input type="number" min={0} value={budget} onChange={(e) => setBudget(e.target.value)} />
      </label>
      <label>
        Statut du lead
        <select value={statutLead} onChange={(e) => setStatutLead(e.target.value)}>
          <option value="chaud">Chaud</option>
          <option value="tiede">Tiède</option>
          <option value="froid">Froid</option>
        </select>
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
