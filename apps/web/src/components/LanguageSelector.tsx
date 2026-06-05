"use client";

import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { LOCALES } from "@/i18n/translations";
import { Flag } from "@/components/flags";

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const active = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.common.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
      >
        <Flag locale={active.code} className="h-4 w-6 shrink-0" />
        <span className="uppercase tracking-wide">{active.code}</span>
        <span
          className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            {t.common.language}
          </p>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === locale}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                l.code === locale
                  ? "font-semibold text-indigo-600"
                  : "text-gray-700"
              }`}
            >
              <Flag locale={l.code} className="h-4 w-6 shrink-0" />
              <span className="flex-1">{l.label}</span>
              {l.code === locale && (
                <span className="material-symbols-outlined text-[18px] text-indigo-600">
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
