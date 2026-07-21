"use client";

import { useActionState, useRef } from "react";
import { importStatements, type ImportResult } from "./actions";

export default function ImportPanel({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState<
    ImportResult | null,
    FormData
  >(importStatements, null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="fin-import">
      <input type="hidden" name="client_id" value={clientId} />
      <label className="fin-file">
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept=".csv,.xlsx,.xls"
          required
        />
        <span className="fin-file-btn">Datei wählen (CSV/Excel)</span>
      </label>
      <button type="submit" className="fin-import-btn" disabled={pending}>
        {pending ? "Importiere …" : "Importieren"}
      </button>
      <a className="fin-template" href="/valeo-finanzen-vorlage.csv" download>
        Vorlage herunterladen
      </a>
      {state && (
        <span className={`fin-msg ${state.ok ? "ok" : "err"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
