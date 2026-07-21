import { Fragment } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ImportPanel from "./ImportPanel";

// Finanzabschlüsse (staff-only, § 5.6). Import über Valeo-Vorlage, Anzeige als
// Spreadsheet (Konten × Perioden). Werte sind reported/unbereinigt.
//
// Ansichten (view):
//   monthly    – jede Periode (Monat) als Spalte
//   quarterly  – auf Quartale aggregiert
//   yearly     – auf Jahre aggregiert
//   ytd        – Year-to-date (kumuliert bis zum letzten Monat des Jahres)
//
// Aggregation je Statement-Typ:
//   GuV/Cashflow = Flussgrößen  -> Summe über die Periode
//   Bilanz       = Bestandsgröße -> Wert am Periodenende (letzter Monat)

type Statement = "income" | "balance" | "cashflow";
type View = "monthly" | "quarterly" | "yearly" | "ytd";

const STATEMENTS: { key: Statement; label: string }[] = [
  { key: "income", label: "GuV" },
  { key: "balance", label: "Bilanz" },
  { key: "cashflow", label: "Cashflow" },
];

const VIEWS: { key: View; label: string }[] = [
  { key: "monthly", label: "Monat" },
  { key: "quarterly", label: "Quartal" },
  { key: "yearly", label: "Jahr" },
  { key: "ytd", label: "YTD" },
];

const TOTAL_LABEL: Record<Statement, string> = {
  income: "Ergebnis",
  balance: "Kontrolle (Aktiva + Passiva)",
  cashflow: "Netto-Cashflow",
};

const num = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });

type ClientRow = {
  id: string;
  deal: { company: { name: string | null } | null } | null;
};

type AccountRow = {
  id: string;
  section: string | null;
  code: string | null;
  label: string;
  sort: number;
};

type Bucket = { key: string; label: string; sort: number };

function parsePeriod(key: string): { year: number; month: number } | null {
  let m = /^(\d{4})-(\d{2})$/.exec(key);
  if (m) return { year: +m[1], month: +m[2] };
  m = /^(\d{4})-Q([1-4])$/i.exec(key);
  if (m) return { year: +m[1], month: +m[2] * 3 }; // Quartalsende
  m = /^(\d{4})$/.exec(key);
  if (m) return { year: +m[1], month: 12 };
  return null;
}

const quarterOf = (month: number) => Math.floor((month - 1) / 3) + 1;

function bucketFor(view: View, year: number, month: number): Bucket {
  if (view === "monthly") {
    const d = new Date(year, month - 1, 1);
    return {
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
      sort: year * 100 + month,
    };
  }
  if (view === "quarterly") {
    const q = quarterOf(month);
    return { key: `${year}-Q${q}`, label: `Q${q} ${year}`, sort: year * 10 + q };
  }
  const label = view === "ytd" ? `YTD ${year}` : `${year}`;
  return { key: `${year}`, label, sort: year };
}

