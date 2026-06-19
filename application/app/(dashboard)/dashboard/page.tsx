'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_GAMES, MOCK_PUBLISHER_ACTIVITIES } from '@/lib/mock-data';
import MetricCard from '@/components/shared/metric-card';
import StatusBadge from '@/components/shared/status-badge';
import { ArrowRight } from 'lucide-react';

export default function DashboardOverviewPage() {
  const router = useRouter();
  const { displayName, workspaceName } = useAuthStore();
  const pubGames = MOCK_GAMES;
  const totalItems = pubGames.reduce((acc, g) => acc + g.itemCount, 0);
  const publishedCount = pubGames.filter((g) => g.status === 'published').length;
  const recentActivity = MOCK_PUBLISHER_ACTIVITIES.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">{workspaceName}</h1>
        <div className="flex items-center gap-3 mt-1"><StatusBadge status="verified" /><span className="font-sans text-sm text-[#1E2044]/60">Welcome back, {displayName ?? 'Dev'}</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Games" value={pubGames.length} />
        <MetricCard label="Published" value={`${publishedCount}/${pubGames.length}`} />
        <MetricCard label="Total Items" value={totalItems} />
        <MetricCard label="Status" value="Verified" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button onClick={() => router.push('/dashboard/games')} className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all text-left cursor-pointer group">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry flex items-center gap-2">Manage <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span>
          <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mt-1">Games</h3>
          <p className="font-sans text-xs text-[#1E2044]/60 mt-1">{pubGames.length} games, {totalItems} items</p>
        </button>
        <button onClick={() => router.push('/dashboard/analytics')} className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all text-left cursor-pointer group">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry flex items-center gap-2">View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span>
          <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mt-1">Analytics</h3>
          <p className="font-sans text-xs text-[#1E2044]/60 mt-1">Cross-game metrics and activity</p>
        </button>
      </div>

      <div>
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Recent Activity</h2>
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] divide-y-2 divide-dashed divide-[#1E2044]/10">
          {recentActivity.map((event) => (
            <div key={event.id} className="p-4 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blueberry shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-[#1E2044]/80">{event.description}</p>
                <p className="text-[10px] font-mono text-[#1E2044]/40 mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
