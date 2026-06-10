"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { localizeApiError } from '@/lib/api-errors';
import { useTranslation } from '@/i18n/I18nProvider';

export default function ForgotPasswordPage() {
  const t = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/update-password`,
      });

      if (error) {
        throw error;
      }

      setMessage(t.auth.resetSent);
    } catch (err: unknown) {
      setError(localizeApiError(err, t) || t.auth.resetError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans w-full">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/login" className="flex justify-center items-center gap-2 text-indigo-600 font-bold text-3xl mb-6">
          <span className="material-symbols-outlined text-4xl">link</span>
          LinkPulse
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t.auth.resetTitle}</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t.auth.resetSubtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}
            {message && (
              <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{message}</div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t.auth.emailAddress}</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? t.auth.sendingReset : t.auth.sendResetLink}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            {t.auth.rememberedPassword}{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">{t.auth.signIn}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
