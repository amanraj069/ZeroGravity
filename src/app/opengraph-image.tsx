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
        background: "linear-gradient(135deg, #0b1120 0%, #111827 100%)",
        color: "#ffffff",
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 120,
          height: 120,
          borderRadius: 24,
          background: "rgba(255,255,255,0.08)",
          marginBottom: 40,
        }}
      >
        <span
          style={{ fontSize: 48, fontWeight: 700, letterSpacing: "-0.06em" }}
        >
          ZG
        </span>
      </div>

      <h1 style={{ fontSize: 84, margin: 0, fontWeight: 900 }}>zeroGravity</h1>
      <p
        style={{
          fontSize: 32,
          marginTop: 24,
          maxWidth: 860,
          lineHeight: 1.3,
          opacity: 0.88,
        }}
      >
        Break free from gravity. Reach your goals.
      </p>
    </div>,
    size,
  );
}