export default async function FinanzenPage({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string;
    stmt?: string;
    view?: string;
    hidezero?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: clientsData } = await supabase
    .from("clients")
    .select("id, deal:deals ( company:companies ( name ) )")
    .order("created_at", { ascending: true });
  const clients = (clientsData ?? []) as unknown as ClientRow[];
  const nameOf = (c: ClientRow) => c.deal?.company?.name ?? "Unbenannt";

  const activeClient =
    clients.find((c) => c.id === sp.client) ?? clients[0] ?? null;
  const stmt: Statement =
    (STATEMENTS.find((s) => s.key === sp.stmt)?.key as Statement) ?? "income";
  const view: View =
    (VIEWS.find((v) => v.key === sp.view)?.key as View) ?? "monthly";
  const hideZero = sp.hidezero === "1";
  const isStock = stmt === "balance";

  const hrefWith = (patch: Record<string, string>) => {
    const params = new URLSearchParams({
      client: activeClient?.id ?? "",
      stmt,
      view,
      ...(hideZero ? { hidezero: "1" } : {}),
      ...patch,
    });
    return `/app/finanzen?${params.toString()}`;
  };

  let accounts: AccountRow[] = [];
  const monthly = new Map<string, { year: number; month: number; amount: number }[]>();

  if (activeClient) {
    const { data: accData } = await supabase
      .from("fin_accounts")
      .select("id, section, code, label, sort")
      .eq("client_id", activeClient.id)
      .eq("statement", stmt)
      .order("sort", { ascending: true });
    accounts = (accData ?? []) as AccountRow[];

    if (accounts.length > 0) {
      const { data: valData } = await supabase
        .from("fin_values")
        .select("account_id, period_key, amount")
        .in(
          "account_id",
          accounts.map((a) => a.id)
        );
      for (const v of valData ?? []) {
        const parsed = parsePeriod(v.period_key);
        if (!parsed) continue;
        const list = monthly.get(v.account_id) ?? [];
        list.push({ ...parsed, amount: Number(v.amount) });
        monthly.set(v.account_id, list);
      }
    }
  }

  // Spalten (Buckets) aus allen vorhandenen Monaten ableiten.
  const bucketMap = new Map<string, Bucket>();
  for (const list of monthly.values())
    for (const { year, month } of list) {
      const b = bucketFor(view, year, month);
      if (!bucketMap.has(b.key)) bucketMap.set(b.key, b);
    }
  const buckets = [...bucketMap.values()].sort((a, b) => a.sort - b.sort);

  function valueFor(accountId: string, bucket: Bucket): number | null {
    const list = (monthly.get(accountId) ?? []).filter(
      (v) => bucketFor(view, v.year, v.month).key === bucket.key
    );
    if (list.length === 0) return null;
    if (isStock) {
      list.sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month));
      return list[list.length - 1].amount; // Periodenende
    }
    return list.reduce((s, v) => s + v.amount, 0); // Summe
  }

  // Nullzeilen ausblenden (optional).
  const visibleAccounts = hideZero
    ? accounts.filter((a) =>
        buckets.some((b) => {
          const v = valueFor(a.id, b);
          return v != null && v !== 0;
        })
      )
    : accounts;

  // Nach Bereich gruppieren.
  const sections: { name: string; rows: AccountRow[] }[] = [];
  for (const a of visibleAccounts) {
    const name = a.section ?? "Ohne Bereich";
    let grp = sections.find((s) => s.name === name);
    if (!grp) sections.push((grp = { name, rows: [] }));
    grp.rows.push(a);
  }

  const sumRows = (rows: AccountRow[], b: Bucket) =>
    rows.reduce((s, a) => s + (valueFor(a.id, b) ?? 0), 0);

  const hasData = accounts.length > 0;

  return (
    <main className="shell-main">
      <div className="shell-head">
        <span className="eyebrow">Datenschicht</span>
        <h1>Finanzen</h1>
        <p>
          GuV, Bilanz und Cashflow je Mandant. Importierte Werte sind
          unbereinigt – KPIs und Anpassungen folgen als eigene Ebene.
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="panel">
          <div className="empty">
            <div className="icon">◔</div>
            <h3>Noch keine Mandanten</h3>
            <p>Sobald ein Mandant existiert, können hier Abschlüsse importiert werden.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="fin-bar">
            <div className="fin-clients">
              {clients.map((c) => (
                <Link
                  key={c.id}
                  href={`/app/finanzen?client=${c.id}&stmt=${stmt}&view=${view}${hideZero ? "&hidezero=1" : ""}`}
                  className={`fin-chip ${activeClient?.id === c.id ? "active" : ""}`}
                >
                  {nameOf(c)}
                </Link>
              ))}
            </div>
            {activeClient && <ImportPanel clientId={activeClient.id} />}
          </div>

          <div className="fin-controls">
            <div className="fin-tabs">
              {STATEMENTS.map((s) => (
                <Link
                  key={s.key}
                  href={hrefWith({ stmt: s.key })}
                  className={`fin-tab ${stmt === s.key ? "active" : ""}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>

            <div className="fin-right">
              <div className="fin-seg">
                {VIEWS.map((v) => (
                  <Link
                    key={v.key}
                    href={hrefWith({ view: v.key })}
                    className={`fin-seg-item ${view === v.key ? "active" : ""}`}
                  >
                    {v.label}
                  </Link>
                ))}
              </div>
              <Link
                href={hrefWith({ hidezero: hideZero ? "0" : "1" })}
                className={`fin-toggle ${hideZero ? "active" : ""}`}
                aria-pressed={hideZero}
              >
                <span className="box" aria-hidden="true">
                  {hideZero ? "✓" : ""}
                </span>
                Nullzeilen ausblenden
              </Link>
            </div>
          </div>

          <div className="panel fin-grid-wrap">
            {!hasData ? (
              <div className="empty">
                <div className="icon">↥</div>
                <h3>Noch keine Daten</h3>
                <p>
                  Lade oben eine CSV/Excel-Datei nach der Valeo-Vorlage hoch, um
                  diesen Abschluss zu füllen.
                </p>
              </div>
            ) : (
              <>
                <div className="fin-caption mono">Beträge in EUR · unbereinigt</div>
                <div className="fin-scroll">
                  <table className="fin-grid">
                    <thead>
                      <tr>
                        <th className="fin-acc">Position</th>
                        {buckets.map((b) => (
                          <th key={b.key} className="fin-num">
                            {b.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map((sec) => (
                        <Fragment key={sec.name}>
                          <tr className="fin-section">
                            <td className="fin-acc">{sec.name}</td>
                            {buckets.map((b) => (
                              <td key={b.key} className="fin-num">
                                {num.format(sumRows(sec.rows, b))}
                              </td>
                            ))}
                          </tr>
                          {sec.rows.map((a) => (
                            <tr key={a.id}>
                              <td className="fin-acc">
                                {a.code && <span className="fin-code">{a.code}</span>}
                                {a.label}
                              </td>
                              {buckets.map((b) => {
                                const v = valueFor(a.id, b);
                                return (
                                  <td
                                    key={b.key}
                                    className={`fin-num ${v != null && v < 0 ? "neg" : ""} ${v === 0 || v == null ? "zero" : ""}`}
                                  >
                                    {v != null ? num.format(v) : "–"}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                      <tr className="fin-total">
                        <td className="fin-acc">{TOTAL_LABEL[stmt]}</td>
                        {buckets.map((b) => {
                          const v = sumRows(visibleAccounts, b);
                          return (
                            <td key={b.key} className={`fin-num ${v < 0 ? "neg" : ""}`}>
                              {num.format(v)}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}
