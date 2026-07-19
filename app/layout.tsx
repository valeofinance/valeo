import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valeo – Digitaler CFO-Service für Agenturen",
  description:
    "CFO Takeover für inhabergeführte digitale Agenturen: Zahlen, Forecast und Finanzprozesse – ein Jour fixe pro Woche, der Rest läuft über die App.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
