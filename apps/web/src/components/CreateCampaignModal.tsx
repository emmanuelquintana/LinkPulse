"use client";

import React, { useState } from "react";
import { fetchApi } from "@/lib/api";
import { localizeApiError } from "@/lib/api-errors";
import { useTranslation } from "@/i18n/I18nProvider";
import { sileo } from "sileo";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspaceId: string;
}

export default function CreateCampaignModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceId,
}: CreateCampaignModalProps) {
  const t = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await fetchApi("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          workspaceId,
          name,
          description,
        }),
      });
      window.dispatchEvent(new Event("notifications-updated"));
      sileo.success({ title: t.toasts.campaignCreated });
      onSuccess();
      onClose();
      setName("");
      setDescription("");
    } catch (err: unknown) {
      setError(localizeApiError(err, t) || t.modals.campaignCreateError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">
            {t.modals.createCampaignTitle}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="text-sm font-semibold text-gray-700"
            >
              {t.modals.campaignName}
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.modals.campaignNamePlaceholder}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-gray-700"
            >
              {t.modals.descriptionOptional}
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.modals.descriptionPlaceholder}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t.modals.createCampaign
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
