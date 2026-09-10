import { createClient } from "@/lib/supabase/server";

const LABEL_LEAD: Record<string, { texte: string; classe: string }> = {
  chaud: { texte: "Chaud", classe: "badge" },
  tiede: { texte: "Tiède", classe: "badge warm" },
  froid: { texte: "Froid", classe: "badge cool" },
};

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="content" style={{ paddingTop: 26 }}>
      <div className="panel">
        <div className="panel-head">
          <h3>Mes clients <span className="count">{clients?.length ?? 0}</span></h3>
        </div>
        {clients && clients.length > 0 ? (
          clients.map((c) => (
            <div className="client-row" key={c.id}>
              <div>
                <div className="name">{c.nom}</div>
                <span className="sub">
                  {c.vehicule_recherche ?? "Véhicule non renseigné"}
                  {c.budget ? ` · Budget ${c.budget.toLocaleString("fr-FR")} €` : ""}
                  {c.telephone ? ` · ${c.telephone}` : ""}
                </span>
              </div>
              <span className={LABEL_LEAD[c.statut_lead].classe}>{LABEL_LEAD[c.statut_lead].texte}</span>
            </div>
          ))
        ) : (
          <p className="empty-hint">Aucun client enregistré pour le moment.</p>
        )}
      </div>
    </div>
  );
}
