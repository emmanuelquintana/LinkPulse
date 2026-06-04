"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Mail, Plus, Send, BarChart2, Clock, CheckCircle, X, FileText, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface EmailCampaign {
  id: string;
  subject: string;
  previewText: string | null;
  senderEmail: string;
  senderName: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface Workspace {
  id: string;
  name: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  DRAFT: { label: 'Draft', icon: <FileText className="w-3 h-3" />, color: 'bg-gray-100 text-gray-600' },
  SENDING: { label: 'Sending', icon: <Clock className="w-3 h-3" />, color: 'bg-amber-50 text-amber-600' },
  SENT: { label: 'Sent', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-50 text-green-600' },
};

export default function EmailsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

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
    loadCampaigns();
  }, [selectedWorkspace]);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const data = await fetchApi(`/email-campaigns?workspaceId=${selectedWorkspace}&limit=50`);
      const items = data.data || data.items || [];
      setCampaigns(Array.isArray(items) ? items : []);
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(campaignId: string) {
    if (!confirm('Send this campaign to all active subscribers now?')) return;
    setSending(campaignId);
    try {
      const result = await fetchApi(
        `/email-campaigns/${campaignId}/send?workspaceId=${selectedWorkspace}`,
        { method: 'POST' },
      );
      alert(`Sent to ${result?.data?.sent ?? 0} subscribers!`);
      loadCampaigns();
    } catch (err: any) {
      alert(err.message || 'Send failed');
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Mail className="w-8 h-8 text-indigo-600" />
            Email Campaigns
          </h1>
          <p className="text-gray-500 font-medium mt-1">Create and send email campaigns to your audience.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>{ws.name}</option>
            ))}
          </select>
          <Link
            href={`/emails/settings?workspaceId=${selectedWorkspace}`}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Settings className="w-4 h-4" />
            SMTP Settings
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 flex flex-col items-center justify-center text-center">
          <div className="h-20 w-20 rounded-full bg-indigo-50 text-indigo-200 flex items-center justify-center mb-6">
            <Mail className="w-10 h-10 text-indigo-200" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">No campaigns yet</h2>
          <p className="text-gray-500 max-w-sm mt-3 font-medium">Create your first email campaign to start tracking opens, clicks, and engagement.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-8 text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-2 group"
          >
            Create your first campaign
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const statusCfg = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.DRAFT;
            return (
              <div key={campaign.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusCfg.color}`}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                    {campaign.sentAt && (
                      <span className="text-xs text-gray-400">
                        Sent {new Date(campaign.sentAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-gray-900 truncate">{campaign.subject}</h3>
                  {campaign.previewText && (
                    <p className="text-sm text-gray-400 truncate">{campaign.previewText}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    From: {campaign.senderName} &lt;{campaign.senderEmail}&gt;
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {campaign.status === 'SENT' && (
                    <Link
                      href={`/emails/${campaign.id}/stats?workspaceId=${selectedWorkspace}`}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <BarChart2 className="w-4 h-4" />
                      Stats
                    </Link>
                  )}
                  {campaign.status === 'DRAFT' && (
                    <button
                      onClick={() => handleSend(campaign.id)}
                      disabled={sending === campaign.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-60 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      {sending === campaign.id ? 'Sending…' : 'Send'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreate && selectedWorkspace && (
        <CreateCampaignModal
          workspaceId={selectedWorkspace}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); loadCampaigns(); }}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({
  workspaceId,
  onClose,
  onSuccess,
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    subject: '',
    previewText: '',
    senderName: '',
    senderEmail: '',
    htmlContent: '',
    cc: '',
    bcc: '',
    replyTo: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parseEmails = (val: string) =>
    val.split(',').map((e) => e.trim()).filter((e) => e.includes('@'));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await fetchApi('/email-campaigns', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId,
          subject: form.subject,
          previewText: form.previewText || undefined,
          senderName: form.senderName,
          senderEmail: form.senderEmail,
          htmlContent: form.htmlContent,
          cc: form.cc ? parseEmails(form.cc) : undefined,
          bcc: form.bcc ? parseEmails(form.bcc) : undefined,
          replyTo: form.replyTo || undefined,
        }),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">New Email Campaign</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject & Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Subject line *</label>
            <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={inputCls} placeholder="Our May Newsletter" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Preview text</label>
            <input value={form.previewText} onChange={(e) => setForm({ ...form, previewText: e.target.value })}
              className={inputCls} placeholder="What's new this month…" />
          </div>

          {/* Sender */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sender name *</label>
              <input required value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                className={inputCls} placeholder="My Company" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sender email *</label>
              <input required type="email" value={form.senderEmail} onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                className={inputCls} placeholder="noreply@company.com" />
            </div>
          </div>

          {/* Advanced (CC / BCC / Reply-To) */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <span>Advanced options (CC · BCC · Reply-To)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {showAdvanced && (
              <div className="p-4 space-y-3 bg-white">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CC <span className="text-gray-400 font-normal">(comma separated)</span></label>
                  <input value={form.cc} onChange={(e) => setForm({ ...form, cc: e.target.value })}
                    className={inputCls} placeholder="manager@company.com, director@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">BCC <span className="text-gray-400 font-normal">(copia oculta, comma separated)</span></label>
                  <input value={form.bcc} onChange={(e) => setForm({ ...form, bcc: e.target.value })}
                    className={inputCls} placeholder="analytics@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reply-To</label>
                  <input type="email" value={form.replyTo} onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
                    className={inputCls} placeholder="support@company.com" />
                </div>
              </div>
            )}
          </div>

          {/* HTML Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              HTML Content *
              <span className="ml-2 text-xs text-gray-400 font-normal">Use {'{{firstName}}'} for personalization</span>
            </label>
            <textarea required rows={9} value={form.htmlContent}
              onChange={(e) => setForm({ ...form, htmlContent: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-y"
              placeholder={"<h1>Hello {{firstName}}!</h1>\n<p>Check out <a href='https://yoursite.com'>our latest news</a>.</p>"}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
