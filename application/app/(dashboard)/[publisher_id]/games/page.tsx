'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_GAMES } from '@/lib/mock-data';
import StatusBadge from '@/components/shared/status-badge';
import EmptyState from '@/components/shared/empty-state';

export default function GamesManagerPage() {
  const params = useParams();
  const router = useRouter();
  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const games = MOCK_GAMES.filter((g) => g.publisherId === publisherId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Games</h1>
          <p className="font-sans text-sm text-[#1E2044]/60 mt-1">{games.length} game{games.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => console.log('Create game')} className="px-5 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Create Game</button>
      </div>
      {games.length === 0 ? (
        <EmptyState title="No Games Yet" description="Create your first game to start designing cross-game items." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-white border-3 border-[#1E2044] rounded-2xl p-5 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all">
              <div className="w-full h-40 bg-blueberry-cream/50 rounded-xl border-2 border-[#1E2044]/20 mb-4 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="4" y="4" width="40" height="40" rx="8" stroke="#1E2044" strokeWidth="2.5" strokeDasharray="5 4" /><path d="M16 24L20 18L22 22L26 14L30 20" stroke="#5A60D3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <StatusBadge status={game.status} className="mb-2" />
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-1">{game.name}</h3>
              <p className="font-sans text-xs text-[#1E2044]/50 mb-3 leading-relaxed line-clamp-2">{game.description}</p>
              <div className="flex items-center justify-between mb-4">
                <div><span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Items</span><span className="block font-mono text-sm font-bold text-[#1E2044]">{game.status === 'published' ? game.publishedItemCount : game.draftItemCount}{game.status === 'draft' && <span className="text-[#1E2044]/40 text-xs"> (draft)</span>}</span></div>
                <div className="text-right"><span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</span><span className="block font-mono text-xs text-[#1E2044]/60">{new Date(game.createdAt).toLocaleDateString()}</span></div>
              </div>
              <button onClick={() => router.push(`/dashboard/${publisherId}/games/${game.id}`)} className={`w-full px-4 py-2.5 font-display font-black rounded-lg text-xs uppercase transition-all cursor-pointer ${game.status === 'draft' ? 'bg-blueberry text-white border-2 border-[#1E2044] shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5' : 'bg-white text-[#1E2044] border-2 border-[#1E2044] hover:bg-blueberry-cream'}`}>
                {game.status === 'draft' ? 'Continue Editing' : 'View Game'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
