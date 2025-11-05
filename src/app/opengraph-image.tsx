import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OgImage() {
  const accent = "#38bdf8";
  const secondary = "#6366f1";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: `radial-gradient(circle at top, ${accent}22, transparent 60%), radial-gradient(circle at bottom right, ${secondary}20, #05020a)`,
          color: "white",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, letterSpacing: "0.45em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>
          <span>ARYAN DOKANIA</span>
          <span>AI RESUME</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <span style={{ fontSize: 20, textTransform: "uppercase", letterSpacing: "0.35em", color: "rgba(255,255,255,0.5)" }}>
            Neural Portfolio Interface
          </span>
          <h1 style={{ fontSize: 78, lineHeight: 1.05, fontWeight: 700 }}>
            Ask My Experience.<br /> Discover The Highlights.
          </h1>
          <p style={{ fontSize: 26, color: "rgba(255,255,255,0.68)", maxWidth: 720 }}>
            AI-assisted search across projects, research, and cloud-native systems engineering.
          </p>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 22, color: "rgba(255,255,255,0.8)", letterSpacing: "0.28em", textTransform: "uppercase" }}>
          <span style={{ padding: "12px 20px", borderRadius: 999, border: `1px solid ${accent}55`, background: `${accent}15` }}>
            ML + Cloud
          </span>
          <span style={{ padding: "12px 20px", borderRadius: 999, border: `1px solid ${secondary}45`, background: `${secondary}15` }}>
            Research
          </span>
          <span style={{ padding: "12px 20px", borderRadius: 999, border: `1px solid rgba(255,255,255,0.3)`, background: "rgba(255,255,255,0.08)" }}>
            Interactive
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
