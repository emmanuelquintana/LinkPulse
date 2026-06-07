"use client";

import React from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ConfirmProvider } from "@/components/ConfirmProvider";

/**
 * Agrupa todos los context providers de cliente en un único límite de cliente.
 * Montarlos juntos desde un componente `"use client"` (en vez de importarlos
 * sueltos en el layout, que es un Server Component) evita problemas de
 * propagación de contexto a través del límite servidor/cliente.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </I18nProvider>
  );
}
