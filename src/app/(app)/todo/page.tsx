import { createClient } from "@/lib/supabase/server";
import { formatParis } from "@/lib/formatDate";
import { TodoCheck } from "@/components/TodoCheck";
import { NouvelleTacheForm } from "@/components/NouvelleTacheForm";
import { DeleteButton } from "@/components/DeleteButton";

export default async function TodoPage() {
  const supabase = await createClient();
  const [{ data: taches }, { data: clients }] = await Promise.all([
    supabase.from("taches").select("*").order("echeance", { ascending: true }),
    supabase.from("clients").select("id, nom").order("nom"),
  ]);

  return (
    <div className="content" style={{ paddingTop: 26 }}>
      <div className="panel">
        <div className="panel-head">
          <h3>Ma to-do list <span className="count">{taches?.length ?? 0}</span></h3>
        </div>
        <NouvelleTacheForm clients={clients ?? []} />
        {taches && taches.length > 0 ? (
          taches.map((t) => (
            <div className="todo-row" key={t.id}>
              <TodoCheck tacheId={t.id} termine={t.statut === "terminee"} />
              <div className="title">
                {t.titre}
                <span className="sub">Priorité : {t.priorite}</span>
              </div>
              <div className="when mono">
                {t.echeance ? formatParis(t.echeance, "d MMM HH:mm") : "—"}
              </div>
              <DeleteButton table="taches" id={t.id} />
            </div>
          ))
        ) : (
          <p className="empty-hint">Aucune tâche pour le moment.</p>
        )}
      </div>
    </div>
  );
}
