import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pass through layout, relying on the individual pages (Login/Register) 
  // to handle their own backgrounds and centering as defined in the AI Studio mockups.
  return <>{children}</>;
}
