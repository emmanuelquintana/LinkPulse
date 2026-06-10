import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToasterProvider } from '@/components/ToasterProvider';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.APP_URL ??
  'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'LinkPulse — Acortador de enlaces con analíticas',
    template: '%s | LinkPulse',
  },
  description:
    'Acorta enlaces, mide cada clic y lanza campañas de email con seguimiento. Analíticas en tiempo real, equipos con permisos y marca personalizada.',
  keywords: [
    'acortador de enlaces',
    'url shortener',
    'analíticas de enlaces',
    'email marketing',
    'seguimiento de clics',
    'link in bio',
    'UTM',
  ],
  applicationName: 'LinkPulse',
  authors: [{ name: 'LinkPulse' }],
  openGraph: {
    type: 'website',
    siteName: 'LinkPulse',
    locale: 'es_MX',
    url: SITE_URL,
    title: 'LinkPulse — Acorta enlaces. Amplifica resultados.',
    description:
      'Enlaces cortos con analíticas en tiempo real, email marketing con tracking y equipos con permisos granulares.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkPulse — Acorta enlaces. Amplifica resultados.',
    description:
      'Enlaces cortos con analíticas en tiempo real y email marketing con tracking.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <ToasterProvider />
      </body>
    </html>
  );
}
