import { createClient } from "@/lib/supabase/server";

// Kundenportal: Mandantensicht (§ 5.4) – Onboarding-Status, eigene Aufgaben,
// Belegstatus. RLS liefert ausschließlich den eigenen Datensatz.

const STATUS_LABEL: Record<string, string> = {
  offen: "Offen",
  in_arbeit: "In Arbeit",
  aktiv: "Aktiv",
  pausiert: "Pausiert",
  beendet: "Beendet",
};

const TASK_STATUS_LABEL: Record<string, string> = {
  offen: "Offen",
  in_arbeit: "In Arbeit",
  wartet_freigabe: "Wartet auf Freigabe",
  erledigt: "Erledigt",
  abgebrochen: "Abgebrochen",
};

type PortalClient = {
  id: string;
  onboarding_status: string;
  deal: {
    paket: string | null;
    company: { name: string | null } | null;
  } | null;
};

type PortalTask = {
  id: string;
  titel: string;
  status: string;
  execution_mode: string;
  due_at: string | null;
};

export default async function Portal() {
  const supabase = await createClient();

  const [{ data: clientsData }, { data: tasksData }] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, onboarding_status, deal:deals ( paket, company:companies ( name ) )"
      )
      .limit(1),
    supabase
      .from("tasks")
      .select("id, titel, status, execution_mode, due_at")
      .order("due_at", { ascending: true }),
  ]);

  const client = (clientsData?.[0] ?? null) as PortalClient | null;
  const tasks = (tasksData ?? []) as PortalTask[];
  const openTasks = tasks.filter(
    (t) => t.status !== "erledigt" && t.status !== "abgebrochen"
  );

  const agency = client?.deal?.company?.name ?? "Ihre Agentur";
  const status = client?.onboarding_status ?? "offen";

  return (
    <main className="shell-main">
      <div className="shell-head">
        <span className="eyebrow">Kundenportal</span>
        <h1>{agency}</h1>
        <p>Ihr Finanz-Cockpit: Status, Aufgaben und Belege an einem Ort.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="panel">
          <div className="kpi-l">Onboarding</div>
          <div className="kpi-v" style={{ fontSize: "1.05rem", marginTop: 8 }}>
            <span className={`badge ${status}`}>
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>
        </div>
        <div className="panel">
          <div className="kpi-l">Paket</div>
          <div className="kpi-v" style={{ fontSize: "1.15rem" }}>
            {client?.deal?.paket ?? "—"}
          </div>
        </div>
        <div className="panel">
          <div className="kpi-l">Offene Aufgaben</div>
          <div className="kpi-v">{openTasks.length}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="panel">
          <div className="panel-title">Aufgaben</div>
          <div className="panel-sub">Was aktuell für Sie ansteht.</div>
          {openTasks.length === 0 ? (
            <div className="empty">
              <div className="icon">✓</div>
              <h3>Alles erledigt</h3>
              <p>Aktuell liegen keine offenen Aufgaben für Sie vor.</p>
            </div>
          ) : (
            <div>
              {openTasks.map((t) => (
                <div className="task" key={t.id}>
                  <div>
                    <div className="t-title">{t.titel}</div>
                    <div className="t-meta">
                      {TASK_STATUS_LABEL[t.status] ?? t.status}
                      {t.due_at
                        ? ` · fällig ${new Date(t.due_at).toLocaleDateString(
                            "de-DE"
                          )}`
                        : ""}
                    </div>
                  </div>
                  <span className="t-mode">{t.execution_mode}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Belegstatus</div>
          <div className="panel-sub">
            Stand Ihrer Belege – Originale gehen direkt an DATEV bzw. Ihren
            Steuerberater.
          </div>
          <div className="empty">
            <div className="icon">🧾</div>
            <h3>In Vorbereitung</h3>
            <p>
              Sobald das Belegtracking aktiv ist, sehen Sie hier offene und
              zugeordnete Belege.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
