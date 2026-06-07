"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "@/i18n/I18nProvider";

export interface ConfirmOptions {
  /** Título principal (corto). */
  title: string;
  /** Texto explicativo opcional. */
  description?: string;
  /** Texto del botón de confirmar. Por defecto "Confirmar". */
  confirmLabel?: string;
  /** Texto del botón de cancelar. Por defecto "Cancelar". */
  cancelLabel?: string;
  /** `danger` pinta el botón de confirmar en rojo (acciones destructivas). */
  variant?: "danger" | "default";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Provee un `confirm(options)` asíncrono que abre un modal estilizado y resuelve
 * a `true`/`false`. Reemplaza al `window.confirm` nativo del navegador.
 *
 * Uso:
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "¿Eliminar?", variant: "danger" })) { ... }
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslation();
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  // Cerrar con Escape (cancela) y enfocar el botón de confirmar al abrir.
  useEffect(() => {
    if (!options) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    confirmButtonRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, close]);

  const isDanger = options?.variant === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {options && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
          onMouseDown={() => close(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ring-1 ring-gray-200 animate-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    isDanger
                      ? "bg-red-50 text-red-600"
                      : "bg-indigo-50 text-indigo-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">
                    {isDanger ? "warning" : "help"}
                  </span>
                </div>
                <div className="flex-1 pt-0.5">
                  <h3
                    id="confirm-title"
                    className="text-base font-bold text-gray-900"
                  >
                    {options.title}
                  </h3>
                  {options.description && (
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                      {options.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {options.cancelLabel ?? t.common.cancel}
                </button>
                <button
                  ref={confirmButtonRef}
                  type="button"
                  onClick={() => close(true)}
                  className={`h-10 px-5 rounded-xl text-sm font-bold text-white transition-colors shadow-sm ${
                    isDanger
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {options.confirmLabel ?? t.common.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm debe usarse dentro de un <ConfirmProvider>");
  }
  return ctx;
}
