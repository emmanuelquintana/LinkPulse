"use client";

import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { Users, Upload, Plus, Tag, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  createdAt: string;
  tags: { id: string; name: string }[];
}

interface Workspace {
  id: string;
  name: string;
}

const STATUS_COLORS: Record<string, string> = {
  SUBSCRIBED: 'bg-green-50 text-green-700',
  UNSUBSCRIBED: 'bg-gray-100 text-gray-500',
  CLEANED: 'bg-red-50 text-red-600',
};

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pageSize = 20;

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const data = await fetchApi('/workspaces');
        const items = data.items || data.data || data;
        if (Array.isArray(items) && items.length > 0) {
          setWorkspaces(items);
          setSelectedWorkspace(items[0].id);
        }
      } catch {}
    }
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedWorkspace) return;
    loadSubscribers();
  }, [selectedWorkspace, page]);

  async function loadSubscribers() {
    setLoading(true);
    try {
      const data = await fetchApi(
        `/subscribers?workspaceId=${selectedWorkspace}&page=${page}&limit=${pageSize}`,
      );
      const items = data.data || data.items || [];
      const elements = data.metadata?.elements ?? data.elements ?? 0;
      setSubscribers(Array.isArray(items) ? items : []);
      setTotalElements(elements);
    } catch {
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;
    try {
      await fetchApi(`/subscribers/${id}?workspaceId=${selectedWorkspace}`, { method: 'DELETE' });
      loadSubscribers();
    } catch {}
  }

  async function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedWorkspace) return;

    setCsvUploading(true);
    setCsvResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await fetchApi(
        `/subscribers/bulk?workspaceId=${selectedWorkspace}`,
        { method: 'POST', body: formData },
      );
      setCsvResult(data.data || data);
      loadSubscribers();
    } catch {
      setCsvResult({ imported: 0, skipped: 0 });
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const totalPages = Math.ceil(totalElements / pageSize);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600" />
            Audience
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage your email subscribers.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedWorkspace}
            onChange={(e) => { setSelectedWorkspace(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            {csvUploading ? 'Importing…' : 'Import CSV'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvUpload}
            />
          </label>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Subscriber
          </button>
        </div>
      </div>

      {/* CSV Result Banner */}
      {csvResult && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between text-sm">
          <span className="text-green-700 font-semibold">
            Import complete: <strong>{csvResult.imported}</strong> imported, <strong>{csvResult.skipped}</strong> skipped.
          </span>
          <button onClick={() => setCsvResult(null)}><X className="w-4 h-4 text-green-600" /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Tags</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Added</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="font-semibold">No subscribers yet</p>
                    <p className="text-xs mt-1">Import a CSV or add subscribers manually.</p>
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{sub.email}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {[sub.firstName, sub.lastName].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {sub.tags.map((tag) => (
                          <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold">
                            <Tag className="w-3 h-3" />
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[sub.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {totalElements} subscribers · Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <AddSubscriberModal
          workspaceId={selectedWorkspace}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); loadSubscribers(); }}
        />
      )}
    </div>
  );
}

function AddSubscriberModal({
  workspaceId,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await fetchApi('/subscribers', {
        method: 'POST',
        body: JSON.stringify({ ...form, workspaceId, tags }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create subscriber');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add Subscriber</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder="user@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Doe"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder="newsletter, vip"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Subscriber'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
