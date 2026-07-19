# Valeo – Digitaler CFO-Service für Agenturen

> Produkt- und Architekturspezifikation. Diese Datei ist die Quelle der
> Wahrheit für Scope, Stack und die bewussten Nicht-Entscheidungen. Änderungen
> am Umfang laufen über diese Datei, damit „was gebaut wird" und „was bewusst
> nicht gebaut wird" nicht auseinanderdriften.

## 1. Kontext

Zwei Gründer (Simon, Loukas), 50/50, beide im Nebenerwerb. Zielgruppe: digitale
Agenturen, 10–50 Mitarbeiter, inhabergeführt. Kernprodukt: **CFO Takeover**
(10.000 € Onboarding + 4.000 €/Monat, 12 Monate Mindestlaufzeit). Ziel Jahr 1:
3–5 Retainer-Kunden.

Betriebsmodell: **max. ein Jour fixe per Videocall pro Woche und Kunde.** Alles
andere läuft über die App. Entwicklungskapazität: ca. 10 h/Woche pro Person.

## 2. Leitprinzip

Optimiert wird auf **wenig Eigenbau**, nicht auf wenig externe Tools. Bauzeit ist
die knappste Ressource, nicht Geld. Ein 50-€-Abo, das zwei Wochenenden spart,
ist immer der bessere Deal.

## 3. Stack

| Baustein          | Wahl                                                        |
| ----------------- | ----------------------------------------------------------- |
| App + Hosting     | Next.js auf Vercel                                          |
| DB, Auth, Storage, Cron | Supabase, Region Frankfurt                            |
| Zahlung + Rechnung | Stripe Billing / Invoicing                                 |
| E-Rechnung        | Stripe-Marketplace-App (Billit o. ä.), ZUGFeRD/XRechnung    |
| Bankdaten         | PSD2-Aggregator (FinAPI, Kosma oder GoCardless)             |
| Intelligenz       | Anthropic API, direkt                                       |
| Mail raus         | Resend                                                       |
| Mail rein         | Resend Inbound / Postmark Inbound (BCC-Ingest)             |
| Videocall         | Zoom-API bzw. Microsoft Graph, kein Embedding in v1         |
| Terminbuchung     | Cal.com                                                      |

## 4. Bewusst NICHT gebaut

- Kein n8n, kein Retool, kein Metabase → Edge Functions + pg_cron + eigene Routen.
- Kein externes CRM → Akquise-Modul ist Teil der App (Begründung: siehe § 8).
- Keine eigene E-Mail-Engine (kein Zwei-Wege-Sync, kein Thread-Handling) →
  BCC-Ingest.
- Keine Verfügbarkeitsberechnung über mehrere Kalender → Cal.com.
- Keine Sequenzen, kein Dialer, kein Lead-Scoring, keine Rollenrechte (2 Nutzer).
- Kein Video im eigenen Frontend (Zoom Meeting SDK / Teams Live Share = zu teuer).
- Keine Originalbelege in eigener Ablage → nur Statustracking; Belege gehen
  direkt an DATEV Unternehmen online bzw. DMS des Steuerberaters. Grund:
  vermeidet GoBD-Aufbewahrungspflicht stellvertretend für den Kunden.

## 5. Module

1. **Akquise** – Pipeline, Deals, Aktivitäten, Anreicherung.
2. **Call-Loop** – Agenda vor dem Termin, Transkript, Protokoll, Aufgaben danach.
3. **Aufgabenpipeline** – drei Ausführungsmodi (§ 9).
4. **Kundenportal** – Mandantensicht: Zahlen, Aufgaben, Belegstatus.
5. **Team-Cockpit** – alle Mandanten, Freigaben, Was-liegt-an-Ansicht.
6. **Datenschicht** – KPI-Modell, rollierender 13-Wochen-Forecast.
7. **Abrechnung** – Spiegel von Stripe, plus GoBD-Archivierung.

## 6. Baureihenfolge

1. **Akquise-Modul** – braucht ihr sofort, hängt an keiner Kundendatenqualität,
   zwingt zu sauberem Auth- und RLS-Fundament.
2. **Call-Loop** – bei jedem Kunden identisch, unabhängig vom Toolstack des
   Kunden, spart ab Tag eins echte Zeit.
3. **Aufgabenpipeline.**
4. **Kundenportal + Dashboards** – zuletzt: kundenspezifisch, bricht an
   Datenqualität.

Parallel dazu wird Kunde eins **manuell** bedient (Wizard of Oz), mit
Stundentracking pro Tätigkeit. Die Messung bestimmt, was als Nächstes
automatisiert wird.

## 7. Datenmodell (Kern)

```
raw_events   id, source, payload jsonb, received_at, processed_at, error
companies    id, domain (unique, normalisiert), name, enrichment jsonb
contacts     id, email (unique), company_id, name, rolle
deals        id, company_id, phase, paket, wert, owner, source, next_action_at
activities   id, deal_id, typ (mail|call|notiz), inhalt, created_at
clients      id, deal_id, stripe_customer_id, onboarding_status
tasks        id, client_id, titel, execution_mode, status, due_at, owner
```

