import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sileo';
import { I18nProvider } from '@/i18n/I18nProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LinkPulse - Acortador de Enlaces',
  description: 'Gestión moderna y analíticas para tus enlaces',
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
        <I18nProvider>{children}</I18nProvider>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
