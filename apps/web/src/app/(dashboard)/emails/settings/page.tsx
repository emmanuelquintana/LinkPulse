"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchApi, getErrorMessage } from '@/lib/api';
import {
  Settings,
  Server,
  Mail,
  Send,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/I18nProvider';
import { sileo } from 'sileo';

interface Workspace { id: string; name: string }
interface EmailSettings {
  provider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  resendApiKey: string;
  fromEmail: string;
  fromName: string;
}

const HOSTINGER_PRESETS = {
  smtpHost: 'smtp.hostinger.com',
  smtpPort: 465,
  smtpSecure: true,
};

const PROVIDER_PRESETS: Record<string, Partial<EmailSettings>> = {
  Hostinger: HOSTINGER_PRESETS,
  Gmail: { smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpSecure: false },
  Outlook: { smtpHost: 'smtp.office365.com', smtpPort: 587, smtpSecure: false },
  Yahoo: { smtpHost: 'smtp.mail.yahoo.com', smtpPort: 587, smtpSecure: false },
  Otro: {},
};

function EmailSettingsContent() {
  const t = useTranslation();
  const searchParams = useSearchParams();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(searchParams.get('workspaceId') ?? '');
  const [provider, setProvider] = useState<'SMTP' | 'RESEND'>('SMTP');
  const [form, setForm] = useState<EmailSettings>({
    provider: 'SMTP',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    resendApiKey: '',
    fromEmail: '',
    fromName: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [preset, setPreset] = useState('Hostinger');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchApi('/workspaces');
        const items = data.items || data.data || data;
        if (Array.isArray(items) && items.length > 0) {
          setWorkspaces(items);
          if (!selectedWorkspace) setSelectedWorkspace(items[0].id);
        }
      } catch {}
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedWorkspace) return;
    async function loadSettings() {
      try {
        const data = await fetchApi(`/email-settings?workspaceId=${selectedWorkspace}`);
        const s = data.data || data;
        if (s) {
          setProvider(s.provider ?? 'SMTP');
          setForm({
            provider: s.provider ?? 'SMTP',
            smtpHost: s.smtpHost ?? '',
            smtpPort: s.smtpPort ?? 587,
            smtpUser: s.smtpUser ?? '',
            smtpPass: s.smtpPass ?? '',
            smtpSecure: s.smtpSecure ?? false,
            resendApiKey: s.resendApiKey ?? '',
            fromEmail: s.fromEmail ?? '',
            fromName: s.fromName ?? '',
          });
        }
      } catch {}
    }
    loadSettings();
  }, [selectedWorkspace]);

  function applyPreset(name: string) {
    setPreset(name);
    const p = PROVIDER_PRESETS[name] ?? {};
    setForm((f) => ({ ...f, ...p }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await fetchApi(`/email-settings?workspaceId=${selectedWorkspace}`, {
        method: 'POST',
        body: JSON.stringify({ ...form, provider }),
      });
      setSaveSuccess(true);
      sileo.success({ title: t.toasts.settingsSaved });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      sileo.error({ title: t.emailSettings.saveError, description: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testEmail) return;
    setTesting(true);
    try {
      const data = await fetchApi(`/email-settings/test?workspaceId=${selectedWorkspace}`, {
        method: 'POST',
        body: JSON.stringify({ to: testEmail }),
      });
      const result = (data.data || data) as { success: boolean; message: string };
      if (result.success) {
        sileo.success({ title: t.toasts.testEmailSent });
      } else {
        sileo.error({ title: t.emailSettings.testFailed, description: result.message });
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err) || t.emailSettings.testFailed;
      sileo.error({ title: t.emailSettings.testFailed, description: message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/emails" className="hover:text-indigo-600 transition-colors">{t.emailSettings.breadcrumb}</Link>
            <span>/</span>
            <span>{t.emailSettings.settings}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            <Settings className="w-6 h-6 text-indigo-600" />
            {t.emailSettings.title}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{t.emailSettings.subtitle}</p>
        </div>
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
        >
          {workspaces.map((ws) => <option key={ws.id} value={ws.id}>{ws.name}</option>)}
        </select>
      </div>

      {/* Provider Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">{t.emailSettings.sendingMethod}</h2>
        <div className="grid grid-cols-2 gap-3">
          {(['SMTP', 'RESEND'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setProvider(p); setForm((f) => ({ ...f, provider: p })); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-semibold ${
                provider === p
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {p === 'SMTP' ? <Server className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
              {p === 'SMTP' ? t.emailSettings.customSmtp : t.emailSettings.resendApi}
              <span className="text-xs font-normal text-center">
                {p === 'SMTP' ? t.emailSettings.smtpProviders : t.emailSettings.resendFreeTier}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* SMTP Config */}
        {provider === 'SMTP' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                {t.emailSettings.smtpConfiguration}
              </h2>

              {/* Quick preset selector */}
              <div className="relative">
                <select
                  value={preset}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  {Object.keys(PROVIDER_PRESETS).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 top-2 pointer-events-none" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{t.emailSettings.hostingerHint}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t.emailSettings.smtpHost}</label>
                <input
                  value={form.smtpHost}
                  onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                  placeholder="smtp.hostinger.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t.emailSettings.port}</label>
                <input
                  type="number"
                  value={form.smtpPort}
                  onChange={(e) => setForm({ ...form, smtpPort: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <div
                    onClick={() => setForm({ ...form, smtpSecure: !form.smtpSecure })}
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${form.smtpSecure ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow m-0.5 transition-transform ${form.smtpSecure ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-600">SSL/TLS</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t.emailSettings.usernameEmail}</label>
                <input
                  value={form.smtpUser}
                  onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                  placeholder="user@yourdomain.com"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t.emailSettings.passwordLabel}</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.smtpPass}
                    onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resend Config */}
        {provider === 'RESEND' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              {t.emailSettings.resendConfiguration}
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {t.emailSettings.resendApiKeyLabel}
              </label>
              <div className="relative">
                <input
                  type={showResendKey ? 'text' : 'password'}
                  value={form.resendApiKey}
                  onChange={(e) => setForm({ ...form, resendApiKey: e.target.value })}
                  placeholder="re_xxxxxxxxxxxxxxxx"
                  autoComplete="off"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowResendKey(!showResendKey)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700"
                >
                  {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">{t.emailSettings.resendApiKeyFieldHint}</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-700">
              {t.emailSettings.resendApiKeyCta} <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="font-bold underline">resend.com</a> {t.emailSettings.resendApiKeyTail}
            </div>
          </div>
        )}

        {/* Default Sender */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            {t.emailSettings.defaultSender}
          </h2>
          <p className="text-xs text-gray-400 -mt-3">{t.emailSettings.defaultSenderHint}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t.emailSettings.fromName}</label>
              <input
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                placeholder={t.emailSettings.fromNamePlaceholder}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{t.emailSettings.fromEmail}</label>
              <input
                type="email"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                placeholder="noreply@yourdomain.com"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
          >
            {saving ? t.common.saving : saveSuccess ? (
              <><CheckCircle className="w-4 h-4" /> {t.emailSettings.saved}</>
            ) : t.emailSettings.saveSettings}
          </button>
        </div>
      </form>

      {/* Test Email */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Send className="w-4 h-4 text-indigo-600" />
          {t.emailSettings.sendTestEmail}
        </h2>
        <p className="text-xs text-gray-400 mb-4">{t.emailSettings.testHint}</p>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
          <button
            onClick={handleTest}
            disabled={testing || !testEmail}
            className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-700 disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
            {testing ? t.emails.sendingShort : t.emailSettings.sendTest}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailSettingsPage() {
  return (
    <Suspense fallback={null}>
      <EmailSettingsContent />
    </Suspense>
  );
}
