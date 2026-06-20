'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useQuery } from '@tanstack/react-query'
import { list as listItems } from '@/actions/item'
import ItemCard from '@/components/shared/item-card'
import EmptyState from '@/components/shared/empty-state'

export default function InventoryPage() {
  const router = useRouter()
  const { isLoggedIn, suiAddress } = useAuthStore()

  const { data: items = [] } = useQuery({
    queryKey: ['inventory', suiAddress],
    queryFn: () => listItems(0),
    enabled: !!suiAddress,
  })

  if (!isLoggedIn) {
    return <EmptyState title="Connect Wallet" description="Connect your wallet to view your inventory of cross-game items." action={{ label: 'Go to Landing', onClick: () => router.push('/') }} />
  }

  if (items.length === 0) {
    return <EmptyState title="No Items Yet" description="Your inventory is empty. Head to the marketplace to find items, or claim a code from a participating game." action={{ label: 'Browse Marketplace', onClick: () => router.push('/marketplace') }} />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">My Inventory</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => (
          <ItemCard key={item.id} item={{ name: item.name, gameName: '', itemType: item.itemType, rarity: item.rarity, status: item.status as 'draft' | 'published' }} onClick={() => router.push(`/inventory/${item.id}`)} />
        ))}
      </div>
    </div>
  )
}
