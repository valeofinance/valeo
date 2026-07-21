import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ImportPanel from "./ImportPanel";

// Finanzabschlüsse (staff-only, § 5.6 Datenschicht). Import über Valeo-Vorlage,
// Anzeige als Spreadsheet (Konten × Perioden). Werte sind reported/unbereinigt;
// KPIs und Bereinigungen folgen als separate Ebene.

type Statement = "income" | "balance" | "cashflow";

const STATEMENTS: { key: Statement; label: string }[] = [
  { key: "income", label: "GuV" },
  { key: "balance", label: "Bilanz" },
  { key: "cashflow", label: "Cashflow" },
];

const num = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type ClientRow = {
  id: string;
  deal: { company: { name: string | null } | null } | null;
};

type AccountRow = {
  id: string;
  statement: Statement;
  section: string | null;
  code: string | null;
  label: string;
  sort: number;
};

export default async function FinanzenPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; stmt?: string }>;
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

  let accounts: AccountRow[] = [];
  let periods: string[] = [];
  const cell = new Map<string, number>(); // accountId|period -> amount

  if (activeClient) {
    const { data: accData } = await supabase
      .from("fin_accounts")
      .select("id, statement, section, code, label, sort")
      .eq("client_id", activeClient.id)
      .eq("statement", stmt)
      .order("sort", { ascending: true });
    accounts = (accData ?? []) as AccountRow[];

    if (accounts.length > 0) {
      const ids = accounts.map((a) => a.id);
      const { data: valData } = await supabase
        .from("fin_values")
        .select("account_id, period_key, amount")
        .in("account_id", ids);
      const periodSet = new Set<string>();
      for (const v of valData ?? []) {
        periodSet.add(v.period_key);
        cell.set(`${v.account_id}|${v.period_key}`, Number(v.amount));
      }
      periods = [...periodSet].sort();
    }
  }

  // Zeilen nach Bereich (section) gruppieren, Reihenfolge = sort.
  const sections: { name: string; rows: AccountRow[] }[] = [];
  for (const a of accounts) {
    const name = a.section ?? "Ohne Bereich";
    let grp = sections.find((s) => s.name === name);
    if (!grp) {
      grp = { name, rows: [] };
      sections.push(grp);
    }
    grp.rows.push(a);
  }

  const sectionTotal = (rows: AccountRow[], period: string) =>
    rows.reduce((sum, a) => sum + (cell.get(`${a.id}|${period}`) ?? 0), 0);

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
                  href={`/app/finanzen?client=${c.id}&stmt=${stmt}`}
                  className={`fin-chip ${activeClient?.id === c.id ? "active" : ""}`}
                >
                  {nameOf(c)}
                </Link>
              ))}
            </div>
            {activeClient && <ImportPanel clientId={activeClient.id} />}
          </div>

          <div className="fin-tabs">
            {STATEMENTS.map((s) => (
              <Link
                key={s.key}
                href={`/app/finanzen?client=${activeClient?.id}&stmt=${s.key}`}
                className={`fin-tab ${stmt === s.key ? "active" : ""}`}
              >
                {s.label}
              </Link>
            ))}
          </div>

          <div className="panel fin-grid-wrap">
            {accounts.length === 0 ? (
              <div className="empty">
                <div className="icon">↥</div>
                <h3>Noch keine Daten</h3>
                <p>
                  Lade oben eine CSV/Excel-Datei nach der Valeo-Vorlage hoch, um
                  diesen Abschluss zu füllen.
                </p>
              </div>
            ) : (
              <div className="fin-scroll">
                <table className="fin-grid">
                  <thead>
                    <tr>
                      <th className="fin-acc">Position</th>
                      {periods.map((p) => (
                        <th key={p} className="fin-num">
                          {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((sec) => (
                      <SectionBlock
                        key={sec.name}
                        name={sec.name}
                        rows={sec.rows}
                        periods={periods}
                        cell={cell}
                        sectionTotal={sectionTotal}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );

  function SectionBlock({
    name,
    rows,
    periods,
    cell,
    sectionTotal,
  }: {
    name: string;
    rows: AccountRow[];
    periods: string[];
    cell: Map<string, number>;
    sectionTotal: (rows: AccountRow[], period: string) => number;
  }) {
    return (
      <>
        <tr className="fin-section">
          <td className="fin-acc">{name}</td>
          {periods.map((p) => (
            <td key={p} className="fin-num">
              {num.format(sectionTotal(rows, p))}
            </td>
          ))}
        </tr>
        {rows.map((a) => (
          <tr key={a.id}>
            <td className="fin-acc">
              {a.code && <span className="fin-code">{a.code}</span>}
              {a.label}
            </td>
            {periods.map((p) => {
              const v = cell.get(`${a.id}|${p}`);
              return (
                <td key={p} className={`fin-num ${v != null && v < 0 ? "neg" : ""}`}>
                  {v != null ? num.format(v) : "–"}
                </td>
              );
            })}
          </tr>
        ))}
      </>
    );
  }
}
