"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi, getErrorMessage } from '@/lib/api';
import { useTranslation } from '@/i18n/I18nProvider';
import { sileo } from 'sileo';

interface Campaign {
  id: string;
  name: string;
}

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    id: string;
    title: string | null;
    shortCode: string;
    originalUrl: string;
    customAlias: string | null;
    workspaceId: string;
    campaignId: string | null;
  } | null;
  onSuccess: () => void;
}

export default function EditLinkModal({ isOpen, onClose, link, onSuccess }: EditLinkModalProps) {
  const t = useTranslation();
  const [destination, setDestination] = useState('');
  const [title, setTitle] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (link) {
      setDestination(link.originalUrl);
      setTitle(link.title || '');
      setCampaignId(link.campaignId || '');
      loadCampaigns(link.workspaceId);
    }
  }, [link]);

  const loadCampaigns = async (workspaceId: string) => {
    setLoadingCampaigns(true);
    try {
      const data = await fetchApi(`/campaigns?workspaceId=${workspaceId}`);
      const items = data.items || data.data || data;
      if (Array.isArray(items)) {
        setCampaigns(items);
      }
    } catch (err) {
      console.error("Failed to load campaigns", err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;

    setLoading(true);
    setError(null);
    try {
      await fetchApi(`/links/${link.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          destination,
          title: title || null,
          campaignId: campaignId || null,
        }),
      });
      sileo.success({ title: t.toasts.linkUpdated });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t.modals.linkUpdateError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !link) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-gray-200 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{t.modals.editLinkTitle}</h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{t.modals.editLinkSubtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full p-1.5 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 block">{t.modals.destinationUrl}</label>
            <input 
              type="url" 
              required 
              placeholder="https://example.com"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">{t.modals.titleOptional}</label>
              <input
                type="text"
                placeholder={t.modals.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">{t.modals.campaignOptional}</label>
              <select 
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                disabled={loadingCampaigns}
                className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold disabled:opacity-50"
              >
                <option value="">{t.modals.noCampaign}</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
             <div className="flex items-center gap-3">
               <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-indigo-600 text-sm">link</span>
               </div>
               <div>
                  <p className="text-[0.7rem] font-bold text-indigo-400 uppercase tracking-wider">{t.modals.shortUrlImmutable}</p>
                  <p className="text-sm font-bold text-indigo-900 truncate">localhost:3002/{link.customAlias || link.shortCode}</p>
               </div>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 h-11 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              {t.common.cancel}
            </button>
            <button 
              type="submit" 
              disabled={loading || !destination}
              className="flex-1 h-11 px-4 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  {t.common.saving}
                </>
              ) : t.modals.saveChanges}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
