'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { list } from '@/actions/item'
import EmptyState from '@/components/shared/empty-state'
import ItemCard from '@/components/shared/item-card'

export default function ItemsListPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = typeof params.game_id === 'string' ? parseInt(params.game_id, 10) : 0
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', gameId, statusFilter],
    queryFn: () => list(gameId, statusFilter ?? undefined),
    enabled: !!gameId,
  })

  const filtered = items.filter((i) => {
    if (typeFilter && i.itemType !== typeFilter) return false
    if (searchValue) {
      const q = searchValue.toLowerCase()
      return i.name.toLowerCase().includes(q) || i.itemType.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display font-black text-2xl uppercase tracking-tight text-[#1E2044]">Items</h1>
        <button
          onClick={() => router.push(`/dashboard/games/${gameId}/items/new`)}
          className="px-5 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer"
        >
          Create Item
        </button>
      </div>

      <div className="mb-6">
        <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Search items..." className="w-full max-w-md bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No Items Found" description="Create an item template to get started." action={{ label: 'Create Item', onClick: () => router.push(`/dashboard/games/${gameId}/items/new`) }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={{ name: item.name, gameName: '', itemType: item.itemType, rarity: item.rarity, status: item.status as 'draft' | 'published' }} onClick={() => router.push(`/dashboard/games/${gameId}/items/${item.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
