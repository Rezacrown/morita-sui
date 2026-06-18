'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_PUBLISHERS, MOCK_GAMES, MOCK_ITEMS, MOCK_PUBLISHER_ACTIVITIES } from '@/lib/mock-data';
import MetricCard from '@/components/shared/metric-card';
import EmptyState from '@/components/shared/empty-state';
import StatusBadge from '@/components/shared/status-badge';

export default function DashboardHomePage() {
  const router = useRouter();
  const { displayName, activePublisherId, setActivePublisher } = useAuthStore();

  if (!activePublisherId) {
    return <EmptyState title="No Publishers Yet" description="Create your first publisher to start managing games and items." />;
  }

  const activePub = MOCK_PUBLISHERS.find((p) => p.id === activePublisherId);
  const pubGames = MOCK_GAMES.filter((g) => g.publisherId === activePublisherId);
  const totalItems = MOCK_ITEMS.filter((i) => pubGames.some((g) => g.id === i.gameId)).length;
  const publishedCount = pubGames.filter((g) => g.status === 'published').length;
  const recentActivity = MOCK_PUBLISHER_ACTIVITIES.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Welcome back, {displayName ?? 'Dev'}</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Manage your publishers, games, and cross-game items</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Games" value={pubGames.length} />
        <MetricCard label="Published" value={`${publishedCount}/${pubGames.length}`} />
        <MetricCard label="Total Items" value={totalItems} />
        <MetricCard label="Verification" value={activePub?.isVerified ? 'Verified' : 'Pending'} />
      </div>
      <div className="mb-8">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Your Publishers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_PUBLISHERS.map((pub) => (
            <div key={pub.id} className="bg-white border-3 border-[#1E2044] rounded-2xl p-5 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all cursor-pointer" onClick={() => { setActivePublisher(pub.id); router.push(`/dashboard/${pub.id}/games`); }}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-black text-base uppercase tracking-tight text-[#1E2044]">{pub.name}</h3>
                <StatusBadge status={pub.isVerified ? 'verified' : 'draft'} />
              </div>
              <div className="flex gap-4">
                <div><span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Games</span><span className="block font-display font-bold text-lg text-[#1E2044]">{pub.gameCount}</span></div>
                <div><span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</span><span className="block font-mono text-xs text-[#1E2044]/60">{new Date(pub.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
          ))}
        </div>
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
