"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { useTranslation } from "@/i18n/I18nProvider";
import { format } from "@/i18n/translations";
import { sileo } from "sileo";
import { getErrorMessage } from "@/lib/api";
import { useConfirm } from "@/components/ConfirmProvider";

interface Link {
  id: string;
  title: string | null;
  shortCode: string;
  customAlias: string | null;
  originalUrl: string;
  clicksCount: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
  workspaceId: string;
  campaignId: string | null;
}

import EditLinkModal from "@/components/EditLinkModal";

interface AnalyticsData {
  date: string;
  count: number;
}

export default function DashboardHomePage() {
  const t = useTranslation();
  const confirm = useConfirm();
  const [links, setLinks] = useState<Link[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modals & Actions State
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadData = async (days = selectedDays) => {
    setLoading(true);
    try {
      const [linksRes, analyticsRes] = await Promise.allSettled([
        fetchApi("/links?limit=50"),
        fetchApi(`/analytics/clicks?days=${days}`),
      ]);

      if (linksRes.status === "fulfilled") {
        const result = linksRes.value;
        const linksData = result.data || result;
        if (Array.isArray(linksData)) {
          setLinks(linksData);
        }
      }

      if (analyticsRes.status === "fulfilled") {
        const result = analyticsRes.value;
        const analyticsData = result.data || result;
        if (Array.isArray(analyticsData)) {
          setAnalytics(analyticsData);
        }
      }
    } catch (error) {
      console.error("Unexpected error loading dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDays]);

  const handleCopy = (link: Link) => {
    const url = `localhost:3002/${link.customAlias || link.shortCode}`;
    navigator.clipboard.writeText(url);
    sileo.success({ title: t.toasts.linkCopied });
    setOpenMenuId(null);
  };

  const handleArchive = async (linkId: string) => {
    const ok = await confirm({
      title: t.confirmDialog.archiveLinkTitle,
      description: t.dashboard.confirmArchive,
      confirmLabel: t.dashboard.archiveLink,
      variant: "danger",
    });
    if (!ok) return;
    try {
      await fetchApi(`/links/${linkId}/archive`, { method: "POST" });
      window.dispatchEvent(new Event("notifications-updated"));
      sileo.success({ title: t.toasts.linkArchived });
      loadData();
    } catch (err: unknown) {
      console.error("Failed to archive link", err);
      sileo.error({ title: t.common.error, description: getErrorMessage(err) });
    }
    setOpenMenuId(null);
  };

  const handleEdit = (link: Link) => {
    setEditingLink(link);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const activeLinksCount = links.filter((l) => l.status !== "ARCHIVED").length;
  const totalClicksCount = links.reduce(
    (acc, curr) => acc + curr.clicksCount,
    0,
  );

  // Fake calculation for CTR since we don't have impressions track yet
  const avgCtr =
    activeLinksCount > 0
      ? ((totalClicksCount / (activeLinksCount * 100)) * 100).toFixed(1)
      : "0.0";

  const recentLinks = [...links]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const dayNames = analytics.map((d) => {
    const date = new Date(d.date + "T00:00:00");
    if (selectedDays === 30) {
      return date.getDate().toString();
    }
    return date.toLocaleDateString("en-US", { weekday: "short" });
  });

  // Calculate mock daily clicks based on links created to simulate movement
  const chartMax = Math.max(...analytics.map((d) => d.count), 10) * 1.2;
  const dailyData = analytics.map((d) => d.count);

  // Create SVG path
  const svgWidth = 1000;
  const svgHeight = 240; // 300 total - 60 padding text
  const points = dailyData.map((val, idx) => {
    const x = (idx / (dailyData.length - 1 || 1)) * svgWidth;
    const y = svgHeight - (val / chartMax) * svgHeight;
    return `${x},${Math.max(y, 10)}`; // guarantee not to clip top
  });

  // Custom spline path (simplified tension)
  const createPath = () => {
    if (points.length === 0) return "";
    const [startX, startY] = points[0].split(",").map(Number);
    let d = `M${startX},${startY} `;

    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i].split(",").map(Number);
      const [x2, y2] = points[i + 1].split(",").map(Number);

      const cp1x = x1 + (x2 - x1) / 2;
      const cp1y = y1;
      const cp2x = cp1x;
      const cp2y = y2;

      d += `C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2} `;
    }
    return d;
  };

  const pathD = createPath();
  const fillPathD = `${pathD} L${svgWidth},${svgHeight} L0,${svgHeight} Z`;

  if (loading && analytics.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 font-sans">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-gray-500">
              {t.dashboard.totalClicks}
            </span>
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-indigo-600">
                touch_app
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4 tracking-tight">
            {totalClicksCount.toLocaleString()}
          </h2>
          <div className="flex items-center text-sm">
            <span className="flex items-center font-bold text-emerald-600">
              <span className="material-symbols-outlined text-[16px] mr-1">
                trending_up
              </span>{" "}
              --%
            </span>
            <span className="font-medium text-gray-400 ml-1.5">
              {t.dashboard.vsLast7Days}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-gray-500">
              {t.dashboard.activeLinks}
            </span>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600">
                link
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4 tracking-tight">
            {activeLinksCount.toLocaleString()}
          </h2>
          <div className="flex items-center text-sm">
            <span className="flex items-center font-bold text-emerald-600">
              <span className="material-symbols-outlined text-[16px] mr-1">
                trending_up
              </span>{" "}
              --%
            </span>
            <span className="font-medium text-gray-400 ml-1.5">
              {t.dashboard.vsLast7Days}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold text-gray-500">
              {t.dashboard.avgCtr}
            </span>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500">
                ads_click
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4 tracking-tight">
            {avgCtr}%
          </h2>
          <div className="flex items-center text-sm">
            <span className="flex items-center font-bold text-rose-500">
              <span className="material-symbols-outlined text-[16px] mr-1">
                trending_down
              </span>{" "}
              --%
            </span>
            <span className="font-medium text-gray-400 ml-1.5">
              {t.dashboard.vsLast7Days}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 flex flex-col relative">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              {t.dashboard.clicksOverview}
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              {t.dashboard.analyticsPerformance}
            </p>
          </div>

          {/* Custom Premium Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all group"
            >
              <span className="material-symbols-outlined text-[20px] text-gray-400 group-hover:text-indigo-600">
                calendar_today
              </span>
              {format(t.dashboard.lastNDays, { n: selectedDays })}
              <span
                className="material-symbols-outlined text-[18px] text-gray-400 group-hover:text-indigo-600 transition-transform duration-200"
                style={{
                  transform: isDropdownOpen ? "rotate(180deg)" : "none",
                }}
              >
                expand_more
              </span>
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl p-1.5 z-20 animate-in zoom-in-95 duration-150 origin-top-right ring-1 ring-black/5">
                  <button
                    onClick={() => {
                      setSelectedDays(7);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold rounded-xl transition-all ${selectedDays === 7 ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {t.dashboard.last7Days}
                    {selectedDays === 7 && (
                      <span className="material-symbols-outlined text-[18px]">
                        check
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDays(30);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold rounded-xl transition-all ${selectedDays === 30 ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    {t.dashboard.last30Days}
                    {selectedDays === 30 && (
                      <span className="material-symbols-outlined text-[18px]">
                        check
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {links.length === 0 ? (
          <div className="w-full h-[320px] flex flex-col items-center justify-center border-t border-gray-50">
            <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-gray-200">
                monitoring
              </span>
            </div>
            <p className="font-black text-gray-900">{t.dashboard.noDataTitle}</p>
            <p className="text-sm text-gray-400 font-medium">
              {t.dashboard.noDataSubtitle}
            </p>
          </div>
        ) : (
          <div className="w-full h-[320px] flex items-end justify-between relative">
            {/* Y-Axis */}
            <div className="absolute left-0 top-0 bottom-10 w-14 flex flex-col justify-between text-[0.65rem] font-black text-gray-400 text-right pr-4 border-r border-gray-50 z-10 bg-white">
              <span>{Math.round(chartMax)}</span>
              <span>{Math.round(chartMax * 0.75)}</span>
              <span>{Math.round(chartMax * 0.5)}</span>
              <span>{Math.round(chartMax * 0.25)}</span>
              <span>0</span>
            </div>

            <div className="flex-1 ml-14 h-full relative group">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 bottom-10 top-0 flex flex-col justify-between z-0 pointer-events-none">
                <div className="w-full border-b border-gray-50 flex-1"></div>
                <div className="w-full border-b border-gray-50 flex-1"></div>
                <div className="w-full border-b border-gray-50 flex-1"></div>
                <div className="w-full border-b border-gray-50 flex-1"></div>
                <div className="w-full"></div>
              </div>

              {/* Chart Line & Area */}
              <div className="absolute inset-x-0 bottom-10 top-0 z-10 opacity-90 overflow-hidden px-1">
                {loading ? (
                  <div className="w-full h-full flex items-center justify-center bg-white/50 backdrop-blur-[1px] absolute inset-0 z-20">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : null}

                <svg
                  preserveAspectRatio="none"
                  className="w-full h-full"
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                >
                  <defs>
                    <linearGradient
                      id="chartFillGradient"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#4f46e5"
                        stopOpacity="0.25"
                      />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <path
                    fill="url(#chartFillGradient)"
                    d={fillPathD}
                    className="transition-all duration-700"
                  />
                  <path
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={pathD}
                    className="transition-all duration-700"
                    filter="url(#glow)"
                  />
                </svg>
              </div>

              {/* X-Axis Labels */}
              <div className="absolute bottom-0 inset-x-0 h-10 flex justify-between items-center text-[0.65rem] font-black text-gray-400 px-1">
                {dayNames.map((name, i) => {
                  // Filter labels for 30 days view
                  if (selectedDays === 30) {
                    if (i % 5 !== 0 && i !== dayNames.length - 1)
                      return (
                        <div
                          key={i}
                          className="w-0 overflow-visible opacity-0"
                        ></div>
                      );
                  }
                  return (
                    <span key={i} className="uppercase tracking-widest">
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-visible relative">
        <div className="flex items-center justify-between p-8 border-b border-gray-50">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">
              {t.dashboard.recentLinks}
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              {t.dashboard.latestActivity}
            </p>
          </div>
          <Link
            href="/dashboard/links"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all group"
          >
            {t.dashboard.viewAllLinks}
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>

        <div className="p-2">
          <table className="w-full text-sm text-left border-separate border-spacing-y-1">
            <thead className="text-[0.65rem] text-gray-400 uppercase font-black tracking-[0.15em]">
              <tr>
                <th className="px-6 py-4">{t.dashboard.shortLink}</th>
                <th className="px-6 py-4 text-center">{t.dashboard.destination}</th>
                <th className="px-6 py-4 text-center w-32">{t.dashboard.usage}</th>
                <th className="px-6 py-4 text-center w-32">{t.dashboard.created}</th>
                <th className="px-6 py-4 text-center w-24">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody>
              {recentLinks.length > 0 ? (
                recentLinks.map((link) => (
                  <tr
                    key={link.id}
                    className="group hover:bg-gray-50/80 transition-all rounded-2xl"
                  >
                    <td className="px-6 py-5 first:rounded-l-2xl">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-900 tracking-tight">
                          localhost:3002/{link.customAlias || link.shortCode}
                        </span>
                        <span className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[150px]">
                          {link.title || t.common.untitled}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <div
                          className="flex items-center gap-2 text-gray-500 font-bold text-xs bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm max-w-[200px] group-hover:border-indigo-100/50 transition-colors"
                          title={link.originalUrl}
                        >
                          <span className="material-symbols-outlined text-[16px] text-gray-300">
                            link
                          </span>
                          <span className="truncate">
                            {link.originalUrl.replace(/^https?:\/\//, "")}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold text-[0.7rem] shadow-sm shadow-indigo-100/50 border border-indigo-100/50">
                        <span className="material-symbols-outlined text-[14px]">
                          bolt
                        </span>
                        {link.clicksCount}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center text-[0.65rem] text-gray-400 font-black uppercase tracking-widest">
                      {new Date(link.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-5 text-center last:rounded-r-2xl relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === link.id ? null : link.id,
                          );
                        }}
                        className={`h-9 w-9 rounded-xl transition-all flex items-center justify-center ${openMenuId === link.id ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          more_horiz
                        </span>
                      </button>

                      {openMenuId === link.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-14 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 z-20 animate-in zoom-in-95 duration-150 origin-top-right ring-1 ring-black/5">
                            <button
                              onClick={() => handleCopy(link)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                content_copy
                              </span>
                              {t.dashboard.copyLink}
                            </button>
                            <button
                              onClick={() => handleEdit(link)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                edit
                              </span>
                              {t.dashboard.editDetails}
                            </button>
                            <div className="h-px bg-gray-50 my-1 mx-2" />
                            <button
                              onClick={() => handleArchive(link.id)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                archive
                              </span>
                              {t.dashboard.archiveLink}
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-gray-200">
                          link_off
                        </span>
                      </div>
                      <p className="text-gray-900 font-black">
                        {t.dashboard.noActiveLinks}
                      </p>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        {t.dashboard.shareLinksHint}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditLinkModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLink(null);
        }}
        link={editingLink}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
