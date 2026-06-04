"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Bell,
  Check,
  CheckCheck,
  FolderKanban,
  Inbox,
  Link2,
  Loader2,
  Megaphone,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchApi } from "@/lib/api";

type NotificationType =
  | "LINK_CREATED"
  | "LINK_ARCHIVED"
  | "CAMPAIGN_CREATED"
  | "WORKSPACE_CREATED"
  | "MEMBER_ADDED"
  | "BILLING"
  | "SYSTEM";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  workspace?: {
    id: string;
    name: string;
  } | null;
}

const iconByType: Record<NotificationType, LucideIcon> = {
  LINK_CREATED: Link2,
  LINK_ARCHIVED: Archive,
  CAMPAIGN_CREATED: Megaphone,
  WORKSPACE_CREATED: FolderKanban,
  MEMBER_ADDED: Users,
  BILLING: WalletCards,
  SYSTEM: Bell,
};

function unwrapData<T>(result: any, fallback: T): T {
  return result?.data ?? result?.items ?? result ?? fallback;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const diffMs = Math.max(Date.now() - timestamp, 0);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

export function NotificationCenter() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasUnread = unreadCount > 0;
  const badgeLabel = useMemo(
    () => (unreadCount > 9 ? "9+" : String(unreadCount)),
    [unreadCount],
  );

  const loadNotifications = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [listResult, countResult] = await Promise.all([
        fetchApi("/notifications?limit=8&status=all"),
        fetchApi("/notifications/unread-count"),
      ]);

      const items = unwrapData<NotificationItem[]>(listResult, []);
      const countPayload = unwrapData<{ count: number }>(countResult, {
        count: 0,
      });
      setNotifications(Array.isArray(items) ? items : []);
      setUnreadCount(countPayload.count ?? 0);
    } catch (err: any) {
      console.error("Failed to load notifications", err);
      setError(err.message || "Notifications are unavailable");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(() => loadNotifications(true), 60000);
    const handleNotificationsUpdated = () => loadNotifications(true);

    window.addEventListener(
      "notifications-updated",
      handleNotificationsUpdated,
    );
    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "notifications-updated",
        handleNotificationsUpdated,
      );
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const markAsRead = async (notification: NotificationItem) => {
    if (notification.readAt) return;

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, readAt } : item,
      ),
    );
    setUnreadCount((current) => Math.max(current - 1, 0));

    try {
      await fetchApi(`/notifications/${notification.id}/read`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
      loadNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    if (!hasUnread) return;

    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt || readAt })),
    );
    setUnreadCount(0);

    try {
      await fetchApi("/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
      loadNotifications(true);
    }
  };

  const deleteNotification = async (notification: NotificationItem) => {
    setNotifications((current) =>
      current.filter((item) => item.id !== notification.id),
    );
    if (!notification.readAt) {
      setUnreadCount((current) => Math.max(current - 1, 0));
    }

    try {
      await fetchApi(`/notifications/${notification.id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete notification", err);
      loadNotifications(true);
    }
  };

  const openNotification = async (notification: NotificationItem) => {
    await markAsRead(notification);
    setIsOpen(false);
    if (notification.href) {
      router.push(notification.href);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-95"
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" strokeWidth={2} />
        {hasUnread && (
          <span className="absolute right-2 top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-30 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="text-sm font-black text-gray-900">Notifications</p>
              <p className="text-[11px] font-semibold text-gray-400">
                {hasUnread ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={!hasUnread}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-600 transition-all hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={2} />
              Mark all
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gray-100 animate-pulse" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 w-2/3 rounded-full bg-gray-100 animate-pulse" />
                      <div className="h-3 w-full rounded-full bg-gray-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <Bell className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-gray-900">{error}</p>
                <button
                  type="button"
                  onClick={() => loadNotifications()}
                  className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-gray-800 active:scale-95"
                >
                  Try again
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                  <Inbox className="h-5 w-5" strokeWidth={2} />
                </div>
                <p className="text-sm font-black text-gray-900">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Activity from links, campaigns and workspaces will appear
                  here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const Icon = iconByType[notification.type] || Bell;
                  const isUnread = !notification.readAt;

                  return (
                    <div
                      key={notification.id}
                      className={`group relative flex w-full gap-3 px-4 py-3 text-left transition-colors ${
                        isUnread
                          ? "bg-indigo-50/50 hover:bg-indigo-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => openNotification(notification)}
                        className="flex min-w-0 flex-1 gap-3 text-left"
                      >
                        <span
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isUnread
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-3">
                            <span className="truncate text-sm font-black text-gray-900">
                              {notification.title}
                            </span>
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </span>
                          {notification.body && (
                            <span className="mt-1 line-clamp-2 block text-xs font-medium leading-relaxed text-gray-500">
                              {notification.body}
                            </span>
                          )}
                          {notification.workspace?.name && (
                            <span className="mt-2 inline-flex max-w-full rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-gray-400 ring-1 ring-gray-100">
                              <span className="truncate">
                                {notification.workspace.name}
                              </span>
                            </span>
                          )}
                        </span>
                      </button>

                      <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification)}
                            className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white hover:text-indigo-600 active:scale-95"
                            aria-label="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification)}
                          className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white hover:text-red-500 active:scale-95"
                          aria-label="Delete notification"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {refreshing && !loading && (
            <div className="absolute bottom-3 right-3 rounded-full bg-white/90 p-1.5 text-gray-400 shadow-sm ring-1 ring-gray-100">
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
