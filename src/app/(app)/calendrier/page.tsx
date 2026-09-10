import { createClient } from "@/lib/supabase/server";
import { formatParis } from "@/lib/formatDate";

export default async function CalendrierPage() {
  const supabase = await createClient();
  const { data: rdv } = await supabase
    .from("rendez_vous")
    .select("*")
    .order("date_heure", { ascending: true });

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
