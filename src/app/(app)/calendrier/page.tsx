import { createClient } from "@/lib/supabase/server";
import { formatParis } from "@/lib/formatDate";
import { NouveauRdvForm } from "@/components/NouveauRdvForm";
import { DeleteButton } from "@/components/DeleteButton";

export default async function CalendrierPage() {
  const supabase = await createClient();
  const [{ data: rdv }, { data: clients }] = await Promise.all([
    supabase.from("rendez_vous").select("*").order("date_heure", { ascending: true }),
    supabase.from("clients").select("id, nom").order("nom"),
  ]);

  const parJour = new Map<string, typeof rdv>();
  for (const r of rdv ?? []) {
    const cle = formatParis(r.date_heure, "yyyy-MM-dd");
    const liste = parJour.get(cle) ?? [];
    liste.push(r);
    parJour.set(cle, liste);
  }

  return (
    <div className="content" style={{ paddingTop: 26 }}>
      <div className="panel">
        <div className="panel-head"><h3>Calendrier</h3></div>
        <NouveauRdvForm clients={clients ?? []} />
        {parJour.size > 0 ? (
          Array.from(parJour.entries()).map(([jour, items]) => (
            <div key={jour} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6, textTransform: "capitalize" }}>
                {formatParis(jour, "EEEE d MMMM yyyy")}
              </div>
              {items!.map((r) => (
                <div className="agenda-row" key={r.id}>
                  <div className="time mono">{formatParis(r.date_heure, "HH:mm")}</div>
                  <div className="bar" />
                  <div className="titlewrap">
                    <div className="t">{r.titre}</div>
                    <span className="s">{r.type}</span>
                  </div>
                  <DeleteButton table="rendez_vous" id={r.id} />
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="empty-hint">Aucun rendez-vous planifié.</p>
        )}
      </div>
    </div>
  );
}
