import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

// Zwei Zielgruppen, ein Auth-Pool (§ 4/5 spec, "keine Rollenrechte"):
//   staff        -> die zwei Gründer, Team-Cockpit, Vollzugriff (is_staff())
//   client       -> Mandant, Kundenportal, nur eigener Datensatz (client_users)
//   null         -> eingeloggt, aber keinem der beiden zugeordnet
export type Role = "staff" | "client";

export async function getSessionRole(): Promise<{
  user: User | null;
  role: Role | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null };

  // Staff-Mitgliedschaft: RLS erlaubt Staff das Lesen der eigenen Zeile,
  // Nicht-Staff bekommt leer zurück (kein Fehler).
  const { data: staff } = await supabase
    .from("staff")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (staff) return { user, role: "staff" };

  // Kein Staff: hat der User über client_users einen Mandanten? Dann greift
  // die Portal-RLS und clients liefert mindestens eine Zeile.
  const { count } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true });
  if (count && count > 0) return { user, role: "client" };

  return { user, role: null };
}
