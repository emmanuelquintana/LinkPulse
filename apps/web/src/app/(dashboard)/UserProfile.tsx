"use client";

import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useTranslation } from '@/i18n/I18nProvider';
import type { Profile } from '@/types/models';

export function UserProfile() {
  const t = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      try {
        const result = await fetchApi('/profiles/bootstrap');
        setProfile(result.data || result);
      } catch (err) {
        console.error("Failed to load profile in sidebar", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<Profile>).detail;
      if (detail) {
        setProfile(detail);
      }
    };

    window.addEventListener('profile-updated', handleUpdate);
    return () => window.removeEventListener('profile-updated', handleUpdate);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Failed to sign out', err);
    }
  };

  const getDisplayName = () => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return profile?.email || t.userProfile.user;
  };

  const getInitials = () => {
    const first = profile?.firstName?.charAt(0) || '';
    const last = profile?.lastName?.charAt(0) || '';
    if (first || last) {
      return (first + last).toUpperCase();
    }
    return (profile?.email?.charAt(0) || 'U').toUpperCase();
  };

  return (
    <div className="relative border-t border-gray-200 p-4" ref={menuRef}>
      {/* Dropdown Menu (Pops up) */}
      {menuOpen && (
        <div className="absolute bottom-16 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Link
            href="/dashboard/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors no-underline"
          >
            <span className="material-symbols-outlined text-gray-400 text-lg">person</span>
            {t.userProfile.viewProfile}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium border-none bg-transparent cursor-pointer"
          >
            <span className="material-symbols-outlined text-red-400 text-lg">logout</span>
            {t.userProfile.signOut}
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div 
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-3 hover:bg-gray-50 cursor-pointer p-2 -mx-2 rounded-lg transition-colors select-none"
      >
        <div className="h-9 w-9 border border-indigo-100 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 shrink-0 text-sm overflow-hidden">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            getInitials()
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 leading-tight truncate">
            {loading ? t.common.loading : getDisplayName()}
          </span>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">{t.userProfile.proPlan}</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="p-1 hover:bg-gray-100 rounded-md flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600 border-none bg-transparent cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">more_vert</span>
        </button>
      </div>
    </div>
  );
}

