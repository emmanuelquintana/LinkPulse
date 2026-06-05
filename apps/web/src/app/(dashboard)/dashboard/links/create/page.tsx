"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { useTranslation } from "@/i18n/I18nProvider";

interface Workspace {
  id: string;
  name: string;
}

export default function CreateLinkPage() {
  const router = useRouter();
  const t = useTranslation();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");

  const [destination, setDestination] = useState("");
  const [title, setTitle] = useState("");
  const [shortCode, setShortCode] = useState("");

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await fetchApi("/workspaces");
        const items = data.items || data.data || data;
        if (Array.isArray(items)) {
          setWorkspaces(items);
          if (items.length > 0) setSelectedWorkspace(items[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
        setError(t.createLink.loadWorkspacesError);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedWorkspace) return;
    async function loadCampaigns() {
      setLoadingCampaigns(true);
      try {
        const data = await fetchApi(
          `/campaigns?workspaceId=${selectedWorkspace}`,
        );
        const items = data.items || data.data || data;
        if (Array.isArray(items)) {
          setCampaigns(items);
          setSelectedCampaign(""); // Reset selection when workspace changes
        }
      } catch (err) {
        console.error("Failed to load campaigns", err);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    loadCampaigns();
  }, [selectedWorkspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) {
      setError(t.createLink.selectWorkspaceError);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await fetchApi("/links", {
        method: "POST",
        body: JSON.stringify({
          destination,
          title: title || undefined,
          alias: shortCode || undefined,
          workspaceId: selectedWorkspace,
          campaignId: selectedCampaign || undefined,
        }),
      });
      window.dispatchEvent(new Event("notifications-updated"));
      // Route back to the links table
      router.push("/dashboard/links");
    } catch (err: any) {
      setError(err.message || t.createLink.createError);
    } finally {
      setCreating(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="max-w-[1400px] mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto font-sans">
      <div className="mb-8">
        <Link
          href="/dashboard/links"
          className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-4 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] mr-1">
            arrow_back
          </span>
          {t.createLink.backToLinks}
        </Link>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
          {t.createLink.title}
        </h2>
        <p className="text-gray-500 mt-2">
          {t.createLink.subtitle}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-lg text-sm font-medium flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-red-500">
                error
              </span>
              <div className="mt-0.5">{error}</div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 block">
              {t.createLink.workspace}
            </label>
            <p className="text-[0.8rem] text-gray-500 mb-2 font-medium">
              {t.createLink.workspaceHelp}
            </p>
            <select
              required
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              <option value="" disabled>
                {t.createLink.selectWorkspace}
              </option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 block">
              {t.createLink.destinationUrl}
            </label>
            <p className="text-[0.8rem] text-gray-500 mb-2 font-medium">
              {t.createLink.destinationHelp}
            </p>
            <input
              type="url"
              required
              placeholder="https://example.com/blog/how-to-use-linkpulse"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-900 flex justify-between">
              {t.createLink.campaign}{" "}
              <span className="text-gray-400 font-normal">({t.common.optional})</span>
            </label>
            <p className="text-[0.8rem] text-gray-500 mb-2 font-medium">
              {t.createLink.campaignHelp}
            </p>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              disabled={loadingCampaigns || campaigns.length === 0}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors disabled:opacity-50"
            >
              <option value="">{t.createLink.noCampaign}</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {campaigns.length === 0 &&
              !loadingCampaigns &&
              selectedWorkspace && (
                <p className="text-[0.7rem] text-indigo-500 font-medium">
                  {t.createLink.noCampaignsInWorkspace}
                </p>
              )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex justify-between">
                {t.createLink.titleLabel}{" "}
                <span className="text-gray-400 font-normal">({t.common.optional})</span>
              </label>
              <p className="text-[0.8rem] text-gray-500 mb-2 font-medium">
                {t.createLink.titleHelp}
              </p>
              <input
                type="text"
                placeholder={t.createLink.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 flex justify-between">
                {t.createLink.customAlias}{" "}
                <span className="text-gray-400 font-normal">({t.common.optional})</span>
              </label>
              <p className="text-[0.8rem] text-gray-500 mb-2 font-medium">
                {t.createLink.customAliasHelp}
              </p>
              <div className="flex items-center">
                <div className="h-11 px-4 bg-gray-100 border border-gray-200 border-r-0 rounded-l-lg text-sm text-gray-500 font-bold flex items-center justify-center">
                  lnk.pl/
                </div>
                <input
                  type="text"
                  placeholder="summer-sale"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  className="flex-1 h-11 px-4 bg-gray-50 border border-gray-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 mt-8 flex justify-end gap-4">
            <Link
              href="/dashboard/links"
              className="h-11 px-6 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              {t.common.cancel}
            </Link>
            <button
              type="submit"
              disabled={creating || !destination || !selectedWorkspace}
              className="h-11 px-8 bg-indigo-600 border border-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 hover:border-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  {t.common.creating}
                </>
              ) : (
                t.createLink.createShortLink
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
