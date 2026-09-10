import { createClient } from "@/lib/supabase/server";
import { ParametresForm } from "@/components/ParametresForm";

export default async function ParametresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profil } = await supabase
    .from("profil")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <div className="content" style={{ paddingTop: 26 }}>
      <ParametresForm email={user!.email ?? ""} profil={profil} />
    </div>
  );
}
