import type { Metadata } from "next";
import LegalShell from "../legal-shell";

export const metadata: Metadata = {
  title: "Impressum – Valeo",
  robots: { index: false, follow: true },
};

const PH = ({ children }: { children: React.ReactNode }) => (
  <span className="ph">{children}</span>
);

export default function Impressum() {
  return (
    <LegalShell title="Impressum" updated="Juli 2026">
      <p className="legal-note">
        Hinweis für die Gründer: Solange die Gesellschaft noch nicht gegründet
        ist, tretet ihr als <strong>natürliche Personen</strong> auf – nennt
        Simon und Loukas mit einer ladungsfähigen Anschrift; die Abschnitte
        „Registereintrag“ und „Umsatzsteuer-ID“ entfallen bis zur Gründung
        (erst mit eingetragener GmbH o. ä. relevant). Alle blau markierten
        Felder <span className="ph">[…]</span> vor dem Livegang ausfüllen und
        das Impressum kurz anwaltlich prüfen lassen.
      </p>

      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        <PH>[Vor der Gründung: Simon Meinberg &amp; Loukas [Nachname] (GbR i. G.) — nach der Gründung: Firmenname, Rechtsform]</PH>
        <br />
        <PH>[Straße und Hausnummer]</PH>
        <br />
        <PH>[PLZ Ort]</PH>
        <br />
        Deutschland
      </p>

      <h2>Vertreten durch</h2>
      <p>
        Simon Meinberg
        <br />
        Loukas <PH>[Nachname]</PH>
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: <a href="mailto:hallo@valeo.finance">hallo@valeo.finance</a>
        <br />
        Telefon: <PH>[optional]</PH>
      </p>

      <h2>Registereintrag &amp; Umsatzsteuer-ID</h2>
      <p>
        <PH>
          [Entfällt bis zur Gründung. Nach Eintragung ergänzen: Registergericht
          (Amtsgericht …), Registernummer (HRB …) sowie ggf. USt-IdNr. nach § 27a
          UStG (DE…).]
        </PH>
      </p>

      <h2>Redaktionell verantwortlich (§ 18 Abs. 2 MStV)</h2>
      <p>
        <PH>[Name]</PH>, Anschrift wie oben.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach
        den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht
        verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
        überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
        Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
        Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon
        unberührt.
      </p>

      <h2>Haftung für Links</h2>
      <p>
        Unser Angebot enthält ggf. Links zu externen Websites Dritter, auf deren
        Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten
        ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Bei
        Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend
        entfernen.
      </p>

      <h2>Urheberrecht</h2>
      <p>
        Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
        Seiten unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als
        solche gekennzeichnet. Vervielfältigung, Bearbeitung und jede Art der
        Verwertung außerhalb der Grenzen des Urheberrechts bedürfen unserer
        schriftlichen Zustimmung.
      </p>

      <h2>Verbraucherstreitbeilegung</h2>
      <p>
        Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren
        vor einer Verbraucherschlichtungsstelle teilzunehmen.
      </p>
    </LegalShell>
  );
}
