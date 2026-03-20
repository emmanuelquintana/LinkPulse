"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import CreateCampaignModal from '@/components/CreateCampaignModal';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  workspaceId: string;
}

interface Workspace {
  id: string;
  name: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await fetchApi('/workspaces');
        const items = data.items || data.data || data;
        if (Array.isArray(items) && items.length > 0) {
          setWorkspaces(items);
          setSelectedWorkspace(items[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      }
    }
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedWorkspace) return;

    async function loadCampaigns() {
      setLoading(true);
      try {
        const data = await fetchApi(`/campaigns?workspaceId=${selectedWorkspace}`);
        const items = data.items || data.data || data;
        if (Array.isArray(items)) {
          setCampaigns(items);
        }
      } catch (err) {
        console.error("Failed to load campaigns", err);
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
  }, [selectedWorkspace]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Campaigns</h1>
          <p className="text-gray-500 font-medium">Organize and group your links by marketing initiatives.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="flex-1 md:flex-none px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
          >
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Campaign
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-gray-400 hover:text-gray-900">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl font-bold">campaign</span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{campaign.name}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 min-h-[2.5rem] font-medium leading-relaxed">{campaign.description || 'No description provided.'}</p>
              
              <div className="mt-6 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400 border-t border-gray-50 pt-4">
                <span className="px-2 py-1 rounded bg-green-50 text-green-600">{campaign.status}</span>
                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center">
          <div className="h-20 w-20 rounded-full bg-indigo-50 text-indigo-200 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl">campaign</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No campaigns found</h2>
          <p className="text-gray-500 max-w-sm mt-3 font-medium">Create your first campaign to group your links and measure their performance together.</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="mt-8 text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-2 group"
          >
            Get started by creating a campaign
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      )}

      {selectedWorkspace && (
        <CreateCampaignModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          workspaceId={selectedWorkspace}
          onSuccess={() => {
            // Reload campaigns
            setSelectedWorkspace(selectedWorkspace + ''); // simple trigger
          }}
        />
      )}
    </div>
  );
}
