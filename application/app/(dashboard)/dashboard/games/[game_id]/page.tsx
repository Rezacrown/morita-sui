'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { detail, update as updateGame } from '@/actions/game'
import { list as listItems } from '@/actions/item'
import { usePublisherStore } from '@/stores/publisher-store'
import StatusBadge from '@/components/shared/status-badge'
import ItemCard from '@/components/shared/item-card'
import ConfirmModal from '@/components/shared/confirm-modal'
import PublishProgressBar from '@/components/shared/publish-progress-bar'
import EmptyState from '@/components/shared/empty-state'

type TabType = 'overview' | 'items' | 'api-keys' | 'analytics' | 'activity'

function GameOverviewForm({ game }: { game: NonNullable<Awaited<ReturnType<typeof detail>>> }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isPublishing, publishProgress, setPublishing, setProgress } = usePublisherStore()
  const [name, setName] = useState(game.name)
  const [description, setDescription] = useState(game.description ?? '')
  const [genre, setGenre] = useState(game.genre ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(game.websiteUrl ?? '')
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  const isDraft = game.status === 'draft'
  const isPublished = game.status === 'published'

  const saveMutation = useMutation({
    mutationFn: () => updateGame(game.id, { name, description: description || undefined, genre: genre || undefined, websiteUrl: websiteUrl || undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game', game.id] }),
  })

  const handlePublish = async () => {
    setShowPublishConfirm(false)
    setPublishing(true)
    setProgress([
      { step: 'Upload Assets', done: false },
      { step: 'Deploy on-chain', done: false },
      { step: 'Done', done: false },
    ])

    try {
      // TODO: wire publish via useTransaction when ready
      // await publishGameComplete(game.id, suiGameId, capId)
      setProgress([
        { step: 'Upload Assets', done: true },
        { step: 'Deploy on-chain', done: true },
        { step: 'Done', done: true },
      ])
      queryClient.invalidateQueries({ queryKey: ['game', game.id] })
    } catch {
      setPublishing(false)
      setProgress([])
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div>
      {isDraft && (
        <div className="mb-6 flex justify-end">
          <button onClick={() => setShowPublishConfirm(true)} disabled={isPublishing} className="px-6 py-3 bg-green-500 text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer disabled:opacity-50">
            {isPublishing ? 'Publishing...' : 'Publish Game'}
          </button>
        </div>
      )}

      {isPublishing && (
        <div className="mb-8 p-6 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
          <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Publishing in Progress</h3>
          <PublishProgressBar steps={publishProgress.map((p, i) => ({
            label: p.step,
            status: p.done ? 'done' as const : i === publishProgress.findIndex((s) => !s.done) ? 'active' as const : 'pending' as const,
          }))} />
        </div>
      )}

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] max-w-2xl">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-6">Game Details</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isPublished} className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPublished} rows={4} className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none disabled:opacity-50 resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Genre</label>
              <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} disabled={isPublished} className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Website URL</label>
              <input type="text" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={isPublished} className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none disabled:opacity-50" />
            </div>
          </div>
          {isDraft && (
            <div className="flex justify-end pt-2">
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer disabled:opacity-50">
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal isOpen={showPublishConfirm} title="Publish Game" message={`You are about to publish "${game.name}". This will deploy the game on-chain.`} confirmLabel="Confirm Publish" onConfirm={handlePublish} onCancel={() => setShowPublishConfirm(false)} />
    </div>
  )
}

export default function GameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = parseInt(typeof params.game_id === 'string' ? params.game_id : '0', 10)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const { data: game, isLoading } = useQuery({
    queryKey: ['game', gameId],
    queryFn: () => detail(gameId),
    enabled: !!gameId,
  })

  const { data: items = [] } = useQuery({
    queryKey: ['items', gameId],
    queryFn: () => listItems(gameId),
    enabled: !!gameId && activeTab === 'items',
  })

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" /></div>
  }
  if (!game) {
    return <EmptyState title="Game Not Found" description="This game does not exist or may have been removed." action={{ label: 'Back to Games', onClick: () => router.push('/dashboard/games') }} />
  }

  const isDraft = game.status === 'draft'
  const isPublished = game.status === 'published'

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <button onClick={() => router.push('/dashboard/games')} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark cursor-pointer">&larr; Games</button>
          {isDraft && (
            <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl px-4 py-2">
              <p className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-yellow-800">This game is in draft mode.</p>
            </div>
          )}
          {isPublished && <StatusBadge status="published" />}
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">{game.name}</h1>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(['overview', 'items', 'api-keys', 'analytics', 'activity'] as const).map((key) => {
          const labels: Record<TabType, string> = { overview: 'Overview', items: `Items (${items.length})`, 'api-keys': 'API Keys', analytics: 'Analytics', activity: 'Activity' }
          const disabled = (key === 'api-keys' || key === 'analytics') && !isPublished
          return (
            <button key={key} onClick={() => !disabled && setActiveTab(key)}
              className={`px-5 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all shrink-0 ${
                disabled ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : activeTab === key ? 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)]'
                : 'bg-white text-[#1E2044] hover:bg-blueberry-cream cursor-pointer'
              }`}
            >
              {labels[key]}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && <GameOverviewForm key={game.id} game={game} />}

      {activeTab === 'items' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">Items</h2>
            <button onClick={() => router.push(`/dashboard/games/${gameId}/items`)} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">Manage Items</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={{ name: item.name, gameName: game.name, itemType: item.itemType, rarity: item.rarity, status: item.status as 'draft' | 'published' }} onClick={() => router.push(`/dashboard/games/${gameId}/items/${item.id}`)} />
            ))}
          </div>
          {items.length === 0 && <EmptyState title="No Items" description="Create your first item for this game." />}
        </div>
      )}

      {activeTab === 'api-keys' && isPublished && (
        <div>
          <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">API Keys</h2>
          <p className="font-mono text-xs text-[#1E2044]/60 mb-4">Manage your API keys via the dedicated page.</p>
          <button onClick={() => router.push(`/dashboard/games/${gameId}/api-keys`)} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">Manage API Keys</button>
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Activity Log</h2>
          <p className="font-mono text-xs text-[#1E2044]/60">Coming soon with event indexing.</p>
        </div>
      )}
    </div>
  )
}
