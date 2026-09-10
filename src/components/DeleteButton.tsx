"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteButton({
  table,
  id,
  confirmLabel = "Supprimer ?",
}: {
  table: "clients" | "taches" | "rendez_vous";
  id: string;
  confirmLabel?: string;
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState(false);
  const [suppression, setSuppression] = useState(false);

  async function supprimer() {
    setSuppression(true);
    const supabase = createClient();
    await supabase.from(table).delete().eq("id", id);
    router.refresh();
  }

  if (confirmation) {
    return (
      <button
        type="button"
        onClick={supprimer}
        disabled={suppression}
        style={{ fontSize: 11, color: "#e0715a", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {suppression ? "..." : confirmLabel}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmation(true)}
      style={{ fontSize: 11, color: "var(--muted-dim)", background: "none", border: "none", cursor: "pointer" }}
      aria-label="Supprimer"
    >
      ✕
    </button>
  );
}
