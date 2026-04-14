import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const bgData = await fetch(
    new URL("../../public/landing/zerogravity_bg.jpg", import.meta.url)
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          background: "black",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 64,
          fontWeight: "bold",
        }}
      >
        <img
          src={bgData as unknown as string}
          alt="ZeroGravity Background"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <span style={{ position: "relative", zIndex: 1 }}>ZeroGravity</span>
        <span style={{ position: "relative", zIndex: 1, fontSize: 28, fontWeight: "normal", marginTop: 12 }}>
          Break free from gravity. Reach your goals.
        </span>
      </div>
    ),
    size
  );
}
