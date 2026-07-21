import Link from "next/link";
import "./legal.css";

// Gemeinsame Hülle für Impressum/Datenschutz: Kopf mit Wortmarke, Prosa-Spalte,
// Fußzeile mit Querverlinkung.
export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal">
      <header className="legal-nav">
        <div className="legal-nav-inner">
          <Link href="/" className="legal-wm">
            VALE<span>O</span>
          </Link>
          <Link href="/" className="legal-back">
            ← Zur Startseite
          </Link>
        </div>
      </header>

      <main className="legal-main">
        <h1>{title}</h1>
        <div className="legal-updated">Stand: {updated}</div>
        {children}

        <div className="legal-foot">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <a href="mailto:hallo@valeo.finance">hallo@valeo.finance</a>
        </div>
      </main>
    </div>
  );
}
