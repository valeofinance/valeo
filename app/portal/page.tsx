import { createClient } from "@/lib/supabase/server";
import { BarChart, AreaChart, LineChart, type Point } from "./charts";

// Kundenportal-Dashboard (§ 5.4 Mandantensicht / § 6 KPI-Modell).
// Zeigt die wichtigsten Kennzahlen aus den gemeldeten (unbereinigten) Zahlen:
// Umsatz, EBITDA-Marge, Liquidität, Ergebnis – plus leicht lesbare Verläufe.

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

const MONTHS_DE = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eurShort = (n: number) =>
  Math.abs(n) >= 1000
    ? `${(n / 1000).toLocaleString("de-DE", { maximumFractionDigits: 0 })}k €`
    : `${Math.round(n)} €`;
const pct = (n: number) => `${n.toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;

type AccountRow = {
  id: string;
  statement: string;
  section: string | null;
  code: string | null;
};

function parseMonth(key: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  return m ? { year: +m[1], month: +m[2] } : null;
}

export default async function Portal() {
  const supabase = await createClient();

  const [{ data: clientsData }, { data: tasksData }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, onboarding_status, deal:deals ( paket, company:companies ( name ) )")
      .limit(1),
    supabase
      .from("tasks")
      .select("id, titel, status, execution_mode, due_at")
      .order("due_at", { ascending: true }),
  ]);

  const client = (clientsData?.[0] ?? null) as
    | { id: string; onboarding_status: string; deal: { paket: string | null; company: { name: string | null } | null } | null }
    | null;
  const tasks = (tasksData ?? []) as {
    id: string;
    titel: string;
    status: string;
    execution_mode: string;
    due_at: string | null;
  }[];
  const openTasks = tasks.filter((t) => t.status !== "erledigt" && t.status !== "abgebrochen");

  const agency = client?.deal?.company?.name ?? "Ihre Agentur";
  const onboarding = client?.onboarding_status ?? "offen";

  // ---- Finanzzahlen laden (RLS: nur eigener Mandant) ----
  let accounts: AccountRow[] = [];
  const valueByAccPeriod = new Map<string, number>();
  if (client) {
    const { data: accData } = await supabase
      .from("fin_accounts")
      .select("id, statement, section, code")
      .eq("client_id", client.id)
      .in("statement", ["income", "balance"]);
    accounts = (accData ?? []) as AccountRow[];
    if (accounts.length > 0) {
      const { data: valData } = await supabase
        .from("fin_values")
        .select("account_id, period_key, amount")
        .in("account_id", accounts.map((a) => a.id));
      for (const v of valData ?? [])
        valueByAccPeriod.set(`${v.account_id}|${v.period_key}`, Number(v.amount));
    }
  }

  // Alle Monatsperioden (sortiert) über die Werte ermitteln.
  const periodSet = new Set<string>();
  for (const key of valueByAccPeriod.keys()) {
    const p = key.split("|")[1];
    if (parseMonth(p)) periodSet.add(p);
  }
  const periods = [...periodSet].sort();

  const incomeAccts = accounts.filter((a) => a.statement === "income");
  const bankAcct = accounts.find((a) => a.statement === "balance" && a.code === "1200");
  const revenueAccts = incomeAccts.filter((a) => a.section === "Erträge");
  const depAccts = incomeAccts.filter((a) => a.section === "Abschreibungen");

  const sumFor = (accs: AccountRow[], period: string) =>
    accs.reduce((s, a) => s + (valueByAccPeriod.get(`${a.id}|${period}`) ?? 0), 0);

  // Monatsreihen
  const revenueSeries: Point[] = [];
  const ebitdaMarginSeries: Point[] = [];
  const liquiditySeries: Point[] = [];
  let ergebnisYtd = 0;

  for (const p of periods) {
    const pm = parseMonth(p)!;
    const label = MONTHS_DE[pm.month - 1];
    const umsatz = sumFor(revenueAccts, p);
    const net = sumFor(incomeAccts, p); // Ergebnis (Summe aller GuV-Konten)
    const dep = sumFor(depAccts, p); // negativ
    const ebitda = net - dep; // Abschreibungen zurückrechnen
    ergebnisYtd += net;
    revenueSeries.push({ label, value: umsatz });
    ebitdaMarginSeries.push({ label, value: umsatz > 0 ? (ebitda / umsatz) * 100 : 0 });
    if (bankAcct) {
      const bank = valueByAccPeriod.get(`${bankAcct.id}|${p}`);
      if (bank != null) liquiditySeries.push({ label, value: bank });
    }
  }

  const hasFinance = periods.length > 0 && revenueAccts.length > 0;

  // Headline-KPIs (letzter Monat) + Veränderung zum Vormonat.
  const last = revenueSeries.length - 1;
  const umsatzNow = revenueSeries[last]?.value ?? 0;
  const umsatzPrev = revenueSeries[last - 1]?.value ?? 0;
  const umsatzDelta = umsatzPrev ? ((umsatzNow - umsatzPrev) / umsatzPrev) * 100 : 0;
  const margeNow = ebitdaMarginSeries[last]?.value ?? 0;
  const margePrev = ebitdaMarginSeries[last - 1]?.value ?? 0;
  const liqNow = liquiditySeries[liquiditySeries.length - 1]?.value ?? 0;
  const liqStart = liquiditySeries[0]?.value ?? 0;
  const lastMonthLabel = revenueSeries[last]?.label ?? "";

  const Delta = ({ v, unit = "%" }: { v: number; unit?: string }) => (
    <span className={`kpi-delta ${v >= 0 ? "up" : "down"}`}>
      {v >= 0 ? "▲" : "▼"} {Math.abs(v).toLocaleString("de-DE", { maximumFractionDigits: 1 })}
      {unit}
    </span>
  );

  return (
    <main className="shell-main">
      <div className="shell-head">
        <span className="eyebrow">Kundenportal</span>
        <h1>{agency}</h1>
        <p>Ihre wichtigsten Kennzahlen auf einen Blick – auf Basis der gemeldeten Zahlen.</p>
      </div>

      {!hasFinance ? (
        <div className="panel">
          <div className="empty">
            <div className="icon">📊</div>
            <h3>Kennzahlen in Vorbereitung</h3>
            <p>
              Sobald Ihre ersten Abschlüsse eingespielt sind, sehen Sie hier Umsatz,
              Marge, Liquidität und Ergebnis inklusive Verläufen.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI-Kacheln */}
          <div className="grid grid-4 kpi-row">
            <div className="panel kpi">
              <div className="kpi-l">Umsatz · {lastMonthLabel}</div>
              <div className="kpi-v">{eur.format(umsatzNow)}</div>
              <Delta v={umsatzDelta} /> <span className="kpi-note">ggü. Vormonat</span>
            </div>
            <div className="panel kpi">
              <div className="kpi-l">EBITDA-Marge · {lastMonthLabel}</div>
              <div className="kpi-v up">{pct(margeNow)}</div>
              <Delta v={margeNow - margePrev} unit=" Pp" />{" "}
              <span className="kpi-note">ggü. Vormonat</span>
            </div>
            <div className="panel kpi">
              <div className="kpi-l">Liquidität · aktuell</div>
              <div className="kpi-v">{eur.format(liqNow)}</div>
              <Delta v={liqStart ? ((liqNow - liqStart) / liqStart) * 100 : 0} />{" "}
              <span className="kpi-note">seit Jahresbeginn</span>
            </div>
            <div className="panel kpi">
              <div className="kpi-l">Ergebnis · kumuliert (YTD)</div>
              <div className={`kpi-v ${ergebnisYtd >= 0 ? "up" : "down"}`}>
                {eur.format(ergebnisYtd)}
              </div>
              <span className="kpi-note">{periods.length} Monate</span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-2 chart-grid">
            <div className="panel">
              <div className="panel-title">Umsatz-Entwicklung</div>
              <div className="panel-sub">Monatlicher Umsatz im laufenden Jahr.</div>
              <BarChart
                data={revenueSeries}
                format={eurShort}
                color="var(--accent)"
                ariaLabel="Monatlicher Umsatz"
              />
            </div>
            <div className="panel">
              <div className="panel-title">Liquidität</div>
              <div className="panel-sub">Verfügbare Mittel (Bank) im Zeitverlauf.</div>
              <AreaChart
                id="liq"
                data={liquiditySeries}
                format={eurShort}
                color="var(--pos)"
                ariaLabel="Liquiditätsverlauf"
              />
            </div>
          </div>

          <div className="panel" style={{ marginTop: 16 }}>
            <div className="panel-title">EBITDA-Marge</div>
            <div className="panel-sub">
              Operative Profitabilität je Monat (in Prozent vom Umsatz).
            </div>
            <LineChart
              data={ebitdaMarginSeries}
              format={pct}
              color="var(--accent-deep)"
              ariaLabel="EBITDA-Marge je Monat"
            />
          </div>
        </>
      )}

      {/* Status, Aufgaben, Belege */}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="panel">
          <div className="kpi-l">Onboarding</div>
          <div className="kpi-v" style={{ fontSize: "1.05rem", marginTop: 8 }}>
            <span className={`badge ${onboarding}`}>
              {STATUS_LABEL[onboarding] ?? onboarding}
            </span>
          </div>
          <div className="kpi-l" style={{ marginTop: 16 }}>Paket</div>
          <div className="kpi-v" style={{ fontSize: "1.05rem" }}>
            {client?.deal?.paket ?? "—"}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Aufgaben</div>
          <div className="panel-sub">Was aktuell für Sie ansteht.</div>
          {openTasks.length === 0 ? (
            <div className="empty" style={{ padding: "20px 0" }}>
              <div className="icon">✓</div>
              <h3>Alles erledigt</h3>
              <p>Keine offenen Aufgaben.</p>
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
                        ? ` · fällig ${new Date(t.due_at).toLocaleDateString("de-DE")}`
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
            Originale gehen direkt an DATEV bzw. Ihren Steuerberater.
          </div>
          <div className="empty" style={{ padding: "20px 0" }}>
            <div className="icon">🧾</div>
            <h3>In Vorbereitung</h3>
            <p>Sobald das Belegtracking aktiv ist, sehen Sie hier den Stand.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
