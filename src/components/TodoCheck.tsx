"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function TodoCheck({ tacheId, termine }: { tacheId: string; termine: boolean }) {
  const [fait, setFait] = useState(termine);
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function basculer() {
    const nouveauStatut = fait ? "a_faire" : "terminee";
    setFait(!fait);
    const supabase = createClient();
    await supabase.from("taches").update({ statut: nouveauStatut }).eq("id", tacheId);
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      className={`todo-check${fait ? " done" : ""}`}
      onClick={basculer}
      aria-label={fait ? "Marquer comme à faire" : "Marquer comme terminée"}
    />
  );
}
