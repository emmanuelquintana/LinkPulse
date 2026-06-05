"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/I18nProvider";

interface NavItem {
  href: string;
  icon: string;
  labelKey: keyof ReturnType<typeof useTranslation>["nav"];
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", icon: "dashboard", labelKey: "dashboard" },
  { href: "/dashboard/workspaces", icon: "group_work", labelKey: "workspaces" },
  { href: "/dashboard/links", icon: "link", labelKey: "links" },
  { href: "/dashboard/campaigns", icon: "campaign", labelKey: "campaigns" },
  { href: "/subscribers", icon: "group", labelKey: "audience" },
  { href: "/emails", icon: "mark_email_read", labelKey: "emailCampaigns" },
  { href: "/emails/settings", icon: "settings", labelKey: "emailSettings" },
  { href: "/dashboard/api", icon: "api", labelKey: "apiWebhooks" },
  { href: "/dashboard/billing", icon: "payments", labelKey: "billing" },
];

export function SidebarNav() {
  const t = useTranslation();

  return (
    <div className="px-4 mt-2">
      <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {t.nav.menu}
      </p>
      <nav className="space-y-1">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            {t.nav[item.labelKey]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
