import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

// Geschützter Bereich. Hier entsteht das Tool:
// Team-Cockpit (Staff) bzw. Kundenportal (Mandanten).
export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">Valeo</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-neutral-500">{user.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
              >
                Abmelden
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">
          {staff ? "Team-Cockpit" : "Kundenportal"}
        </h1>
        <p className="mt-2 text-neutral-600">
          {staff
            ? "Alle Mandanten, Freigaben und was heute ansteht – im Aufbau."
            : "Ihre Zahlen, Aufgaben und der Belegstatus – im Aufbau."}
        </p>
      </div>
    </main>
  );
}
