import { createClient } from "@/lib/supabase/server";
import CockpitTodos, { type Todo, type StaffMember } from "./CockpitTodos";

// Team-Cockpit: Übersicht über alle Mandanten (§ 5.5). Staff sieht per RLS
// alles. Datenmodell siehe supabase/migrations/0001_core_schema.sql.

const euro = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const STATUS_LABEL: Record<string, string> = {
  offen: "Offen",
  in_arbeit: "In Arbeit",
  aktiv: "Aktiv",
  pausiert: "Pausiert",
  beendet: "Beendet",
};

type CockpitClient = {
  id: string;
  onboarding_status: string;
  deal: {
    paket: string | null;
    wert: number | null;
    company: { name: string | null; domain: string } | null;
  } | null;
};

export default async function Cockpit() {
  const supabase = await createClient();

  const [
    { data: clientsData },
    { data: tasksData },
    { data: todosData },
    { data: staffData },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, onboarding_status, deal:deals ( paket, wert, company:companies ( name, domain ) )"
      )
      .order("created_at", { ascending: true }),
    supabase.from("tasks").select("client_id, status"),
    supabase
      .from("cockpit_todos")
      .select("id, title, status, due_at, assignee, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("staff").select("user_id, name").order("name"),
  ]);

  const clients = (clientsData ?? []) as unknown as CockpitClient[];
  const tasks = (tasksData ?? []) as { client_id: string; status: string }[];
  const todos = (todosData ?? []) as Todo[];
  const staff = (staffData ?? []) as StaffMember[];

  const openByClient = new Map<string, number>();
  for (const t of tasks) {
    if (t.status === "erledigt" || t.status === "abgebrochen") continue;
    openByClient.set(t.client_id, (openByClient.get(t.client_id) ?? 0) + 1);
  }

  const activeCount = clients.filter(
    (c) => c.onboarding_status === "aktiv"
  ).length;
  const openTotal = [...openByClient.values()].reduce((a, b) => a + b, 0);

  return (
    <main className="shell-main">
      <div className="shell-head">
        <span className="eyebrow">Was liegt an</span>
        <h1>Mandanten</h1>
        <p>Alle Kunden auf einen Blick – Status, Paket und offene Aufgaben.</p>
      </div>

      <div className="cockpit-grid">
        <div className="cockpit-main">
          <div className="grid grid-3" style={{ marginBottom: 16 }}>
            <div className="panel">
              <div className="kpi-l">Mandanten gesamt</div>
              <div className="kpi-v">{clients.length}</div>
            </div>
            <div className="panel">
              <div className="kpi-l">Aktiv</div>
              <div className="kpi-v">{activeCount}</div>
            </div>
            <div className="panel">
              <div className="kpi-l">Offene Aufgaben</div>
              <div className="kpi-v">{openTotal}</div>
            </div>
          </div>

          <div className="panel">
            {clients.length === 0 ? (
              <div className="empty">
                <div className="icon">◔</div>
                <h3>Noch keine Mandanten</h3>
                <p>
                  Sobald ein Deal gewonnen und zum Mandanten wird, erscheint er
                  hier. Leads laufen bis dahin im Akquise-Modul.
                </p>
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Agentur</th>
                    <th className="hide-sm">Paket</th>
                    <th className="hide-sm">Volumen</th>
                    <th>Status</th>
                    <th>Offen</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => {
                    const name = c.deal?.company?.name ?? "Unbenannt";
                    const domain = c.deal?.company?.domain ?? "—";
                    const status = c.onboarding_status;
                    return (
                      <tr key={c.id}>
                        <td className="agency">
                          {name}
                          <span className="dom">{domain}</span>
                        </td>
                        <td className="hide-sm">{c.deal?.paket ?? "—"}</td>
                        <td className="hide-sm num">
                          {c.deal?.wert != null ? euro.format(c.deal.wert) : "—"}
                        </td>
                        <td>
                          <span className={`badge ${status}`}>
                            {STATUS_LABEL[status] ?? status}
                          </span>
                        </td>
                        <td className="num">{openByClient.get(c.id) ?? 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside className="cockpit-aside">
          <CockpitTodos initial={todos} staff={staff} />
        </aside>
      </div>
    </main>
  );
}
