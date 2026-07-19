"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import "./landing.css";

// Landingpage, portiert aus dem Claude-Artifact der Gründer.
// Das Tool selbst liegt hinter /login (geschützter Bereich /app).
export default function Home() {
  const cockpitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => cockpitRef.current?.classList.add("reveal-done"),
      300
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".landing .rv").forEach((el) => io.observe(el));

    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, []);

  return (
    <div className="landing">
      <nav>
        <div className="wrap nav-inner">
          <a className="wordmark" href="#top">
            VALE<span>O</span>
          </a>
          <div className="nav-links">
            <a href="#leistung">Leistung</a>
            <a href="#pakete">Pakete</a>
            <a href="#team">Team</a>
            <a href="#faq">FAQ</a>
            <Link className="btn btn-ghost" href="/login">
              Login
            </Link>
            <a className="btn" href="#termin">
              Erstgespräch buchen
            </a>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <header className="hero" id="top">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">Externer CFO für digitale Agenturen</span>
            <h1>
              Dein Steuerberater schaut zurück.
              <br />
              <em>Wir schauen nach vorn.</em>
            </h1>
            <p className="lead">
              Wir übernehmen deinen kompletten Finanzbereich – von der Struktur
              bis zur Strategie. Du siehst tagesaktuell deine Zahlen, triffst
              bessere Entscheidungen und musst dich nie wieder mit Finanzchaos
              beschäftigen.
            </p>
            <div className="hero-ctas">
              <a className="btn" href="#termin">
                Kostenloses Erstgespräch
              </a>
              <a className="btn btn-ghost" href="#pakete">
                Pakete &amp; Preise ansehen
              </a>
            </div>
            <p className="hero-note">
              100% digital · Ein Ansprechpartner · Start in{" "}
              <span className="mono">max. 14 Tagen</span>
            </p>
          </div>

          <div className="cockpit" id="cockpit" ref={cockpitRef}>
            <div className="cockpit-head">
              <span className="t">Dein Finanz-Cockpit</span>
              <span className="live">tagesaktuell</span>
            </div>
            <div className="kpi-row">
              <div className="kpi">
                <div className="l">Liquidität</div>
                <div className="v">
                  248.400 <small>€</small>
                </div>
              </div>
              <div className="kpi">
                <div className="l">Runway</div>
                <div className="v up">
                  11,2 <small>Monate</small>
                </div>
              </div>
              <div className="kpi">
                <div className="l">Projektmarge Ø</div>
                <div className="v up">
                  38,4 <small>%</small>
                </div>
              </div>
              <div className="kpi">
                <div className="l">Fixkosten / Monat</div>
                <div className="v">
                  86.100 <small>€</small>
                </div>
              </div>
            </div>
            <svg
              className="spark"
              viewBox="0 0 320 54"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <polyline
                points="0,44 32,40 64,42 96,34 128,36 160,28 192,30 224,22 256,18 288,14 320,8"
                fill="none"
                stroke="#0E7A47"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <polyline
                points="0,44 32,40 64,42 96,34 128,36 160,28 192,30 224,22 256,18 288,14 320,8 320,54 0,54"
                fill="rgba(14,122,71,.08)"
                stroke="none"
              />
            </svg>
            <div className="ledger">
              <div className="ledger-line">
                <span>Forecast Q4 aktualisiert</span>
                <span className="amt pos">✓ heute</span>
              </div>
              <div className="ledger-line">
                <span>Plan-Ist-Abgleich Oktober</span>
                <span className="amt pos">✓ freigegeben</span>
              </div>
              <div className="ledger-line">
                <span>Hiring-Szenario „2 Seniors&ldquo;</span>
                <span className="amt neg">berechnet</span>
              </div>
              <div className="ledger-line">
                <span>Offene Posten</span>
                <span className="amt pos">0 überfällig</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ================= CLAIMS ================= */}
      <div className="claims" aria-hidden="true">
        <div className="claims-track">
          <span>Bauchgefühl ist kein Forecast.</span>
          <span>Deine Marge geschieht. Mit uns sogar geplant.</span>
          <span>Groß denken. Durchrechnen lassen.</span>
          <span>Liquidität: das einzige Creative, das immer performen muss.</span>
          <span>Finanzen in Topform.</span>
          <span>Bauchgefühl ist kein Forecast.</span>
          <span>Deine Marge geschieht. Mit uns sogar geplant.</span>
          <span>Groß denken. Durchrechnen lassen.</span>
          <span>Liquidität: das einzige Creative, das immer performen muss.</span>
          <span>Finanzen in Topform.</span>
        </div>
      </div>

      {/* ================= PAINS ================= */}
      <section id="leistung">
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">Kommt dir bekannt vor?</span>
            <h2>Du führst eine Agentur. Nicht eine Finanzabteilung.</h2>
            <p>
              Die meisten Agentur-Gründer machen Finanzen „nebenbei&ldquo; –
              zwischen Pitches, Projekten und Personal. Das Ergebnis kennen wir
              aus jedem Erstgespräch:
            </p>
          </div>
          <div className="pain-grid">
            <div className="pain rv">
              <span className="tag">Blindflug</span>
              <h3>Bauchgefühl ist kein Forecast.</h3>
              <p>
                Kein klarer Blick auf Cashflow, Kostenstruktur oder
                Projektmargen. Die BWA kommt zwei Monate zu spät – wenn
                überhaupt jemand reinschaut.
              </p>
            </div>
            <div className="pain rv">
              <span className="tag">Dauerstress</span>
              <h3>„Können wir uns das leisten?&ldquo;</h3>
              <p>
                Hiring, Marketing, neue Tools: Wachstumsentscheidungen werden
                verschoben, weil die Datenbasis fehlt. Nachts rechnet der Kopf
                weiter.
              </p>
            </div>
            <div className="pain rv">
              <span className="tag">Zeitfresser</span>
              <h3>Belege, Rückfragen, Lohn</h3>
              <p>
                Stunden verschwinden in Belegsuche und Steuerberater-Pingpong –
                Zeit, die in Kunden und Team gehört.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= VERGLEICH ================= */}
      <section>
        <div className="wrap">
          <div className="vs rv">
            <div className="wrap">
              <span className="eyebrow">Der Unterschied</span>
              <h2>
                Buchhaltung verwaltet die Vergangenheit. Wir steuern die
                Zukunft.
              </h2>
              <div
                className="vs-table"
                role="table"
                aria-label="Vergleich Steuerberater und Valeo"
              >
                <div className="vs-col left" role="row">
                  <span className="col-t">Status quo</span>
                  <ul>
                    <li>BWA von vor zwei Monaten</li>
                    <li>Zahlen ohne Einordnung</li>
                    <li>Reaktiv: verbucht, was reinkommt</li>
                    <li>Keine Planung, kein Forecast</li>
                    <li>Rückfragen statt Antworten</li>
                  </ul>
                </div>
                <div className="vs-col right" role="row">
                  <span className="col-t">Mit Valeo</span>
                  <ul>
                    <li>Tagesaktuelles KPI-Dashboard</li>
                    <li>Klare Handlungsempfehlungen</li>
                    <li>Proaktiv: Forecast &amp; Szenarien</li>
                    <li>Plan-Ist-Abgleich jeden Monat</li>
                    <li>Sparringspartner auf WhatsApp</li>
                  </ul>
                </div>
              </div>
              <p style={{ marginTop: 22, fontSize: ".88rem", color: "#96A19A" }}>
                Und dein Steuerberater? Bleibt. Wir liefern ihm saubere
                Vorarbeit – das macht auch seinen Job leichter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= ABLAUF ================= */}
      <section>
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">So starten wir</span>
            <h2>Vom Kick-off bis „läuft&ldquo; in maximal 14 Tagen.</h2>
          </div>
          <div className="steps">
            <div className="step rv">
              <h3>Erstgespräch &amp; Analyse</h3>
              <p>
                30–45 Minuten, wir beide gemeinsam mit dir. Wir schauen auf
                deine Situation, deine Zahlen und sagen dir ehrlich, ob und wie
                wir helfen können.
              </p>
            </div>
            <div className="step rv">
              <h3>Aufräumen &amp; Setup</h3>
              <p>
                Kontenrahmen, Tools, Prozesse, OPOS – wir schaffen die saubere
                Grundlage und bauen dein Dashboard mit den Kennzahlen, die
                zählen.
              </p>
            </div>
            <div className="step rv">
              <h3>Steuern &amp; Wachsen</h3>
              <p>
                Monatliches Strategie-Sparring, laufende Forecasts,
                Ad-hoc-Support. Du entscheidest datenbasiert – wir halten die
                Zahlen im Griff.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PAKETE ================= */}
      <section id="pakete">
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">Pakete &amp; Preise</span>
            <h2>Transparent. Modular. Mitwachsend.</h2>
            <p>
              Keine versteckten Kosten, keine Tagessatz-Diskussionen. Du weißt
              vorher, was es kostet – und was du dafür bekommst.
            </p>
          </div>
          <div className="plans">
            <div className="plan rv">
              <h3>CFO Sprint</h3>
              <p className="sub">Einmaliges Glattziehen deines Finanzbereichs</p>
              <div className="price">
                20.000 <small>€ einmalig</small>
              </div>
              <p className="price-note">Dauer: 1–3 Monate</p>
              <ul>
                <li>Buchhaltungs- &amp; Prozess-Setup (SKR04, DATEV, Tools)</li>
                <li>Zwei-Konten-Modell &amp; OPOS-Bereinigung</li>
                <li>Businessplan &amp; Controlling-Grundlage</li>
                <li>KPI-Dashboard, Banken- &amp; Auftragsspiegel</li>
                <li>Saubere Übergabe an deinen Steuerberater</li>
              </ul>
              <a className="btn btn-ghost" href="#termin">
                Sprint anfragen
              </a>
            </div>

            <div className="plan core rv">
              <span className="badge">Unser Kernprodukt</span>
              <h3>CFO Takeover</h3>
              <p className="sub">Dein externer CFO – dauerhaft an deiner Seite</p>
              <div className="price">
                4.000 <small>€ / Monat</small>
              </div>
              <p className="price-note">
                + 10.000 € Onboarding · 12 Monate Mindestlaufzeit
              </p>
              <ul>
                <li>Komplettes Setup wie im CFO Sprint</li>
                <li>Monatliches Strategie-Sparring</li>
                <li>Forecasts, Szenarien &amp; Plan-Ist-Abgleiche</li>
                <li>Tagesaktuelles KPI-Dashboard</li>
                <li>Ad-hoc-Support via WhatsApp</li>
                <li>Begleitung bei Pricing, Hiring &amp; Finanzierung</li>
              </ul>
              <a className="btn" href="#termin">
                Erstgespräch buchen
              </a>
            </div>

            <div className="plan rv">
              <h3>Finance Takeover</h3>
              <p className="sub">Komplette Finanzabteilung aus einer Hand</p>
              <div className="price">
                6.500 <small>€ / Monat</small>
              </div>
              <p className="price-note">
                + 10.000 € Onboarding · Abrechnung nach Aufwand
              </p>
              <ul>
                <li>Alles aus dem CFO Takeover</li>
                <li>Vorbereitende Buchhaltung &amp; Belegmanagement</li>
                <li>Vorbereitende Lohnbuchhaltung</li>
                <li>Schnittstellen zu Personio &amp; DATEV</li>
                <li className="dim">Verfügbarkeit begrenzt – auf Anfrage</li>
              </ul>
              <a className="btn btn-ghost" href="#termin">
                Verfügbarkeit anfragen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TEAM ================= */}
      <section id="team">
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">Wer dahinter steht</span>
            <h2>Zwei Unternehmer. Ein Team. Deine Finanzabteilung.</h2>
            <p>
              Wir sind keine anonyme Beratung mit wechselnden
              Junior-Consultants. Bei uns sitzt du immer mit beiden Gründern am
              Tisch – vom Erstgespräch bis zum Strategie-Call.
            </p>
          </div>
          <div className="team">
            <div className="founder rv">
              <div className="avatar">S</div>
              <h3>Simon Meinberg</h3>
              <span className="role">Gründer &amp; CFO</span>
              <p>
                Unternehmer aus der Praxis: hat selbst einen Betrieb mit über
                100 Mitarbeitern geführt, Unternehmen gekauft, finanziert und
                restrukturiert. Kennt Banken, DATEV und Wachstumsschmerzen aus
                erster Hand – nicht aus dem Lehrbuch.
              </p>
            </div>
            <div className="founder rv">
              <div className="avatar">L</div>
              <h3>Loukas [Nachname]</h3>
              <span className="role">Gründer &amp; CFO</span>
              <p>
                [Platzhalter: 2–3 Sätze zu Loukas – beruflicher Hintergrund,
                Finanz-Expertise, was er in die Partnerschaft einbringt. Analog
                zum Profil von Simon formulieren.]
              </p>
            </div>
            <div className="team-note rv">
              <strong>Unser Prinzip:</strong> Wir betreuen bewusst nur wenige
              Kunden gleichzeitig – dafür beide gemeinsam, mit voller
              Aufmerksamkeit. Qualität vor Volumen.
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq">
        <div className="wrap">
          <div className="sec-head rv">
            <span className="eyebrow">Häufige Fragen</span>
            <h2>Kurz &amp; ehrlich beantwortet.</h2>
          </div>
          <div className="faq rv">
            <details>
              <summary>Was macht ihr genau?</summary>
              <div className="a">
                Wir übernehmen deinen Finanzbereich – von der Struktur in der
                Buchhaltung über Controlling und Dashboards bis zur
                strategischen CFO-Rolle. Du hast einen Ansprechpartner, der
                alles regelt, und siehst deine Zahlen tagesaktuell statt zwei
                Monate verspätet.
              </div>
            </details>
            <details>
              <summary>Ersetzt ihr meinen Steuerberater?</summary>
              <div className="a">
                Nein – wir ergänzen ihn. Der Steuerberater bleibt für
                Abschlüsse und Steuern zuständig. Wir liefern ihm saubere,
                vorkontierte Daten und übernehmen alles, was er nicht tut:
                Planung, Forecasts, Controlling und strategisches Sparring.
                Sein Job wird dadurch sogar leichter.
              </div>
            </details>
            <details>
              <summary>Für wen ist das gedacht?</summary>
              <div className="a">
                Für digitale Agenturen mit etwa 10–50 Mitarbeitern, die wachsen
                wollen, aber keinen eigenen CFO oder interne Finanzabteilung
                haben. Wenn du dich im Abschnitt oben wiedererkannt hast, lohnt
                sich ein Gespräch.
              </div>
            </details>
            <details>
              <summary>Was, wenn bei uns noch Chaos herrscht?</summary>
              <div className="a">
                Perfekt – genau dafür gibt es das Onboarding bzw. den CFO
                Sprint. Wir räumen auf, schaffen Struktur und bauen ein solides
                Fundament. Je größer das Chaos, desto schneller spürst du den
                Unterschied.
              </div>
            </details>
            <details>
              <summary>Wie schnell könnt ihr starten?</summary>
              <div className="a">
                Nach dem Erstgespräch und ein paar Infos von dir dauert es in
                der Regel maximal 14 Tage vom Kick-off bis zur Übergabe. Dann
                läuft das Ding.
              </div>
            </details>
            <details>
              <summary>Warum betreut ihr nur wenige Kunden?</summary>
              <div className="a">
                Weil wir jeden Kunden zu zweit und persönlich betreuen – ohne
                Junior-Team dazwischen. Das begrenzt bewusst unsere Kapazität
                und sichert die Qualität, für die du bezahlst.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section id="termin">
        <div className="wrap">
          <div className="cta-final rv">
            <h2>Nie wieder Zahlenchaos.</h2>
            <p>
              Buch dir 30 Minuten mit uns beiden. Wir schauen gemeinsam auf
              deine Situation und sagen dir ehrlich, ob und wie wir dir helfen
              können – ohne Verkaufsdruck.
            </p>
            <a
              className="btn"
              href="https://calendly.com/PLATZHALTER"
              target="_blank"
              rel="noopener"
            >
              Kostenloses Erstgespräch buchen
            </a>
            <p className="mono-note">
              30 Min · Video-Call · Simon &amp; Loukas persönlich
            </p>
            <p className="mono-note" style={{ marginTop: 8 }}>
              ⚠ Warnung: Klare Zahlen können zu ruhigem Schlaf führen.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot">
          <span className="copy">
            © 2026 Valeo [GmbH i.G.] · Finanzen in Topform.
          </span>
          <span className="links">
            <a href="#">Impressum</a>
            <a href="#">Datenschutz</a>
            <a href="mailto:hallo@valeo.finance">hallo@valeo.finance</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
