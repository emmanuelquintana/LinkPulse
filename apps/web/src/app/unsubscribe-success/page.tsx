"use client";

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';

export default function UnsubscribeSuccessPage() {
  const t = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-9 h-9 text-green-500" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{t.unsubscribe.title}</h1>
        <p className="text-gray-500 mb-8">
          {t.unsubscribe.message}
        </p>
        <Link
          href="/"
          className="inline-block text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
        >
          {t.unsubscribe.backHome}
        </Link>
      </div>
    </div>
  );
}
