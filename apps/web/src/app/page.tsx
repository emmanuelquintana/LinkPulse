import type { Metadata } from "next";
import LandingClient from "@/components/landing/LandingClient";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.APP_URL ??
  "http://localhost:3000";

export const metadata: Metadata = {
  title: "LinkPulse — Acortador de enlaces con analíticas y email marketing",
  description:
    "Acorta enlaces, mide cada clic y lanza campañas de email con seguimiento de aperturas, todo en una sola plataforma. Empieza gratis, sin tarjeta.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "LinkPulse — Acorta enlaces. Amplifica resultados.",
    description:
      "Enlaces cortos con analíticas en tiempo real, email marketing con tracking y equipos con permisos granulares. Gratis para empezar.",
    url: SITE_URL,
    type: "website",
  },
};

/**
 * Datos estructurados (JSON-LD) para buscadores: producto SaaS con planes y
 * organización. Mejora rich results y el entendimiento de la marca.
 */
function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "LinkPulse",
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.ico`,
      },
      {
        "@type": "SoftwareApplication",
        name: "LinkPulse",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description:
          "Acortador de enlaces con analíticas en tiempo real, email marketing con seguimiento de aperturas y clics, y gestión de equipos con permisos granulares.",
        offers: [
          {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            name: "Pro",
            price: "19",
            priceCurrency: "USD",
          },
        ],
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "127",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function LandingPage() {
  return (
    <>
      <StructuredData />
      <LandingClient />
    </>
  );
}
