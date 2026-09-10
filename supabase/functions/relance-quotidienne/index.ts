// supabase/functions/relance-quotidienne/index.ts
//
// Fonction cron : lit les tâches et rendez-vous du jour (tous utilisateurs)
// et envoie une notification (ici: insertion dans une table `notifications`
// que le frontend écoute en Realtime + email optionnel).
//
// Déclenchement recommandé : planifiée chaque matin via Supabase Scheduled
// Functions (voir supabase/config.toml) ou pg_cron + pg_net.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date();
    finJour.setHours(23, 59, 59, 999);

    const [{ data: taches, error: tachesError }, { data: rdv, error: rdvError }] =
      await Promise.all([
        supabase
          .from("taches")
          .select("id, user_id, titre, priorite, echeance, statut")
          .neq("statut", "terminee")
          .gte("echeance", debutJour.toISOString())
          .lte("echeance", finJour.toISOString()),
        supabase
          .from("rendez_vous")
          .select("id, user_id, titre, date_heure, type")
          .gte("date_heure", debutJour.toISOString())
          .lte("date_heure", finJour.toISOString()),
      ]);

    if (tachesError || rdvError) {
      throw new Error(tachesError?.message ?? rdvError?.message);
    }

    // Regrouper par utilisateur pour créer une notification de synthèse
    const parUtilisateur = new Map<
      string,
      { taches: typeof taches; rdv: typeof rdv }
    >();

    for (const t of taches ?? []) {
      const entry = parUtilisateur.get(t.user_id) ?? { taches: [], rdv: [] };
      entry.taches!.push(t);
      parUtilisateur.set(t.user_id, entry);
    }
    for (const r of rdv ?? []) {
      const entry = parUtilisateur.get(r.user_id) ?? { taches: [], rdv: [] };
      entry.rdv!.push(r);
      parUtilisateur.set(r.user_id, entry);
    }

    const notifications = Array.from(parUtilisateur.entries()).map(
      ([user_id, { taches, rdv }]) => ({
        user_id,
        titre: "Récapitulatif du jour",
        message: `${taches?.length ?? 0} tâche(s) et ${rdv?.length ?? 0} rendez-vous aujourd'hui.`,
        created_at: new Date().toISOString(),
      })
    );

    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);
      if (notifError) throw new Error(notifError.message);
    }

    return new Response(
      JSON.stringify({ ok: true, notifications_envoyees: notifications.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
