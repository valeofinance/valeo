# valeo

Digitaler CFO-Service für Agenturen. Datenbank und App-Fundament.

- **Spezifikation:** [`docs/spec.md`](docs/spec.md) — Produkt, Stack, Scope,
  Compliance und die bewussten Nicht-Entscheidungen.
- **Datenbank:** [`supabase/migrations/`](supabase/migrations) — Kern-Datenmodell
  (Akquise → Mandant → Aufgaben) mit Dedupe-Constraints und RLS-Fundament.

## App starten

```bash
cp .env.example .env.local   # Supabase-URL und Anon-Key eintragen
npm install
npm run dev                  # http://localhost:3000
```

- `/` – öffentliche Landingpage
- `/login` – Anmeldung (Supabase Auth, E-Mail + Passwort)
- `/app` – geschützter Bereich: Team-Cockpit (Staff) bzw. Kundenportal

Nutzer werden manuell im Supabase-Dashboard angelegt (kein Self-Signup).
Gründer zusätzlich in die Tabelle `staff` eintragen.

## Datenbank lokal anwenden

Mit der [Supabase CLI](https://supabase.com/docs/guides/local-development):

```bash
supabase start          # lokalen Stack starten
supabase migration up   # Migrationen anwenden
```

Die Migrationen setzen `auth.users` und `auth.uid()` voraus (von Supabase
bereitgestellt).
