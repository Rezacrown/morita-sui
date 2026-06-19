'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_GAMES, MOCK_ITEMS, MOCK_DRAFT_ITEMS, MOCK_API_KEYS, MOCK_ANALYTICS, MOCK_PUBLISHER_ACTIVITIES } from '@/lib/mock-data';
import { usePublisherStore } from '@/stores/publisher-store';
import StatusBadge from '@/components/shared/status-badge';
import ItemCard from '@/components/shared/item-card';
import MetricCard from '@/components/shared/metric-card';
import ConfirmModal from '@/components/shared/confirm-modal';
import PublishProgressBar from '@/components/shared/publish-progress-bar';
import EmptyState from '@/components/shared/empty-state';

type TabType = 'overview' | 'items' | 'api-keys' | 'analytics' | 'activity';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isPublishing, publishProgress, setPublishing, setProgress } = usePublisherStore();

  const gameId = parseInt(typeof params.game_id === 'string' ? params.game_id : '0', 10);
  const game = MOCK_GAMES.find((g) => g.id === gameId);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [name, setName] = useState(game?.name ?? '');
  const [description, setDescription] = useState(game?.description ?? '');
  const [genre, setGenre] = useState(game?.genre ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(game?.websiteUrl ?? '');

  useEffect(() => { if (game) { setName(game.name); setDescription(game.description ?? ''); setGenre(game.genre ?? ''); setWebsiteUrl(game.websiteUrl ?? ''); } }, [game]);

  if (!game) {
    return <EmptyState title="Game Not Found" description="This game does not exist or may have been removed." action={{ label: 'Back to Games', onClick: () => router.push(`/dashboard/games`) }} />;
  }

  const isDraft = game.status === 'draft';
  const isPublished = game.status === 'published';
  const gameItems = [...MOCK_ITEMS, ...MOCK_DRAFT_ITEMS].filter((i) => i.gameId === gameId);

  const handlePublish = () => {
    setShowPublishConfirm(false);
    setPublishing(true);
    setProgress([{ step: 'Upload Assets', done: false }, { step: 'Deploy on-chain', done: false }, { step: 'Done', done: false }]);
    setTimeout(() => setProgress([{ step: 'Upload Assets', done: true }, { step: 'Deploy on-chain', done: false }, { step: 'Done', done: false }]), 1500);
    setTimeout(() => setProgress([{ step: 'Upload Assets', done: true }, { step: 'Deploy on-chain', done: true }, { step: 'Done', done: false }]), 3000);
    setTimeout(() => { setProgress([{ step: 'Upload Assets', done: true }, { step: 'Deploy on-chain', done: true }, { step: 'Done', done: true }]); setPublishing(false); }, 4500);
  };

  const TAB_ITEMS: { label: string; key: TabType; disabled: boolean }[] = [
    { label: 'Overview', key: 'overview', disabled: false },
    { label: `Items (${gameItems.length})`, key: 'items', disabled: false },
    { label: 'API Keys', key: 'api-keys', disabled: !isPublished },
    { label: 'Analytics', key: 'analytics', disabled: !isPublished },
    { label: 'Activity', key: 'activity', disabled: false },
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <button onClick={() => router.push(`/dashboard/games`)} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark cursor-pointer">&larr; Games</button>
          {isDraft && <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl px-4 py-2"><p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-yellow-800">This game is in draft mode. Review all items before publishing.</p></div>}
          {isPublished && <StatusBadge status="published" />}
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">{game.name}</h1>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {TAB_ITEMS.map((tab) => (
          <button key={tab.key} onClick={() => !tab.disabled && setActiveTab(tab.key)} className={`px-5 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all shrink-0 ${tab.disabled ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' : activeTab === tab.key ? 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] hover:bg-blueberry-cream cursor-pointer'}`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          {isDraft && (
            <div className="mb-6 flex justify-end">
              <button onClick={() => setShowPublishConfirm(true)} disabled={isPublishing} className="px-6 py-3 bg-green-500 text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer disabled:opacity-50">{isPublishing ? 'Publishing...' : 'Publish Game'}</button>
            </div>
          )}
          {isPublishing && (
            <div className="mb-8 p-6 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Publishing in Progress</h3>
              <PublishProgressBar steps={publishProgress.map((p, i) => ({ label: p.step, status: p.done ? 'done' as const : i === publishProgress.findIndex((s) => !s.done) ? 'active' as const : 'pending' as const }))} />
            </div>
          )}
          <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] max-w-2xl">
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-6">Game Details</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isPublished} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 disabled:opacity-50" />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPublished} rows={4} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 disabled:opacity-50 resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Genre</label>
                  <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} disabled={isPublished} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Website URL</label>
                  <input type="text" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={isPublished} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 disabled:opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">Items</h2>
            <button onClick={() => router.push(`/dashboard/games/${gameId}/items`)} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">Manage Items</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gameItems.map((item) => (
              <ItemCard key={item.id} item={{ name: item.name, gameName: item.gameName, itemType: item.itemType, rarity: item.rarity, imageUrl: item.imageUrl, status: item.status }} onClick={() => router.push(`/dashboard/games/${gameId}/items/${item.id}`)} />
            ))}
          </div>
          {gameItems.length === 0 && <EmptyState title="No Items" description="Create your first item for this game." />}
        </div>
      )}

      {activeTab === 'api-keys' && isPublished && (
        <div>
          <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">API Keys</h2>
          <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#1E2044]/20 bg-blueberry-cream/30">
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Key</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Last Used</th>
                  <th className="px-4 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_API_KEYS.map((key) => (
                  <tr key={key.id} className="border-b border-[#1E2044]/10 last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs text-[#1E2044]">{key.prefix}</td>
                    <td className="px-4 py-3"><StatusBadge status={key.isActive ? 'published' : 'paused'} /></td>
                    <td className="px-4 py-3 text-xs font-mono text-[#1E2044]/60">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : '---'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#1E2044]/60">{new Date(key.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => router.push(`/dashboard/games/${gameId}/api-keys`)} className="mt-4 px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">Manage API Keys</button>
        </div>
      )}

      {activeTab === 'analytics' && isPublished && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Total Minted" value={MOCK_ANALYTICS.totalMinted} />
            <MetricCard label="Claimed" value={MOCK_ANALYTICS.totalClaimed} />
            <MetricCard label="Active Players" value={MOCK_ANALYTICS.activePlayers} />
            <MetricCard label="Tx Volume" value={`${MOCK_ANALYTICS.txVolume} SUI`} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
              <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-4">Items Minted Over Time</h3>
              <div className="h-48 bg-blueberry-cream/30 border-2 border-dashed border-[#1E2044]/20 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-mono text-[#1E2044]/40 uppercase">Chart placeholder</span>
              </div>
            </div>
            <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
              <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-4">Claims Over Time</h3>
              <div className="h-48 bg-blueberry-cream/30 border-2 border-dashed border-[#1E2044]/20 rounded-xl flex items-center justify-center">
                <span className="text-[10px] font-mono text-[#1E2044]/40 uppercase">Chart placeholder</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Activity Log</h2>
          <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] divide-y-2 divide-dashed divide-[#1E2044]/10">
            {MOCK_PUBLISHER_ACTIVITIES.map((event) => (
              <div key={event.id} className="p-4 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blueberry shrink-0" />
                <p className="font-sans text-sm text-[#1E2044]/80 flex-1">{event.description}</p>
                <span className="text-[10px] font-mono text-[#1E2044]/40">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal isOpen={showPublishConfirm} title="Publish Game" message={`You are about to publish "${game.name}" with ${gameItems.length} items. This will upload all assets to Walrus and deploy the game on-chain. This action cannot be undone for items.`} confirmLabel="Confirm Publish" onConfirm={handlePublish} onCancel={() => setShowPublishConfirm(false)} />
    </div>
  );
}
