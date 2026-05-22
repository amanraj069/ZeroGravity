import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #110d24 0%, #080512 50%, #030207 100%)",
        color: "#ffffff",
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: 104,
            margin: 0,
            fontWeight: 300,
            letterSpacing: "-0.04em",
            display: "flex",
            alignItems: "center",
            color: "#ffffff",
          }}
        >
          <span style={{ fontWeight: 300 }}>Zero</span>
          <span style={{ fontWeight: 400, fontStyle: "italic", marginLeft: 4 }}>Gravity</span>
        </h1>
        <div
          style={{
            fontSize: 32,
            marginTop: 28,
            maxWidth: 800,
            lineHeight: 1.4,
            color: "rgba(255, 255, 255, 0.65)",
            fontWeight: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span>Break free from ordinary.</span>
          <span style={{ marginTop: 8 }}>Transcend your limits and reach your goals.</span>
        </div>
      </div>
    </div>,
    size,
  );
}