Die technische Umsetzung liegt in `supabase/migrations/` — siehe
`0001_core_schema.sql`.

Entscheidend: `clients.deal_id`. Der Lead wird zum Mandanten, ohne dass Daten
kopiert werden. Das ist der eigentliche Grund für den CRM-Eigenbau.

Stripe ist **System of Record** für alles Vertragliche (Customer, Subscription,
Invoice). Supabase referenziert nur per ID. Keine doppelte Wahrheit über Preise
und Laufzeiten.

## 8. Lead-Ingest

Ein generischer Endpoint `POST /api/ingest` für alle Quellen (Perspective,
Mailpostfach, weitere). Rohdaten **zuerst** unverändert nach `raw_events`,
Parsing danach. Grund: Parser sind anfangs falsch, Rohdaten erlauben Replay.

**Dedupe-Regeln:**

- E-Mail als natürlicher Schlüssel für Kontakte, Upsert statt Insert.
- Domain als Schlüssel für Companies, normalisiert, Freemail ausgeschlossen.
- Ein offener Deal pro Company; weitere Leads hängen als Aktivität an.
- Merge-Knopf im Cockpit für die Restfälle.

Mailpostfach **nicht** komplett einlesen. Expliziter Trigger: Weiterleitung an
`lead@in.<domain>` oder Gmail-Label. Sonst wird jeder Absender zum Lead und
Art. 14 DSGVO greift flächendeckend.

## 9. Aufgaben: drei Ausführungsmodi

- **`auto`** – deterministisch, kein LLM. Erinnerungen, Fristen, Datenabgleich,
  Alerts, Reportgenerierung aus Templates.
- **`draft`** – LLM erzeugt, Mensch gibt frei. Reportkommentare, Kundenantworten,
  Szenarien, Protokollzusammenfassungen. Der Freigabeschritt ist Haftungsschutz,
  keine Bremse.
- **`manual`** – nur die Gründer. Entscheidungen, Eskalationen, Bank und
  Investoren.

Kein autonomer Versand von Aussagen mit Zahlenbezug. Einzige Ausnahme mit
Außenwirkung: Sofortantwort auf eingehende Leads, aus vorab freigegebenem
Textbaustein.

## 10. Compliance – muss vor Kunde eins stehen

- **AVV** je Kunde, inkl. Liste der Unterauftragsverarbeiter (Supabase, Vercel,
  Stripe, Anthropic, PSD2-Anbieter, Resend, Cal.com).
- **SCC** für US-Dienste, Supabase-Region explizit Frankfurt.
- **§ 201 StGB**: Aufzeichnung nicht öffentlich gesprochenen Wortes ist ohne
  Einwilligung aller Beteiligten strafbar. Consent **pro Teilnehmer**, nicht pro
  Mandant. Auch für Dritte im Call (Steuerberater, Bankberater). Widerruf
  jederzeit, mit sofortiger Wirkung.
- **GoBD**: Rechnungen append-only, PDF und XML unveränderlich in Storage,
  Nummernvergabe über Postgres-Sequence in der Transaktion, 10 Jahre. Stripe ist
  kein Archiv → Nightly Job zieht finalisierte Rechnungen.
- **Art. 14 DSGVO** bei Kaltkontakten: Hinweis in der ersten Kontaktaufnahme.
- **§ 6 StBerG** begrenzt Paket 3 (Finance Takeover): laufende Buchführung und
  Lohnabrechnung zulässig, Umsatzsteuervoranmeldung und Abschluss nicht.
  Anwaltlich klären, bevor Prozesse dafür gebaut werden.

## 11. Zahlung

Standard beim Retainer: **SEPA-Lastschrift**. Standard bei Onboarding und Sprint:
**Rechnung mit Überweisung**, ggf. Meilensteine. Kreditkarte nur als Option.

Grund gegen Karte-only: Firmenkartenlimits deutscher Agenturen sind oft durch
Media-Spend belegt, ein 20.000-€-Einzug scheitert regelmäßig. Zudem fallen
Firmenkarten nicht unter die EU-Interchange-Deckelung; die Gebühren liegen
deutlich über den 1,4 % + 0,25 € für regulierte Verbraucherkarten.

## 12. Offene Punkte

- Firmenname und Domain final, Markenkollision prüfen.
- Gesellschaftsvertrag: Deadlock, Ausstieg/Vesting, Gewinnverwendung, Abgrenzung
  zu Bäckerei Huck, Meinberg Finance GmbH und Loukas' Anstellung.
- Toolstack-Hypothese verifizieren: 10 Agenturen fragen, welche Systeme sie
  einsetzen. Unter 60 % Überschneidung kippt das Automatisierungsmodell.
