"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/i18n/I18nProvider';

export default function LandingPage() {
  const t = useTranslation();
  return (
    <div className="min-h-screen bg-white font-sans">
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <span className="material-symbols-outlined">link</span>
              LinkPulse
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">{t.landing.features}</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">{t.landing.pricing}</a>
              <a href="#api" className="text-gray-600 hover:text-gray-900 font-medium">{t.landing.api}</a>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">{t.landing.login}</Link>
              <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                {t.landing.getStarted}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
            {t.landing.heroTitle1}<br/>
            <span className="text-indigo-600">{t.landing.heroTitle2}</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            {t.landing.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link href="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              {t.landing.startFree}
            </Link>
            <button className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">play_circle</span>
              {t.landing.watchDemo}
            </button>
          </div>

          {/* Quick Shortener Demo */}
          <div className="max-w-3xl mx-auto bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 px-4">
              <span className="material-symbols-outlined text-gray-400">link</span>
              <input
                type="text"
                placeholder={t.landing.pastePlaceholder}
                className="w-full py-3 outline-none text-gray-700 text-lg"
              />
            </div>
            <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap">
              {t.landing.shorten}
            </button>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="bg-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.landing.featuresTitle}</h2>
              <p className="text-lg text-gray-500">{t.landing.featuresSubtitle}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">analytics</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.landing.feature1Title}</h3>
                <p className="text-gray-500">{t.landing.feature1Desc}</p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">campaign</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.landing.feature2Title}</h3>
                <p className="text-gray-500">{t.landing.feature2Desc}</p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined">api</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t.landing.feature3Title}</h3>
                <p className="text-gray-500">{t.landing.feature3Desc}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <span className="material-symbols-outlined">link</span>
              LinkPulse
            </div>
            <p className="text-sm">{t.landing.footerTagline}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{t.landing.product}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">{t.landing.features}</a></li>
              <li><a href="#" className="hover:text-white">{t.landing.pricing}</a></li>
              <li><a href="#" className="hover:text-white">{t.landing.apiDocs}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{t.landing.company}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">{t.landing.about}</a></li>
              <li><a href="#" className="hover:text-white">{t.landing.blog}</a></li>
              <li><a href="#" className="hover:text-white">{t.landing.careers}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">{t.landing.legal}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">{t.landing.privacy}</a></li>
              <li><a href="#" className="hover:text-white">{t.landing.terms}</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
