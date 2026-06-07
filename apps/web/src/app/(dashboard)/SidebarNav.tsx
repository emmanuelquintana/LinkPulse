"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useTranslation } from "@/i18n/I18nProvider";

type PermissionKey =
  | "canManageLinks"
  | "canManageEmails"
  | "canViewAnalytics"
  | "canManageMembers"
  | "canManageBilling";

interface NavItem {
  href: string;
  icon: string;
  labelKey: keyof ReturnType<typeof useTranslation>["nav"];
  /** Permiso requerido para ver el ítem. Si no se define, siempre visible. */
  permission?: PermissionKey;
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", icon: "dashboard", labelKey: "dashboard" },
  { href: "/dashboard/workspaces", icon: "group_work", labelKey: "workspaces" },
  { href: "/dashboard/links", icon: "link", labelKey: "links", permission: "canManageLinks" },
  { href: "/dashboard/campaigns", icon: "campaign", labelKey: "campaigns", permission: "canManageLinks" },
  { href: "/subscribers", icon: "group", labelKey: "audience", permission: "canManageEmails" },
  { href: "/emails", icon: "mark_email_read", labelKey: "emailCampaigns", permission: "canManageEmails" },
  { href: "/emails/settings", icon: "settings", labelKey: "emailSettings", permission: "canManageEmails" },
  { href: "/dashboard/api", icon: "api", labelKey: "apiWebhooks", permission: "canManageLinks" },
  { href: "/dashboard/billing", icon: "payments", labelKey: "billing", permission: "canManageBilling" },
];

export function SidebarNav() {
  const t = useTranslation();
  const [permissions, setPermissions] = useState<Record<
    PermissionKey,
    boolean
  > | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchApi("/workspaces/me/permissions");
        const data = res?.data ?? res;
        if (active && data) setPermissions(data);
      } catch (err) {
        console.error("Failed to load permissions", err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const canSee = (item: NavItem) => {
    if (!item.permission) return true;
    // Mientras cargan los permisos, solo mostramos los ítems sin restricción.
    if (!permissions) return false;
    return permissions[item.permission] === true;
  };

  return (
    <div className="px-4 mt-2">
      <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {t.nav.menu}
      </p>
      <nav className="space-y-1">
        {ITEMS.filter(canSee).map((item) => (
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
