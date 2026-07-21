import { ImageResponse } from "next/og";

// Branded Link-Vorschau (WhatsApp, LinkedIn, iMessage …). 1200×630.
// Hell/einladend, passend zur Landingpage.
export const alt = "Valeo – Externer CFO für digitale Agenturen";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "84px 88px",
          backgroundColor: "#F6F7F4",
          backgroundImage:
            "radial-gradient(820px 520px at 88% -12%, rgba(33,65,240,0.16), transparent 62%), radial-gradient(720px 500px at -6% 112%, rgba(14,122,71,0.12), transparent 60%)",
          color: "#0F1512",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#2141F0",
            fontWeight: 600,
          }}
        >
          Externer CFO für digitale Agenturen
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 150, fontWeight: 800, letterSpacing: 6 }}>
            <span>VALE</span>
            <span style={{ color: "#2141F0" }}>O</span>
          </div>
          <div style={{ fontSize: 46, color: "#4A544E", marginTop: 8, maxWidth: 900, lineHeight: 1.2 }}>
            Dein Steuerberater schaut zurück. Wir schauen nach vorn.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, color: "#4A544E" }}>
          <span>valeo-finance.de</span>
          <span>100% digital · Ein Ansprechpartner</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
