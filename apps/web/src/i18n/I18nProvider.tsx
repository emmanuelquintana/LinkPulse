"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  Locale,
  translations,
  Translations,
} from "./translations";

const STORAGE_KEY = "linkpulse.locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Diccionario completo del idioma activo. */
  t: Translations;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLocale(value: string | null | undefined): value is Locale {
  return value === "es" || value === "en";
}

function readInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  // Respeta el idioma del navegador en la primera visita.
  const browser = window.navigator.language?.slice(0, 2).toLowerCase();
  if (isLocale(browser)) return browser;
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Hidratamos el idioma elegido en el cliente para evitar mismatches de SSR.
  useEffect(() => {
    setLocaleState(readInitialLocale());
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      // Cookie para que el SSR pueda leer la preferencia si se necesita.
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
  }, []);

  // Mantiene el atributo lang del <html> sincronizado al hidratar.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: translations[locale] }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n debe usarse dentro de un <I18nProvider>");
  }
  return ctx;
}

/** Atajo para acceder solo al diccionario de traducciones. */
export function useTranslation(): Translations {
  return useI18n().t;
}
