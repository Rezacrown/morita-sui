'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { detail as getItem } from '@/actions/item'
import ItemDetail from '@/components/shared/item-detail'
import EmptyState from '@/components/shared/empty-state'

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = typeof params.itemId === 'string' ? parseInt(params.itemId, 10) : 0

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: () => getItem(itemId),
    enabled: !!itemId,
  })

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" /></div>
  if (!item) return <EmptyState title="Item Not Found" description="This item does not exist in your inventory." action={{ label: 'Back to Inventory', onClick: () => router.push('/inventory') }} />

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => router.push('/inventory')} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">&larr; Back to Inventory</button>
      <ItemDetail item={{ name: item.name, gameName: '', description: item.description ?? '', itemType: item.itemType, rarity: item.rarity, supply: item.supply, isNft: item.isNft, attributes: item.attributes ?? {}, imageUrl: null }} />
    </div>
  )
}
