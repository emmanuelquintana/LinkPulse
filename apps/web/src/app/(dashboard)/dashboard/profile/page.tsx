"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { localizeApiError } from "@/lib/api-errors";
import { fileToCompressedAvatar } from '@/lib/image';
import { createClient } from '@/utils/supabase/client';
import { useTranslation } from '@/i18n/I18nProvider';
import { sileo } from 'sileo';
import type { Profile } from '@/types/models';

type PrefKey = 'links' | 'campaigns' | 'team' | 'billing';

interface BillingWorkspace {
  id: string;
  name: string;
  plan?: string;
  ownerUserId?: string;
  stripeCustomerId?: string | null;
  subscription?: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

const DEFAULT_PREFS: Record<PrefKey, boolean> = {
  links: true,
  campaigns: true,
  team: true,
  billing: true,
};

export default function ProfilePage() {
  const t = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Security
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  // Notifications
  const [prefs, setPrefs] = useState<Record<PrefKey, boolean>>(DEFAULT_PREFS);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Billing
  const [billingWorkspaces, setBillingWorkspaces] = useState<BillingWorkspace[]>([]);
  const [portalLoadingId, setPortalLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const result = await fetchApi('/profiles/bootstrap');
        const data = result.data || result;
        setProfile(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          avatarUrl: data.avatarUrl || ''
        });
        setPrefs({ ...DEFAULT_PREFS, ...(data.notificationPrefs ?? {}) });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    async function loadWorkspaces() {
      try {
        const res = await fetchApi('/workspaces');
        const data = res?.data ?? res;
        if (Array.isArray(data)) setBillingWorkspaces(data);
      } catch (err) {
        console.error('Failed to load workspaces for billing summary', err);
      }
    }
    loadProfile();
    loadWorkspaces();
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      sileo.error({ title: t.profile.secPasswordTooShort });
      return;
    }
    if (newPassword !== confirmPassword) {
      sileo.error({ title: t.profile.secPasswordMismatch });
      return;
    }
    setPasswordSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      sileo.success({ title: t.profile.secPasswordUpdated });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      sileo.error({ title: t.profile.secPasswordError, description: localizeApiError(err, t) });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: 'global' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to sign out everywhere', err);
      setSigningOutAll(false);
    }
  };

  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    try {
      await fetchApi('/profiles/notification-prefs', {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      });
      sileo.success({ title: t.profile.notifSaved });
    } catch (err) {
      sileo.error({ title: t.profile.notifSaveError, description: localizeApiError(err, t) });
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleOpenPortal = async (workspaceId: string) => {
    setPortalLoadingId(workspaceId);
    try {
      const res = await fetchApi('/billing/portal', {
        method: 'POST',
        body: JSON.stringify({ workspaceId }),
      });
      const data = res?.data ?? res;
      if (data?.url) window.location.href = data.url;
    } catch (err) {
      sileo.error({ title: t.profile.billPortalError, description: localizeApiError(err, t) });
      setPortalLoadingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await fetchApi('/profiles', {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      setMessage({ type: 'success', text: t.profile.updateSuccess });
      sileo.success({ title: t.toasts.profileSaved });
      // Update local profile state
      const updatedProfile = { ...profile, ...formData };
      setProfile(updatedProfile);

      // Dispatch custom event for sidebar sync
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
    } catch (err: unknown) {
      const text = localizeApiError(err, t) || t.profile.updateError;
      setMessage({ type: 'error', text });
      sileo.error({ title: text });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sanity cap para no intentar decodificar archivos absurdos (no fotos).
    if (file.size > 25 * 1024 * 1024) {
      setMessage({ type: 'error', text: t.profile.fileTooLarge });
      e.target.value = '';
      return;
    }

    try {
      // Comprime/redimensiona en el cliente: cualquier foto queda pequeña y
      // siempre se puede guardar.
      const compressed = await fileToCompressedAvatar(file);
      setFormData((prev) => ({ ...prev, avatarUrl: compressed }));
    } catch (err) {
      console.error('Failed to process image', err);
      setMessage({ type: 'error', text: t.profile.imageError });
    } finally {
      e.target.value = '';
    }
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = () => {
    const first = formData.firstName?.charAt(0) || '';
    const last = formData.lastName?.charAt(0) || '';
    if (first || last) {
      return (first + last).toUpperCase();
    }
    return (profile?.email?.charAt(0) || 'U').toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto font-sans pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.profile.accountSettings}</h2>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{t.profile.manageIdentity}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveSection('profile')}
              className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeSection === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              {t.profile.generalProfile}
            </button>
            <button 
              onClick={() => setActiveSection('security')}
              className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeSection === 'security' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className="material-symbols-outlined text-[20px]">lock</span>
              {t.profile.security}
            </button>
            <button 
              onClick={() => setActiveSection('notifications')}
              className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeSection === 'notifications' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {t.profile.notifications}
            </button>
            <button 
              onClick={() => setActiveSection('billing')}
              className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeSection === 'billing' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <span className="material-symbols-outlined text-[20px]">credit_card</span>
              {t.profile.billing}
            </button>
          </nav>
        </div>

        {/* Main Content Form */}
        <div className="lg:col-span-2 space-y-6">
          {activeSection === 'profile' ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-8 border-b border-gray-50 flex items-center gap-6">
                 <div className="relative group">
                   <div className="h-20 w-20 rounded-3xl bg-indigo-50 border-2 border-white shadow-md flex items-center justify-center text-indigo-600 text-3xl font-black overflow-hidden">
                      {formData.avatarUrl ? (
                         <img src={formData.avatarUrl.startsWith('data:') ? formData.avatarUrl : formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                         getInitials()
                      )}
                   </div>
                   <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                   />
                   <button 
                    onClick={triggerFileInput}
                    className="absolute -bottom-1 -right-1 h-8 w-8 bg-white border border-gray-100 rounded-xl shadow-lg flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                   >
                     <span className="material-symbols-outlined text-[18px]">edit</span>
                   </button>
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.profile.profilePicture}</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{t.profile.pictureHint}</p>
                    <button
                      onClick={triggerFileInput}
                      className="text-sm font-black text-indigo-600 hover:text-indigo-700 mt-2 flex items-center gap-1 group"
                    >
                      {t.profile.updatePhoto}
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_right_alt</span>
                    </button>
                 </div>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-8">
                {message && (
                  <div className={`p-5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50 shadow-sm shadow-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100/50 shadow-sm shadow-rose-100'}`}>
                    <span className="material-symbols-outlined text-[20px]">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block px-1">{t.profile.firstName}</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={t.profile.firstNamePlaceholder}
                      className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-[1.2rem] text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block px-1">{t.profile.lastName}</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={t.profile.lastNamePlaceholder}
                      className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-[1.2rem] text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">{t.profile.emailAddress}</label>
                    <span className="text-[0.65rem] font-black text-indigo-500 uppercase bg-indigo-50 px-2 py-0.5 rounded-lg">{t.profile.verified}</span>
                  </div>
                  <div className="relative">
                    <input 
                      type="email" 
                      disabled
                      value={profile?.email || ''}
                      className="w-full h-14 px-6 bg-gray-100/50 border border-gray-100 rounded-[1.2rem] text-sm font-bold text-gray-400 cursor-not-allowed"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300">lock</span>
                  </div>
                  <p className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-widest px-1">{t.profile.changeEmailPrefix} <span className="text-indigo-600 hover:underline cursor-pointer">{t.profile.contactSupport}</span>.</p>
                </div>

                <div className="pt-8 border-t border-gray-50 mt-10 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="h-14 px-10 bg-indigo-600 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-indigo-100 flex items-center gap-3"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t.common.saving}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        {t.profile.saveSettings}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : activeSection === 'security' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Cambiar contraseña */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.profile.secPasswordTitle}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 mb-8">{t.profile.secPasswordHint}</p>
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block px-1">{t.profile.secNewPassword}</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          className="w-full h-14 px-6 pr-12 bg-gray-50 border border-gray-100 rounded-[1.2rem] text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                        >
                          <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest block px-1">{t.profile.secConfirmPassword}</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full h-14 px-6 bg-gray-50 border border-gray-100 rounded-[1.2rem] text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-gray-50">
                    <button
                      type="submit"
                      disabled={passwordSaving || !newPassword || !confirmPassword}
                      className="h-12 px-8 bg-indigo-600 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center gap-2"
                    >
                      {passwordSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                      )}
                      {t.profile.secUpdatePassword}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sesiones */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.profile.secSessionsTitle}</h3>
                <p className="text-sm font-medium text-gray-500 mt-2 max-w-md">{t.profile.secSessionsText}</p>
                <button
                  onClick={handleSignOutAll}
                  disabled={signingOutAll}
                  className="mt-6 h-12 px-6 bg-gray-900 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {signingOutAll ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                  )}
                  {t.profile.secSignOutAll}
                </button>
              </div>
            </div>
          ) : activeSection === 'notifications' ? (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.profile.notifPrefsTitle}</h3>
              <p className="text-sm font-medium text-gray-500 mt-2 mb-8">{t.profile.notifPrefsText}</p>

              <div className="space-y-3">
                {(
                  [
                    { key: 'links', icon: 'link', label: t.profile.notifLinks, desc: t.profile.notifLinksDesc },
                    { key: 'campaigns', icon: 'campaign', label: t.profile.notifCampaigns, desc: t.profile.notifCampaignsDesc },
                    { key: 'team', icon: 'group', label: t.profile.notifTeam, desc: t.profile.notifTeamDesc },
                    { key: 'billing', icon: 'payments', label: t.profile.notifBilling, desc: t.profile.notifBillingDesc },
                  ] as Array<{ key: PrefKey; icon: string; label: string; desc: string }>
                ).map((row) => (
                  <label
                    key={row.key}
                    className="flex items-center justify-between gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 cursor-pointer hover:bg-gray-100/70 transition-colors"
                  >
                    <span className="flex items-center gap-4 min-w-0">
                      <span className="h-10 w-10 rounded-xl bg-white border border-gray-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[20px]">{row.icon}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-black text-gray-900">{row.label}</span>
                        <span className="block text-xs font-medium text-gray-400 truncate">{row.desc}</span>
                      </span>
                    </span>
                    {/* Toggle */}
                    <span
                      onClick={(e) => {
                        e.preventDefault();
                        setPrefs((p) => ({ ...p, [row.key]: !p[row.key] }));
                      }}
                      className={`relative h-7 w-12 rounded-full transition-colors shrink-0 ${prefs[row.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${prefs[row.key] ? 'left-6' : 'left-1'}`}
                      />
                    </span>
                  </label>
                ))}
              </div>

              <p className="flex items-center gap-2 text-xs font-medium text-gray-400 mt-6">
                <span className="material-symbols-outlined text-[16px]">info</span>
                {t.profile.notifSystemNote}
              </p>

              <div className="flex justify-end pt-6 border-t border-gray-50 mt-6">
                <button
                  onClick={handleSavePrefs}
                  disabled={prefsSaving}
                  className="h-12 px-8 bg-indigo-600 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                  {prefsSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">save</span>
                  )}
                  {t.profile.notifSave}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.profile.billSummaryTitle}</h3>
              <p className="text-sm font-medium text-gray-500 mt-2 mb-8">{t.profile.billSummaryText}</p>

              <div className="space-y-4">
                {billingWorkspaces.map((ws) => {
                  const sub = ws.subscription;
                  const isActive = sub?.status === 'active' || sub?.status === 'trialing';
                  return (
                    <div
                      key={ws.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-gray-100 rounded-2xl px-5 py-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-11 w-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black shrink-0">
                          {ws.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-gray-900 truncate">{ws.name}</p>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0 ${ws.plan === 'PRO' ? 'bg-indigo-600 text-white' : ws.plan === 'ENTERPRISE' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}>
                              {ws.plan}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">
                            {isActive && sub ? (
                              <>
                                <span className="text-emerald-600">{t.profile.billActive}</span>
                                {' · '}
                                {sub.cancelAtPeriodEnd ? t.profile.billCancelsAt : t.profile.billRenews}{' '}
                                {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                              </>
                            ) : (
                              t.profile.billNoSub
                            )}
                          </p>
                        </div>
                      </div>
                      {ws.stripeCustomerId && ws.ownerUserId === profile?.id && (
                        <button
                          onClick={() => handleOpenPortal(ws.id)}
                          disabled={portalLoadingId === ws.id}
                          className="h-10 px-5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                        >
                          {portalLoadingId === ws.id ? (
                            <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[16px]">payments</span>
                          )}
                          {t.profile.billManage}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-50 mt-6">
                <Link
                  href="/dashboard/billing"
                  className="h-12 px-8 bg-gray-900 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  {t.profile.billGoTo}
                </Link>
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="bg-rose-50 rounded-[2rem] border border-rose-100 p-10 mt-12 group hover:border-rose-200 transition-all">
               <div className="flex items-start justify-between">
                 <div>
                   <h3 className="text-xl font-black text-rose-900 tracking-tight">{t.profile.dangerZone}</h3>
                   <p className="text-sm text-rose-700 mt-2 font-bold max-w-sm">{t.profile.dangerText}</p>
                 </div>
                 <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <span className="material-symbols-outlined">warning</span>
                 </div>
               </div>
               <button className="mt-8 h-12 px-6 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-rose-200">
                  {t.profile.deleteAccount}
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
