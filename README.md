# valeo

Digitaler CFO-Service für Agenturen. Datenbank und App-Fundament.

- **Spezifikation:** [`docs/spec.md`](docs/spec.md) — Produkt, Stack, Scope,
  Compliance und die bewussten Nicht-Entscheidungen.
- **Datenbank:** [`supabase/migrations/`](supabase/migrations) — Kern-Datenmodell
  (Akquise → Mandant → Aufgaben) mit Dedupe-Constraints und RLS-Fundament.

## Datenbank lokal anwenden

Mit der [Supabase CLI](https://supabase.com/docs/guides/local-development):

```bash
supabase start          # lokalen Stack starten
supabase migration up   # Migrationen anwenden
```

Die Migrationen setzen `auth.users` und `auth.uid()` voraus (von Supabase
bereitgestellt).
