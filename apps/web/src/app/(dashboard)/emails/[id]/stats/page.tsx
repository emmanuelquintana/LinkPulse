"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import {
  BarChart2,
  MousePointer2,
  AlertTriangle,
  UserMinus,
  Mail,
  TrendingUp,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Link2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  campaign: {
    id: string;
    subject: string;
    status: string;
    sentAt: string | null;
  };
  summary: {
    total: number;
    delivered: number;
    bounced: number;
    spam: number;
    uniqueOpens: number;
    uniqueClicks: number;
    unsubscribed: number;
  };
  rates: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    unsubscribeRate: number;
  };
  deviceBreakdown: { name: string; count: number }[];
  osBreakdown: { name: string; count: number }[];
  topLinks: { url: string; count: number }[];
  timeline: { date: string; opens: number; clicks: number }[];
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  DESKTOP: <Monitor className="w-4 h-4" />,
  MOBILE: <Smartphone className="w-4 h-4" />,
  TABLET: <Tablet className="w-4 h-4" />,
  UNKNOWN: <Globe className="w-4 h-4" />,
};

function MetricCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-extrabold text-gray-900">{value}</p>
          {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function DonutChart({ data, colors }: { data: { name: string; count: number }[]; colors: string[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-gray-400 text-sm text-center py-8">No data yet</p>;

  let cumulative = 0;
  const radius = 60;
  const cx = 80;
  const cy = 80;

  const slices = data.map((item, i) => {
    const pct = item.count / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = pct > 0.5 ? 1 : 0;

    return (
      <path
        key={item.name}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={colors[i % colors.length]}
        opacity={0.85}
      />
    );
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {slices}
        <circle cx={cx} cy={cy} r={38} fill="white" />
      </svg>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-gray-600 font-medium">{item.name}</span>
            <span className="text-gray-400">({((item.count / total) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CampaignStatsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const campaignId = params.id as string;
  const workspaceId = searchParams.get('workspaceId') ?? '';

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!campaignId || !workspaceId) return;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchApi(`/email-campaigns/${campaignId}/stats?workspaceId=${workspaceId}`);
        setStats(data.data || data);
      } catch (err: any) {
        setError(err.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campaignId, workspaceId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="h-8 w-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-6xl mx-auto text-center py-16">
        <p className="text-red-500 font-semibold">{error || 'No data found'}</p>
        <Link href="/emails" className="text-indigo-600 text-sm mt-4 inline-block">← Back to campaigns</Link>
      </div>
    );
  }

  const deviceColors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <Link href="/emails" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-indigo-600 mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to campaigns
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-indigo-600" />
          {stats.campaign.subject}
        </h1>
        {stats.campaign.sentAt && (
          <p className="text-gray-400 text-sm mt-1">
            Sent {new Date(stats.campaign.sentAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Open Rate"
          value={`${stats.rates.openRate}%`}
          sub={`${stats.summary.uniqueOpens} unique opens`}
          icon={<Mail className="w-5 h-5 text-indigo-600" />}
          color="bg-indigo-50"
        />
        <MetricCard
          label="Click Rate"
          value={`${stats.rates.clickRate}%`}
          sub={`${stats.summary.uniqueClicks} unique clicks`}
          icon={<MousePointer2 className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-50"
        />
        <MetricCard
          label="Bounce Rate"
          value={`${stats.rates.bounceRate}%`}
          sub={`${stats.summary.bounced} bounced`}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          color="bg-amber-50"
        />
        <MetricCard
          label="Unsubscribe Rate"
          value={`${stats.rates.unsubscribeRate}%`}
          sub={`${stats.summary.unsubscribed} unsubscribed`}
          icon={<UserMinus className="w-5 h-5 text-rose-600" />}
          color="bg-rose-50"
        />
      </div>

      {/* Summary Row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
        {[
          { label: 'Total Sent', value: stats.summary.total },
          { label: 'Delivered', value: stats.summary.delivered },
          { label: 'Opened', value: stats.summary.uniqueOpens },
          { label: 'Clicked', value: stats.summary.uniqueClicks },
          { label: 'Bounced', value: stats.summary.bounced },
          { label: 'Spam', value: stats.summary.spam },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Device Breakdown
          </h3>
          {stats.deviceBreakdown.length > 0 ? (
            <DonutChart data={stats.deviceBreakdown} colors={deviceColors} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No opens recorded yet</p>
          )}
        </div>

        {/* OS Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            Operating Systems
          </h3>
          {stats.osBreakdown.length > 0 ? (
            <DonutChart data={stats.osBreakdown} colors={['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe']} />
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">No data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            Activity Timeline
          </h3>
          {stats.timeline.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No activity recorded yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.timeline.map((day) => {
                const maxVal = Math.max(...stats.timeline.map((d) => Math.max(d.opens, d.clicks)), 1);
                return (
                  <div key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 text-xs w-20 shrink-0">{day.date}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-indigo-500 w-12">Opens</span>
                        <div className="flex-1 bg-indigo-50 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full transition-all"
                            style={{ width: `${(day.opens / maxVal) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right">{day.opens}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-emerald-500 w-12">Clicks</span>
                        <div className="flex-1 bg-emerald-50 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${(day.clicks / maxVal) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right">{day.clicks}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Links */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-600" />
            Top Clicked Links
          </h3>
          {stats.topLinks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No clicks recorded yet</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.topLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-indigo-500 w-5 shrink-0">#{i + 1}</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-gray-700 hover:text-indigo-600 truncate transition-colors"
                  >
                    {link.url}
                  </a>
                  <span className="text-xs font-bold text-gray-500 shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">
                    {link.count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
