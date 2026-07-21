"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Statement = "income" | "balance" | "cashflow";

const STATEMENT_ALIASES: Record<string, Statement> = {
  income: "income",
  guv: "income",
  "gu&v": "income",
  "g&v": "income",
  pnl: "income",
  "p&l": "income",
  ertrag: "income",
  balance: "balance",
  bilanz: "balance",
  cashflow: "cashflow",
  cash: "cashflow",
  kapitalfluss: "cashflow",
};

export type ImportResult = {
  ok: boolean;
  message: string;
  imported?: number;
  skipped?: number;
};

function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") return raw;
  if (raw == null) return null;
  let s = String(raw).trim().replace(/\s/g, "").replace(/€/g, "");
  if (s === "") return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // 1.234,56 -> Punkt = Tausender, Komma = Dezimal
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function parseCsv(text: string): string[][] {
  const firstLine = text.slice(0, text.indexOf("\n") >= 0 ? text.indexOf("\n") : text.length);
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}

async function fileToRows(file: File): Promise<Record<string, unknown>[]> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }

  // CSV
  const matrix = parseCsv(buf.toString("utf-8"));
  if (matrix.length < 2) return [];
  const header = matrix[0].map((h) => h.trim().toLowerCase());
  return matrix.slice(1).map((cells) => {
    const obj: Record<string, unknown> = {};
    header.forEach((h, i) => (obj[h] = cells[i] ?? ""));
    return obj;
  });
}

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k] ?? row[k.toLowerCase()];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

export async function importStatements(
  _prev: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const supabase = await createClient();

  // Staff-Check (defensiv, RLS greift ohnehin).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Nicht angemeldet." };

  const clientId = String(formData.get("client_id") ?? "");
  const file = formData.get("file");
  if (!clientId) return { ok: false, message: "Kein Mandant gewählt." };
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Keine Datei ausgewählt." };

  let rows: Record<string, unknown>[];
  try {
    rows = await fileToRows(file);
  } catch {
    return { ok: false, message: "Datei konnte nicht gelesen werden." };
  }
  if (rows.length === 0)
    return { ok: false, message: "Datei enthält keine Datenzeilen." };

  type Parsed = {
    statement: Statement;
    section: string | null;
    code: string | null;
    label: string;
    period: string;
    amount: number;
  };
  const parsed: Parsed[] = [];
  let skipped = 0;

  for (const row of rows) {
    const stmtRaw = pick(row, ["statement", "typ", "art"]).toLowerCase();
    const statement = STATEMENT_ALIASES[stmtRaw];
    const label = pick(row, ["label", "bezeichnung", "konto", "position"]);
    const period = pick(row, ["period", "periode", "monat", "zeitraum"]);
    const amount = parseAmount(pick(row, ["amount", "betrag", "wert", "summe"]));
    if (!statement || !label || !period || amount == null) {
      skipped++;
      continue;
    }
    parsed.push({
      statement,
      section: pick(row, ["section", "bereich", "gruppe"]) || null,
      code: pick(row, ["code", "konto-nr", "kontonr", "kontonummer"]) || null,
      label,
      period,
      amount,
    });
  }

  if (parsed.length === 0)
    return {
      ok: false,
      message: "Keine gültigen Zeilen gefunden. Bitte Vorlage prüfen.",
      skipped,
    };

  // Bestehende Konten laden.
  const { data: existing } = await supabase
    .from("fin_accounts")
    .select("id, statement, code, label, sort")
    .eq("client_id", clientId);

  const keyOf = (statement: string, code: string | null, label: string) =>
    `${statement}|${code ? "C:" + code : "L:" + label}`;

  const idByKey = new Map<string, string>();
  let maxSort = 0;
  for (const a of existing ?? []) {
    idByKey.set(keyOf(a.statement, a.code, a.label), a.id);
    if (a.sort > maxSort) maxSort = a.sort;
  }

  // Neue Konten in Reihenfolge des Auftretens anlegen.
  const toInsert: {
    client_id: string;
    statement: Statement;
    section: string | null;
    code: string | null;
    label: string;
    sort: number;
  }[] = [];
  const seenNew = new Set<string>();
  for (const p of parsed) {
    const key = keyOf(p.statement, p.code, p.label);
    if (idByKey.has(key) || seenNew.has(key)) continue;
    seenNew.add(key);
    toInsert.push({
      client_id: clientId,
      statement: p.statement,
      section: p.section,
      code: p.code,
      label: p.label,
      sort: ++maxSort,
    });
  }

  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase
      .from("fin_accounts")
      .insert(toInsert)
      .select("id, statement, code, label");
    if (error)
      return { ok: false, message: "Konten konnten nicht angelegt werden." };
    for (const a of inserted ?? [])
      idByKey.set(keyOf(a.statement, a.code, a.label), a.id);
  }

  // Werte upserten (Konto × Periode eindeutig).
  const values = parsed.map((p) => ({
    account_id: idByKey.get(keyOf(p.statement, p.code, p.label))!,
    period_key: p.period,
    amount: p.amount,
  }));

  const { error: valErr } = await supabase
    .from("fin_values")
    .upsert(values, { onConflict: "account_id,period_key" });
  if (valErr)
    return { ok: false, message: "Werte konnten nicht gespeichert werden." };

  revalidatePath("/app/finanzen");
  return {
    ok: true,
    message: `${values.length} Werte importiert${skipped ? `, ${skipped} Zeilen übersprungen` : ""}.`,
    imported: values.length,
    skipped,
  };
}
