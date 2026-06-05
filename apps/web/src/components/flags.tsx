import React from "react";
import { Locale } from "@/i18n/translations";

type FlagProps = React.SVGProps<SVGSVGElement>;

// Bandera de España (simplificada: rojo-amarillo-rojo).
function FlagES(props: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" role="img" aria-label="España" {...props}>
      <rect width="60" height="40" fill="#c60b1e" />
      <rect y="10" width="60" height="20" fill="#ffc400" />
    </svg>
  );
}

// Bandera de Estados Unidos (simplificada).
function FlagUS(props: FlagProps) {
  return (
    <svg viewBox="0 0 60 40" role="img" aria-label="USA" {...props}>
      <rect width="60" height="40" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 40) / 13} width="60" height={40 / 13} fill="#b22234" />
      ))}
      <rect width="26" height={(40 / 13) * 7} fill="#3c3b6e" />
      <g fill="#fff">
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 6 }).map((__, col) => (
            <circle
              key={`${row}-${col}`}
              cx={3 + col * 4}
              cy={3 + row * 4}
              r="1.1"
            />
          ))
        )}
      </g>
    </svg>
  );
}

const FLAGS: Record<Locale, (props: FlagProps) => React.JSX.Element> = {
  es: FlagES,
  en: FlagUS,
};

export function Flag({
  locale,
  className = "",
  ...props
}: { locale: Locale } & FlagProps) {
  const Component = FLAGS[locale] ?? FlagES;
  return (
    <Component
      className={`rounded-[2px] ring-1 ring-black/10 ${className}`}
      {...props}
    />
  );
}
