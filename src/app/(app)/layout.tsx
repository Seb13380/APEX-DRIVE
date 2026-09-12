import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profil } = await supabase
    .from("profil")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="app-shell">
      <Sidebar
        nomConcession={profil?.nom_concession ?? ""}
        logoUrl={profil?.logo_url ?? null}
        email={user.email ?? "Commercial"}
        nomCommercial={profil?.nom_commercial ?? ""}
      />
      <main className="app-main">
        {profil?.photo_fond_url && (
          <div
            className="page-bg"
            style={{ backgroundImage: `url(${profil.photo_fond_url})` }}
          />
        )}
        <div className="app-main-content">{children}</div>
      </main>
    </div>
  );
}
