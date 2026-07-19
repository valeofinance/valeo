import Link from "next/link";

// Platzhalter-Landingpage. Wird durch das finale Design
// (Claude-Artifact der Gründer) ersetzt – Struktur bleibt:
// öffentliche Seite hier, das Tool selbst liegt hinter /login.
export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-xl font-semibold tracking-tight">Valeo</span>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#leistungen" className="hover:underline">
            Leistungen
          </a>
          <a href="#ablauf" className="hover:underline">
            Ablauf
          </a>
          <Link
            href="/login"
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700"
          >
            Login
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16">
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Ihr CFO – ohne die Personalie.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-600">
          Valeo übernimmt die Finanzführung Ihrer Agentur: belastbare Zahlen,
          rollierender 13-Wochen-Forecast und klare Entscheidungsvorlagen.
          Ein Jour fixe pro Woche – alles andere läuft über die App.
        </p>
        <div className="mt-8 flex gap-4">
          <a
            href="#kontakt"
            className="rounded-md bg-neutral-900 px-5 py-3 font-medium text-white hover:bg-neutral-700"
          >
            Erstgespräch anfragen
          </a>
          <a
            href="#leistungen"
            className="rounded-md border border-neutral-300 px-5 py-3 font-medium hover:bg-neutral-100"
          >
            Mehr erfahren
          </a>
        </div>
      </section>

      <section id="leistungen" className="border-t border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3">
          <div>
            <h2 className="font-semibold">Zahlen, die tragen</h2>
            <p className="mt-2 text-sm text-neutral-600">
              KPI-Modell und Liquiditätsblick statt Bauchgefühl – aufbereitet
              für Entscheidungen, nicht für Ordner.
            </p>
          </div>
          <div>
            <h2 className="font-semibold">13-Wochen-Forecast</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Rollierend, wöchentlich aktualisiert. Sie sehen Engpässe, bevor
              sie im Kontoauszug stehen.
            </p>
          </div>
          <div>
            <h2 className="font-semibold">Ein Termin pro Woche</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Ein Jour fixe per Video, vorbereitet mit Agenda und Protokoll.
              Aufgaben und Status jederzeit im Portal.
            </p>
          </div>
        </div>
      </section>

      <section id="ablauf" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">
          CFO Takeover in drei Schritten
        </h2>
        <ol className="mt-8 space-y-6">
          <li className="flex gap-4">
            <span className="font-semibold text-neutral-400">01</span>
            <div>
              <h3 className="font-medium">Onboarding</h3>
              <p className="text-sm text-neutral-600">
                Aufnahme von Konten, Verträgen und Zahlenwerk. Aufbau des
                KPI-Modells und des ersten Forecasts.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="font-semibold text-neutral-400">02</span>
            <div>
              <h3 className="font-medium">Laufender Betrieb</h3>
              <p className="text-sm text-neutral-600">
                Wöchentlicher Jour fixe, laufende Aufgaben und Freigaben im
                Kundenportal, Belegstatus im Blick.
              </p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="font-semibold text-neutral-400">03</span>
            <div>
              <h3 className="font-medium">Entscheidungen</h3>
              <p className="text-sm text-neutral-600">
                Szenarien und Entscheidungsvorlagen, wenn es darauf ankommt –
                Bank, Investitionen, Personal.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <footer
        id="kontakt"
        className="border-t border-neutral-200 bg-white"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-10 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">Valeo</span>
          <span>Digitaler CFO-Service für Agenturen.</span>
        </div>
      </footer>
    </main>
  );
}
