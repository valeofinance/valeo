import type { Metadata } from "next";
import LegalShell from "../legal-shell";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – Valeo",
  robots: { index: false, follow: true },
};

const PH = ({ children }: { children: React.ReactNode }) => (
  <span className="ph">{children}</span>
);

export default function Datenschutz() {
  return (
    <LegalShell title="Datenschutzerklärung" updated="Juli 2026">
      <p className="legal-note">
        Hinweis für die Gründer: Diese Erklärung deckt die öffentliche Website
        und den Login-Bereich ab. Verantwortlichen-Angaben{" "}
        <span className="ph">[…]</span> ausfüllen und vor dem Livegang prüfen
        lassen. Sobald Zahlungsabwicklung, E-Mail-Versand oder Bankdaten aktiv
        sind, hier ergänzen. Die Verarbeitung von Mandantendaten im Rahmen des
        CFO-Service ist gesondert über den AVV je Kunde geregelt.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        <PH>[Firmenname, Rechtsform]</PH>, <PH>[Anschrift]</PH>, vertreten durch
        Simon Meinberg und Loukas <PH>[Nachname]</PH>.
        <br />
        E-Mail: <a href="mailto:hallo@valeo.finance">hallo@valeo.finance</a>
      </p>

      <h2>2. Grundsätzliches</h2>
      <p>
        Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung
        einer funktionsfähigen Website und unserer Leistungen erforderlich ist.
        Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 DSGVO. Die Verarbeitung
        erfolgt DSGVO-konform.
      </p>

      <h2>3. Hosting &amp; Auslieferung der Website</h2>
      <p>
        Die Website wird bei der <strong>Vercel Inc.</strong> (USA) gehostet. Beim
        Aufruf verarbeitet der Server automatisch technische Zugriffsdaten
        (u. a. gekürzte IP-Adresse, Zeitpunkt, angeforderte Ressource,
        Referrer, User-Agent), um die Seite sicher und stabil auszuliefern –
        Art. 6 Abs. 1 lit. f DSGVO. Die Übermittlung in die USA ist durch die
        EU-Standardvertragsklauseln (SCC) abgesichert.
      </p>

      <h2>4. Datenbank &amp; Anmeldung (geschützter Bereich)</h2>
      <p>
        Der Login-Bereich (Team-Cockpit und Kundenportal) nutzt{" "}
        <strong>Supabase</strong> mit Serverstandort <strong>Frankfurt (EU)</strong>
        {" "}für Datenbank, Authentifizierung und Speicherung. Zur Aufrechterhaltung
        der Anmeldung werden ausschließlich technisch notwendige Sitzungs-Cookies
        gesetzt – Art. 6 Abs. 1 lit. b DSGVO und § 25 Abs. 2 TDDG (keine
        Einwilligung erforderlich).
      </p>

      <h2>5. Cookies</h2>
      <p>
        Auf der öffentlichen Website setzen wir <strong>keine</strong> Tracking-,
        Analyse- oder Marketing-Cookies. Im Login-Bereich werden nur technisch
        notwendige Cookies verwendet. Ein Cookie-Banner ist daher nicht
        erforderlich.
      </p>

      <h2>6. Schriftarten</h2>
      <p>
        Schriftarten werden lokal von unserem Server ausgeliefert. Es findet{" "}
        <strong>keine</strong> Verbindung zu externen Font-Diensten (z. B. Google
        Fonts) und keine Übermittlung Ihrer IP-Adresse an Dritte statt.
      </p>

      <h2>7. Kontaktaufnahme</h2>
      <p>
        Wenn Sie uns per E-Mail kontaktieren, verarbeiten wir Ihre Angaben zur
        Bearbeitung der Anfrage – Art. 6 Abs. 1 lit. b bzw. lit. f DSGVO. Die
        Daten werden gelöscht, sobald sie nicht mehr benötigt werden und keine
        gesetzlichen Aufbewahrungspflichten entgegenstehen.
      </p>

      <h2>8. Empfänger / Auftragsverarbeiter</h2>
      <ul>
        <li>Vercel Inc. – Hosting (USA, abgesichert über SCC)</li>
        <li>Supabase – Datenbank, Authentifizierung, Storage (EU, Frankfurt)</li>
      </ul>
      <p>
        Mit Auftragsverarbeitern bestehen Verträge nach Art. 28 DSGVO. Weitere
        Dienste (z. B. Zahlungsabwicklung, E-Mail-Versand, Terminbuchung) werden
        ergänzt, sobald sie eingesetzt werden.
      </p>

      <h2>9. Speicherdauer</h2>
      <p>
        Wir speichern personenbezogene Daten nur so lange, wie es für die
        genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen
        dies vorschreiben.
      </p>

      <h2>10. Ihre Rechte</h2>
      <p>
        Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
        Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) sowie Widerspruch (Art. 21 DSGVO). Zudem
        besteht ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde
        (Art. 77 DSGVO), z. B. der Behörde Ihres Wohnorts oder{" "}
        <PH>[zuständige Aufsichtsbehörde des Firmensitzes]</PH>.
      </p>

      <h2>11. Verschlüsselung</h2>
      <p>
        Diese Website nutzt aus Sicherheitsgründen eine SSL-/TLS-Verschlüsselung
        (erkennbar am „https“ in der Adresszeile).
      </p>
    </LegalShell>
  );
}
