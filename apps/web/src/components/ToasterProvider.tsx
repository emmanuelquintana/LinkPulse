"use client";

import { Toaster } from "sileo";

/**
 * Modo de apariencia de las toasts.
 *
 * De momento solo está habilitado "light" (la app es de fondo blanco). Cuando
 * implementes el modo oscuro global, cambia este valor a "dark" — o, mejor,
 * conéctalo a tu contexto/estado de tema (p. ej. `useTheme()`).
 */
const TOAST_MODE: "light" | "dark" = "light";

/**
 * Mapea nuestro modo a la configuración de sileo.
 *
 * Para máximo contraste, la toast usa el color OPUESTO al fondo de la app:
 *   - app clara  → toast OSCURA (gris oscuro, texto claro)
 *   - app oscura → toast CLARA  (blanca, texto oscuro)
 *
 * ⚠️ sileo invierte la nomenclatura de su prop `theme`: `theme="light"` produce
 * una toast oscura y `theme="dark"` una clara. Por eso aquí lo traducimos y
 * fijamos el color de fondo (`fill`) explícitamente.
 */
const MODE_CONFIG: Record<
  "light" | "dark",
  { sileoTheme: "light" | "dark"; fill: string }
> = {
  light: { sileoTheme: "light", fill: "#1f2937" }, // app clara → toast gris oscuro
  dark: { sileoTheme: "dark", fill: "#ffffff" }, //  app oscura → toast blanca
};

export function ToasterProvider() {
  const cfg = MODE_CONFIG[TOAST_MODE];
  return (
    <Toaster
      position="top-center"
      theme={cfg.sileoTheme}
      options={{ fill: cfg.fill }}
    />
  );
}
