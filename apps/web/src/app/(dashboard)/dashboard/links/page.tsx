"use client";

import React, { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { localizeApiError } from "@/lib/api-errors";
import Link from "next/link";
import EditLinkModal from "@/components/EditLinkModal";
import { useTranslation } from "@/i18n/I18nProvider";
import { format } from "@/i18n/translations";
import { sileo } from "sileo";
import { useConfirm } from "@/components/ConfirmProvider";

interface LinkData {
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
  workspace?: { id: string; name: string; plan?: string } | null;
}

const PAGE_SIZES = [10, 100, 1000] as const;

export default function LinksPage() {
  const t = useTranslation();
  const confirm = useConfirm();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [limit, setLimit] = useState<number>(PAGE_SIZES[0]);

  // Modals & Actions State
  const [editingLink, setEditingLink] = useState<LinkData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const loadLinks = async (page: number = 1) => {
    setLoading(true);
    try {
      const result = await fetchApi(`/links?page=${page}&limit=${limit}`);

      // Handle the new paginated structure from TransformInterceptor
      if (result && Array.isArray(result.data) && result.metadata) {
        setLinks(result.data);
        setCurrentPage(result.metadata.page || page);
        setTotalElements(result.metadata.elements || 0);
        setTotalPages(Math.ceil((result.metadata.elements || 0) / limit));
      } else if (result && Array.isArray(result.data)) {
        // Fallback if metadata is missing but data is an array
        setLinks(result.data);
      } else if (Array.isArray(result)) {
        // Legacy fallback
        setLinks(result);
      }
    } catch (error) {
      console.error("Failed to load links", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const handleCopy = (link: LinkData) => {
    const url = `localhost:3002/${link.customAlias || link.shortCode}`;
    navigator.clipboard.writeText(url);
    sileo.success({ title: t.toasts.linkCopied });
    setOpenMenuId(null);
  };

  const handleArchive = async (linkId: string) => {
    const ok = await confirm({
      title: t.confirmDialog.archiveLinkTitle,
      description: t.linksPage.confirmArchive,
      confirmLabel: t.linksPage.archive,
      variant: "danger",
    });
    if (!ok) return;

    try {
      await fetchApi(`/links/${linkId}/archive`, { method: "POST" });
      window.dispatchEvent(new Event("notifications-updated"));
      sileo.success({ title: t.toasts.linkArchived });
      loadLinks(currentPage);
    } catch (err: unknown) {
      console.error("Failed to archive link", err);
      sileo.error({ title: t.common.error, description: localizeApiError(err, t) });
    }
    setOpenMenuId(null);
  };

  const handleEdit = (link: LinkData) => {
    setEditingLink(link);
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const activeLinks = links.filter((l) => l.status !== "ARCHIVED");

  return (
    <>
      <div className="max-w-[1400px] mx-auto font-sans animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {t.linksPage.title}
            </h2>
            <p className="text-gray-500 font-medium mt-1">
              {t.linksPage.subtitle}
            </p>
          </div>
          <Link
            href="/dashboard/links/create"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            {t.linksPage.createLink}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm relative z-0">
            <div className="overflow-visible">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[0.7rem] text-gray-400 uppercase font-black tracking-[0.1em] border-b border-gray-50 bg-gray-50/30">
                  <tr>
                    <th className="px-8 py-5 w-1/4 first:rounded-tl-3xl">
                      {t.linksPage.shortLink}
                    </th>
                    <th className="px-8 py-5 w-1/4 text-center">{t.linksPage.destination}</th>
                    <th className="px-8 py-5 text-center">{t.linksPage.workspaceCol}</th>
                    <th className="px-8 py-5 text-center">{t.linksPage.clicks}</th>
                    <th className="px-8 py-5 text-center">{t.linksPage.created}</th>
                    <th className="px-8 py-5 text-right whitespace-nowrap last:rounded-tr-3xl">
                      {t.common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {activeLinks.length > 0 ? (
                    activeLinks.map((link) => (
                      <tr
                        key={link.id}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        <td className="px-8 py-5">
                          <button
                            type="button"
                            onClick={() => handleCopy(link)}
                            title={t.linksPage.copyLink}
                            className="flex items-center gap-3 text-left cursor-pointer group/copy"
                          >
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <span className="material-symbols-outlined text-[20px]">
                                link
                              </span>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 mb-0.5 flex items-center gap-1.5 group-hover/copy:text-indigo-600 transition-colors">
                                localhost:3002/
                                {link.customAlias || link.shortCode}
                                <span className="material-symbols-outlined text-[16px] text-gray-300 opacity-0 group-hover/copy:opacity-100 group-hover/copy:text-indigo-400 transition-opacity">
                                  content_copy
                                </span>
                              </p>
                              <p className="text-[0.7rem] text-gray-400 font-bold uppercase tracking-wider">
                                {link.title || t.linksPage.untitledLink}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center">
                            <p
                              className="text-gray-500 font-medium truncate max-w-[250px] bg-gray-50 px-3 py-1 rounded-lg border border-gray-100/50"
                              title={link.originalUrl}
                            >
                              {link.originalUrl}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {link.workspace ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs max-w-[160px]"
                              title={link.workspace.name}
                            >
                              <span className="material-symbols-outlined text-[14px] shrink-0">
                                group_work
                              </span>
                              <span className="truncate">{link.workspace.name}</span>
                            </span>
                          ) : (
                            <span className="text-gray-300 font-bold text-xs">—</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className="px-4 py-1.5 rounded-full bg-green-50 text-green-700 font-black text-xs">
                            {link.clicksCount}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center text-gray-500 font-bold text-xs whitespace-nowrap">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5 text-right relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === link.id ? null : link.id,
                              );
                            }}
                            className={`p-2 rounded-xl transition-all ${openMenuId === link.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}
                          >
                            <span className="material-symbols-outlined text-[24px]">
                              more_horiz
                            </span>
                          </button>

                          {/* Action Menu Popover */}
                          {openMenuId === link.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-8 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1.5 z-20 animate-in zoom-in-95 duration-150 origin-top-right">
                                <button
                                  onClick={() => handleCopy(link)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    content_copy
                                  </span>
                                  {t.linksPage.copyLink}
                                </button>
                                <button
                                  onClick={() => handleEdit(link)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    edit
                                  </span>
                                  {t.linksPage.editLink}
                                </button>
                                <div className="h-px bg-gray-50 my-1 mx-2" />
                                <button
                                  onClick={() => handleArchive(link.id)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    archive
                                  </span>
                                  {t.linksPage.archive}
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-8 py-20 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
                            <span className="material-symbols-outlined text-5xl text-gray-200">
                              link_off
                            </span>
                          </div>
                          <div>
                            <p className="text-xl font-black text-gray-900">
                              {t.linksPage.noActiveLinks}
                            </p>
                            <p className="text-gray-500 font-medium mt-1">
                              {t.linksPage.readyFirstLink}
                            </p>
                          </div>
                          <Link
                            href="/dashboard/links/create"
                            className="mt-2 text-indigo-600 font-bold hover:underline flex items-center gap-1"
                          >
                            {t.linksPage.createLinkNow}{" "}
                            <span className="material-symbols-outlined text-sm">
                              arrow_forward
                            </span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalElements > 0 && (
              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  {t.linksPage.showing}{" "}
                  <span className="text-gray-900">
                    {(currentPage - 1) * limit + 1}
                  </span>{" "}
                  {t.linksPage.to}{" "}
                  <span className="text-gray-900">
                    {Math.min(currentPage * limit, totalElements)}
                  </span>{" "}
                  {t.linksPage.of} <span className="text-gray-900">{totalElements}</span>{" "}
                  {t.linksPage.linksWord}
                </p>

                <div className="flex items-center gap-4">
                  {/* Page size selector */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl bg-white border border-gray-200 p-1">
                      {PAGE_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => handleLimitChange(size)}
                          className={`px-3 h-8 rounded-lg text-xs font-black transition-all ${limit === size ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
                      {t.linksPage.perPage}
                    </span>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined">
                          chevron_left
                        </span>
                      </button>
                      <div className="flex items-center px-4 h-10 rounded-xl bg-white border border-gray-200 text-sm font-black text-gray-900">
                        {currentPage} / {totalPages}
                      </div>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <span className="material-symbols-outlined">
                          chevron_right
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <EditLinkModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLink(null);
        }}
        link={editingLink}
        onSuccess={() => loadLinks(currentPage)}
      />
    </>
  );
}
