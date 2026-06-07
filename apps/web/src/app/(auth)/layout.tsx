import React from "react";
import { LanguageSelector } from "@/components/LanguageSelector";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      {/* Selector de idioma disponible en todas las pantallas de auth */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      {children}
    </div>
  );
}
