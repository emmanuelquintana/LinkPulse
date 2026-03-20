"use client";

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import Link from 'next/link';

export function UserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

    const handleUpdate = (event: any) => {
      if (event.detail) {
        setProfile(event.detail);
      }
    };

    window.addEventListener('profile-updated', handleUpdate);
    return () => window.removeEventListener('profile-updated', handleUpdate);
  }, []);

  const getDisplayName = () => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return profile?.email || 'User';
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
    <Link href="/dashboard/profile" className="p-4 border-t border-gray-200 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors no-underline">
       <div className="h-9 w-9 border border-indigo-100 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 shrink-0 text-sm overflow-hidden">
         {profile?.avatarUrl ? (
           <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
         ) : (
           getInitials()
         )}
       </div>
       <div className="flex flex-col flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 leading-tight truncate">
            {loading ? 'Loading...' : getDisplayName()}
          </span>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Pro Plan</span>
       </div>
       <span className="material-symbols-outlined text-gray-400">more_vert</span>
    </Link>
  );
}
