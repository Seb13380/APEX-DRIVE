import { createClient } from "@/lib/supabase/server";

export default async function StatistiquesPage() {
  const supabase = await createClient();

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const [{ count: totalClients }, { count: leadsChauds }, { count: rdvMois }, { data: profil }] =
    await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("clients").select("*", { count: "exact", head: true }).eq("statut_lead", "chaud"),
      supabase
        .from("rendez_vous")
        .select("*", { count: "exact", head: true })
        .gte("date_heure", debutMois.toISOString()),
      supabase.from("profil").select("objectif_mensuel").maybeSingle(),
    ]);

  const objectif = profil?.objectif_mensuel ?? 0;

  return (
    <div className="content" style={{ paddingTop: 26 }}>
      <div className="stats">
        <div className="stat">
          <div className="ic">◔</div>
          <div>
            <div className="label">Total clients</div>
            <div className="val">{totalClients ?? 0}</div>
          </div>
        </div>
        <div className="stat">
          <div className="ic">▲</div>
          <div>
            <div className="label">Leads chauds</div>
            <div className="val">{leadsChauds ?? 0}</div>
          </div>
        </div>
        <div className="stat">
          <div className="ic">▤</div>
          <div>
            <div className="label">Rendez-vous ce mois</div>
            <div className="val">{rdvMois ?? 0}</div>
          </div>
        </div>
        <div className="stat">
          <div className="ic">◎</div>
          <div>
            <div className="label">Objectif mensuel</div>
            <div className="val">{objectif}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
