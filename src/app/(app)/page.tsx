import { createClient } from "@/lib/supabase/server";
import { formatParis } from "@/lib/formatDate";
import { TodoCheck } from "@/components/TodoCheck";
import { NouvelleTacheForm } from "@/components/NouvelleTacheForm";
import { DeleteButton } from "@/components/DeleteButton";

const LABEL_LEAD: Record<string, { texte: string; classe: string }> = {
  chaud: { texte: "Chaud", classe: "badge" },
  tiede: { texte: "Tiède", classe: "badge warm" },
  froid: { texte: "Froid", classe: "badge cool" },
};

export default async function AccueilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);
  const finJour = new Date();
  finJour.setHours(23, 59, 59, 999);

  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);

  const [{ data: profil }, { data: taches }, { data: rdvJour }, { data: clients }, { data: notes }, { count: ventesMois }] =
    await Promise.all([
      supabase.from("profil").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase
        .from("taches")
        .select("*")
        .order("echeance", { ascending: true })
        .limit(6),
      supabase
        .from("rendez_vous")
        .select("*")
        .gte("date_heure", debutJour.toISOString())
        .lte("date_heure", finJour.toISOString())
        .order("date_heure", { ascending: true }),
      supabase
        .from("clients")
        .select("*")
        .order("statut_lead", { ascending: true })
        .limit(4),
      supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(4),
      supabase
        .from("rendez_vous")
        .select("*", { count: "exact", head: true })
        .eq("type", "rdv")
        .gte("date_heure", debutMois.toISOString()),
    ]);

  const { data: clientsPourFormulaire } = await supabase.from("clients").select("id, nom").order("nom");

  const objectif = profil?.objectif_mensuel ?? 0;
  const nbLeads = clients?.length ?? 0;
  const nbRdvAujourdhui = rdvJour?.length ?? 0;
  const tauxTransformation =
    objectif && ventesMois ? Math.round(((ventesMois ?? 0) / objectif) * 100) : 0;

  return (
    <>
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-top">
          <div>
            <h1>Bonjour {profil?.nom_commercial || user?.email?.split("@")[0] || "Commercial"}</h1>
            <p>Toujours plus loin. Plus de clients. Plus d&apos;émotions.</p>
          </div>
          <div className="hero-top-right">
            <span className="mono">{formatParis(new Date(), "EEE d MMM yyyy — HH:mm")}</span>
          </div>
        </div>
        <div className="hero-bottom">
          <div className="hero-bottom-left">
            <p>PERFORMANCE<br />PASSION<br />CONFIANCE</p>
            <div className="accent-line" />
          </div>
          <div className="hero-bottom-right">
            « Les meilleures rencontres commencent toujours par un essai. »
            <div className="accent-line" />
          </div>
        </div>
      </div>

      <div className="content">
        <div className="stats">
          <div className="stat">
            <div className="ic">▲</div>
            <div>
              <div className="label">Ventes ce mois</div>
              <div className="val">{ventesMois ?? 0}</div>
              <div className="sub">Objectif : {objectif}</div>
            </div>
          </div>
          <div className="stat">
            <div className="ic">◔</div>
            <div>
              <div className="label">Rendez-vous aujourd&apos;hui</div>
              <div className="val">{nbRdvAujourdhui}</div>
              <div className="sub">Voir mon agenda</div>
            </div>
          </div>
          <div className="stat">
            <div className="ic">◈</div>
            <div>
              <div className="label">Leads en cours</div>
              <div className="val">{nbLeads}</div>
            </div>
          </div>
          <div className="stat">
            <div className="ic">◎</div>
            <div>
              <div className="label">Taux de transformation</div>
              <div className="val">{tauxTransformation}%</div>
            </div>
          </div>
        </div>

        <div className="row3">
          <div className="panel">
            <div className="panel-head">
              <h3>Ma to-do list <span className="count">{taches?.length ?? 0}</span></h3>
            </div>
            <NouvelleTacheForm clients={clientsPourFormulaire ?? []} />
            <div className="tabs">
              <button className="on">Toutes</button>
              <button>Aujourd&apos;hui</button>
              <button>En retard</button>
              <button>Terminées</button>
            </div>
            {taches && taches.length > 0 ? (
              taches.map((t) => (
                <div className="todo-row" key={t.id}>
                  <TodoCheck tacheId={t.id} termine={t.statut === "terminee"} />
                  <div className="title">
                    {t.titre}
                  </div>
                  <div className="when mono">
                    {t.echeance ? formatParis(t.echeance, "HH:mm") : "—"}
                  </div>
                  <DeleteButton table="taches" id={t.id} />
                </div>
              ))
            ) : (
              <p className="empty-hint">Aucune tâche pour le moment.</p>
            )}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Mon agenda</h3><a className="link" href="/calendrier">Voir tout →</a></div>
            {rdvJour && rdvJour.length > 0 ? (
              rdvJour.map((r) => (
                <div className="agenda-row" key={r.id}>
                  <div className="time mono">{formatParis(r.date_heure, "HH:mm")}</div>
                  <div className="bar" />
                  <div className="titlewrap">
                    <div className="t">{r.titre}</div>
                    <span className="s">{r.type}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-hint">Aucun rendez-vous aujourd&apos;hui.</p>
            )}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Assistant IA</h3><span className="new-tag">Nouveau</span></div>
            <a className="ai-mic" href="/assistant">
              <div className="dot3" />
              <span>Dicte ta note vocale, je m&apos;occupe du reste…</span>
            </a>
            <div className="ai-actions">
              <div className="a">▤ Résumer un RDV</div>
              <div className="a">✓ Créer une tâche</div>
              <div className="a">✉ Rédiger un email</div>
              <div className="a">◔ Analyser un lead</div>
            </div>
          </div>
        </div>

        <div className="row2">
          <div className="panel">
            <div className="panel-head"><h3>Mes prospects prioritaires</h3><a className="link" href="/clients">Voir tous →</a></div>
            {clients && clients.length > 0 ? (
              clients.map((c) => (
                <div className="client-row" key={c.id}>
                  <div>
                    <div className="name">{c.nom}</div>
                    <span className="sub">{c.vehicule_recherche ?? "—"}</span>
                  </div>
                  <span className={LABEL_LEAD[c.statut_lead].classe}>{LABEL_LEAD[c.statut_lead].texte}</span>
                </div>
              ))
            ) : (
              <p className="empty-hint">Aucun client enregistré pour le moment.</p>
            )}
          </div>

          <div className="panel">
            <div className="panel-head"><h3>Activité récente</h3></div>
            {notes && notes.length > 0 ? (
              notes.map((n) => (
                <div className="activity-row" key={n.id}>
                  <div className="dot2" />
                  <div>{n.resume ?? "Note vocale enregistrée"}</div>
                  <span className="s">{formatParis(n.created_at, "d MMM HH:mm")}</span>
                </div>
              ))
            ) : (
              <p className="empty-hint">Aucune activité récente.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
