import React from "react";
import Link from "next/link";
import { NotificationCenter } from "@/components/NotificationCenter";
import { LanguageSelector } from "@/components/LanguageSelector";

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, actions }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>

      <div className="flex items-center gap-4">
        {actions}

        <LanguageSelector />

        <div className="flex items-center gap-3 border-l border-gray-200 pl-4 ml-2">
          <NotificationCenter />
          <Link
            href="/dashboard/profile"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
