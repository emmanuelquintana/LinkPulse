"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useTranslation } from '@/i18n/I18nProvider';

export default function RegisterPage() {
  const router = useRouter();
  const t = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  // Pre-rellena el email cuando se llega desde un link de invitación.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invitedEmail = params.get('email');
    if (invitedEmail) setEmail(invitedEmail);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Si Supabase no devuelve sesión, el correo requiere confirmación.
    if (!data.session) {
      setConfirmationSent(true);
      setLoading(false);
      return;
    }

    // Confirmación desactivada: queda logueado directamente.
    router.push('/dashboard');
    router.refresh();
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans w-full">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex justify-center items-center gap-2 text-indigo-600 font-bold text-3xl mb-6">
            <span className="material-symbols-outlined text-4xl">link</span>
            LinkPulse
          </Link>
        </div>
        <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-8 shadow sm:rounded-2xl border border-gray-100 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">mark_email_unread</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">{t.auth.confirmEmailTitle}</h2>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              {t.auth.confirmEmailText}{' '}
              <span className="font-bold text-gray-900 break-all">{email}</span>
            </p>
            <p className="mt-2 text-xs text-gray-400">{t.auth.confirmEmailHint}</p>
            <Link
              href="/login"
              className="mt-8 inline-flex w-full justify-center py-2.5 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              {t.auth.goToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans w-full">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 text-indigo-600 font-bold text-3xl mb-6">
          <span className="material-symbols-outlined text-4xl">link</span>
          LinkPulse
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {t.auth.createAccountTitle}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t.auth.alreadyHaveAccount}{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            {t.auth.signIn}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {t.auth.fullName}
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t.auth.emailAddress}
              </label>
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {t.auth.password}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-900">
                  {t.auth.iAgree}{' '}
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    {t.auth.termsWord}
                  </a>{' '}
                  {t.auth.and}{' '}
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    {t.auth.privacyPolicy}
                  </a>
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? t.auth.signingUp : t.auth.signUp}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
