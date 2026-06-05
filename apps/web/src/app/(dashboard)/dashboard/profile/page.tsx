"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { useTranslation } from '@/i18n/I18nProvider';

export default function ProfilePage() {
  const t = useTranslation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatarUrl: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

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
      // Update local profile state
      const updatedProfile = { ...profile, ...formData };
      setProfile(updatedProfile);
      
      // Dispatch custom event for sidebar sync
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: updatedProfile }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t.profile.updateError });
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: t.profile.fileTooLarge });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData({ ...formData, avatarUrl: base64String });
    };
    reader.readAsDataURL(file);
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
          ) : (
            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in-95 duration-300">
               <div className="h-20 w-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-6">
                 <span className="material-symbols-outlined text-4xl text-gray-200">construction</span>
               </div>
               <h3 className="text-xl font-black text-gray-900 tracking-tight">
                 {(activeSection === 'security'
                   ? t.profile.security
                   : activeSection === 'notifications'
                     ? t.profile.notifications
                     : t.profile.billing)}{' '}
                 {t.profile.comingSoon}
               </h3>
               <p className="text-sm font-bold text-gray-400 max-w-[300px] mt-2">{t.profile.comingSoonText}</p>
               <button
                onClick={() => setActiveSection('profile')}
                className="mt-8 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
               >
                 {t.profile.goBackProfile}
               </button>
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
