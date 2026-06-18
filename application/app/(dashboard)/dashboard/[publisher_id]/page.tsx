'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { MOCK_PUBLISHERS, MOCK_GAMES, MOCK_ITEMS } from '@/lib/mock-data';
import MetricCard from '@/components/shared/metric-card';
import StatusBadge from '@/components/shared/status-badge';
import EmptyState from '@/components/shared/empty-state';

export default function PublisherWorkspacePage() {
  const router = useRouter();
  const { activePublisherId, displayName } = useAuthStore();
  const pub = MOCK_PUBLISHERS.find((p) => p.id === activePublisherId);
  const games = MOCK_GAMES.filter((g) => g.publisherId === activePublisherId);
  const totalItems = MOCK_ITEMS.filter((i) => games.some((g) => g.id === i.gameId)).length;
  const publishedGames = games.filter((g) => g.status === 'published').length;

  if (!pub) {
    return <EmptyState title="Publisher Not Found" description="Select or create a publisher to get started." />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">{pub.name}</h1>
        <div className="flex items-center gap-3 mt-2"><StatusBadge status={pub.isVerified ? 'verified' : 'draft'} /><span className="font-sans text-sm text-[#1E2044]/60">Welcome back, {displayName ?? 'Dev'}</span></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Games" value={games.length} />
        <MetricCard label="Published" value={`${publishedGames}/${games.length}`} />
        <MetricCard label="Total Items" value={totalItems} />
        <MetricCard label="Created" value={new Date(pub.createdAt).toLocaleDateString()} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => router.push(`/dashboard/${pub.id}/games`)} className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all text-left cursor-pointer">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry">Manage</span>
          <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mt-1">Games</h3>
          <p className="font-sans text-xs text-[#1E2044]/60 mt-1">{games.length} games, {totalItems} items</p>
        </button>
        <button onClick={() => router.push(`/dashboard/${pub.id}/analytics`)} className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all text-left cursor-pointer">
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry">View</span>
          <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mt-1">Analytics</h3>
          <p className="font-sans text-xs text-[#1E2044]/60 mt-1">Cross-game metrics and activity</p>
        </button>
      </div>
    </div>
  );
}
