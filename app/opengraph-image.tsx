import { ImageResponse } from "next/og";

// Branded Link-Vorschau (WhatsApp, LinkedIn, iMessage …). 1200×630.
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
          backgroundColor: "#0f1512",
          backgroundImage:
            "radial-gradient(900px 500px at 85% -10%, rgba(33,65,240,0.30), transparent 60%), radial-gradient(800px 500px at 0% 110%, rgba(14,122,71,0.22), transparent 60%)",
          color: "#EDEFEA",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#8FA0FF",
            fontWeight: 600,
          }}
        >
          Externer CFO für digitale Agenturen
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 150, fontWeight: 800, letterSpacing: 6 }}>
            <span>VALE</span>
            <span style={{ color: "#4D6BFF" }}>O</span>
          </div>
          <div style={{ fontSize: 46, color: "#C6CCC4", marginTop: 8, maxWidth: 900, lineHeight: 1.2 }}>
            Dein Steuerberater schaut zurück. Wir schauen nach vorn.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, color: "#8A938C" }}>
          <span>valeo-finance.de</span>
          <span>100% digital · Ein Ansprechpartner</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
