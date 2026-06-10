"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { fetchApi } from '@/lib/api';
import { localizeApiError } from "@/lib/api-errors";
import { useSearchParams } from 'next/navigation';
import { useTranslation } from '@/i18n/I18nProvider';
import { sileo } from 'sileo';
import type { WorkspaceSummary } from '@/types/models';

function BillingContent() {
  const t = useTranslation();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const result = await fetchApi('/workspaces');
        const data = result.data || result;
        setWorkspaces(data);
        if (data.length > 0) {
          setSelectedWorkspaceId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspaces", err);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspaces();
  }, []);

  const handleUpgrade = async (plan: 'PRO' | 'ENTERPRISE') => {
    if (!selectedWorkspaceId) return;
    setProcessing(true);
    try {
      const priceId = plan === 'ENTERPRISE'
        ? process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;

      if (!priceId) {
        throw new Error(t.billing.stripeNotConfigured);
      }

      const response = await fetchApi('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          priceId: priceId
        })
      });
      
      const data = response.data || response;
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to start checkout", err);
      sileo.error({ title: t.billing.checkoutError, description: localizeApiError(err, t) });
    } finally {
      setProcessing(false);
    }
  };

  const handleManage = async () => {
    if (!selectedWorkspaceId) return;
    setProcessing(true);
    try {
      const response = await fetchApi('/billing/portal', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId
        })
      });
      
      const data = response.data || response;
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to open portal", err);
      sileo.error({ title: t.billing.portalError, description: localizeApiError(err, t) });
    } finally {
      setProcessing(false);
    }
  };

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);
  const isPro = selectedWorkspace?.plan === 'PRO';
  const isEnterprise = selectedWorkspace?.plan === 'ENTERPRISE';
  const isFree = !isPro && !isEnterprise;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto font-sans pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.billing.title}</h2>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{t.billing.subtitle}</p>
      </div>

      {success && (
        <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="h-12 w-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">{t.billing.upgradeSuccess}</h4>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">{t.billing.upgradeSuccessText}</p>
          </div>
        </div>
      )}

      {canceled && (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="h-12 w-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100">
            <span className="material-symbols-outlined">cancel</span>
          </div>
          <div>
            <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest">{t.billing.checkoutCanceled}</h4>
            <p className="text-xs font-bold text-rose-600 mt-0.5">{t.billing.checkoutCanceledText}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Workspace Selection */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">{t.billing.selectWorkspace}</h3>
            <div className="space-y-3">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => setSelectedWorkspaceId(ws.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedWorkspaceId === ws.id ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' : 'bg-gray-50 border-gray-50 text-gray-500 hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                     <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs ${selectedWorkspaceId === ws.id ? 'bg-white text-indigo-600' : 'bg-white text-gray-400'}`}>
                        {ws.name.charAt(0).toUpperCase()}
                     </div>
                     <span className="text-sm font-black truncate">{ws.name}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0 ml-3 ${ws.plan === 'PRO' ? 'bg-indigo-600 text-white' : ws.plan === 'ENTERPRISE' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {ws.plan}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100 overflow-hidden relative group">
             <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
             <h3 className="text-xl font-black tracking-tight relative z-10">{t.billing.needMore}</h3>
             <p className="text-xs font-bold text-indigo-100 mt-2 relative z-10 uppercase tracking-widest leading-relaxed">{t.billing.needMoreText}</p>
             <button className="mt-6 bg-white text-indigo-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all relative z-10">
               {t.billing.contactSales}
             </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FREE PLAN */}
          <div className={`bg-white rounded-[2rem] border p-10 flex flex-col justify-between transition-all ${isFree ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xl' : 'border-gray-100 shadow-sm opacity-80'}`}>
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full whitespace-nowrap">{t.billing.freeTier}</span>
                {isFree && <span className="material-symbols-outlined text-indigo-600">check_circle</span>}
              </div>
              <h4 className="text-4xl font-black text-gray-900">$0<span className="text-sm font-bold text-gray-400">{t.billing.perMonth}</span></h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-6 mb-8">{t.billing.perfectHobbyists}</p>

              <ul className="space-y-4">
                {t.billing.freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <span className="material-symbols-outlined text-emerald-500 text-[18px]">done</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              disabled={isFree}
              className={`mt-10 h-14 w-full rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all ${isFree ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black'}`}
            >
              {isFree ? t.billing.currentPlan : t.billing.downgrade}
            </button>
          </div>

          {/* PRO PLAN */}
          <div className={`bg-white rounded-[2rem] border p-10 flex flex-col justify-between transition-all relative overflow-hidden ${isPro ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xl' : 'border-gray-100 shadow-sm hover:border-indigo-200'}`}>
            {isPro && (
              <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg">{t.billing.active}</div>
            )}
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full whitespace-nowrap">{t.billing.proPlan}</span>
                <span className="material-symbols-outlined text-indigo-400">workspace_premium</span>
              </div>
              <h4 className="text-4xl font-black text-gray-900">$19<span className="text-sm font-bold text-gray-400">{t.billing.perMonth}</span></h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-6 mb-8">{t.billing.seriousMarketers}</p>

              <ul className="space-y-4">
                {t.billing.proFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <span className="material-symbols-outlined text-indigo-500 text-[18px]">done_all</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {isPro ? (
              <button
                onClick={handleManage}
                disabled={processing}
                className="mt-10 h-14 w-full px-4 bg-indigo-50 text-indigo-600 rounded-[1.2rem] text-xs font-black uppercase tracking-wider hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 shadow-sm border border-indigo-100"
              >
                {processing ? <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[18px] shrink-0">payments</span> <span className="leading-tight">{t.billing.manageSubscription}</span></>}
              </button>
            ) : isEnterprise ? (
              <button
                disabled
                className="mt-10 h-14 w-full bg-gray-100 text-gray-400 rounded-[1.2rem] text-xs font-black uppercase tracking-widest cursor-not-allowed"
              >
                {t.billing.includedInEnterprise}
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade('PRO')}
                disabled={processing}
                className="mt-10 h-14 w-full px-4 bg-indigo-600 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-wider hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100"
              >
                {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[18px] shrink-0">bolt</span> <span className="leading-tight">{t.billing.upgradeNow}</span></>}
              </button>
            )}
          </div>

          {/* ENTERPRISE PLAN (precio por empresa: workspaces ilimitados) */}
          <div className={`bg-white rounded-[2rem] border p-10 flex flex-col justify-between transition-all relative overflow-hidden ${isEnterprise ? 'border-gray-900 ring-4 ring-gray-100 shadow-xl' : 'border-gray-100 shadow-sm hover:border-gray-300'}`}>
            {isEnterprise && (
              <div className="absolute top-4 right-4 bg-gray-900 text-white text-[10px] font-black uppercase px-3 py-1 rounded-lg">{t.billing.active}</div>
            )}
            <div>
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-black text-gray-900 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">{t.billing.enterprisePlan}</span>
                <span className="material-symbols-outlined text-gray-700">apartment</span>
              </div>
              <h4 className="text-4xl font-black text-gray-900 whitespace-nowrap">$49<span className="text-sm font-bold text-gray-400">{t.billing.perCompany}</span></h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-6 mb-8">{t.billing.forCompanies}</p>

              <ul className="space-y-4">
                {t.billing.enterpriseFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <span className="material-symbols-outlined text-gray-900 text-[18px]">done_all</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {isEnterprise ? (
              <button
                onClick={handleManage}
                disabled={processing}
                className="mt-10 h-14 w-full px-4 bg-gray-100 text-gray-900 rounded-[1.2rem] text-xs font-black uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-sm border border-gray-200"
              >
                {processing ? <div className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[18px] shrink-0">payments</span> <span className="leading-tight">{t.billing.manageSubscription}</span></>}
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade('ENTERPRISE')}
                disabled={processing}
                className="mt-10 h-14 w-full px-4 bg-gray-900 text-white rounded-[1.2rem] text-xs font-black uppercase tracking-wider hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200"
              >
                {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span className="material-symbols-outlined text-[18px] shrink-0">rocket_launch</span> <span className="leading-tight">{t.billing.upgradeNow}</span></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BillingContent />
        </Suspense>
    );
}
