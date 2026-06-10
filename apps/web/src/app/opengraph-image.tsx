import { ImageResponse } from "next/og";

export const alt = "LinkPulse — Acorta enlaces. Amplifica resultados.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen Open Graph generada en el servidor (compartidos en redes). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #7c3aed 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            color: "white",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 88,
              height: 88,
              borderRadius: 24,
              background: "rgba(255,255,255,0.15)",
              fontSize: 48,
            }}
          >
            🔗
          </div>
          LinkPulse
        </div>
        <div
          style={{
            marginTop: 36,
            color: "white",
            fontSize: 44,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          Acorta enlaces. Amplifica resultados.
        </div>
        <div
          style={{
            marginTop: 20,
            color: "rgba(224,231,255,0.9)",
            fontSize: 26,
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Analíticas en tiempo real · Email marketing con tracking · Equipos con permisos
        </div>
      </div>
    ),
    size,
  );
}
