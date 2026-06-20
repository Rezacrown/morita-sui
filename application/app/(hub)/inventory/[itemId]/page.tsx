'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getInventoryItem } from '@/actions/inventory'
import ItemDetail from '@/components/shared/item-detail'
import SellModal from '@/components/marketplace/sell-modal'
import BarterModal from '@/components/marketplace/barter-modal'
import EmptyState from '@/components/shared/empty-state'

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const objectId = typeof params.itemId === 'string' ? params.itemId : ''
  const [showSell, setShowSell] = useState(false)
  const [showBarter, setShowBarter] = useState(false)

  const { data: item, isLoading } = useQuery({
    queryKey: ['inventory-item', objectId],
    queryFn: () => getInventoryItem(objectId),
    enabled: !!objectId,
  })

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" /></div>
  if (!item) return <EmptyState title="Item Not Found" description="This item does not exist on-chain." action={{ label: 'Back to Inventory', onClick: () => router.push('/inventory') }} />

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => router.push('/inventory')} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">&larr; Back to Inventory</button>
      <ItemDetail item={{ name: item.name || item.itemType, gameName: item.gameName, description: '', itemType: item.itemType, rarity: item.rarity, imageUrl: item.imageUrl, suiItemId: item.objectId, isNft: true }}>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowSell(true)} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">List for Sale</button>
          <button onClick={() => setShowBarter(true)} className="px-6 py-3 bg-white text-[#1E2044] border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Create Barter</button>
        </div>
      </ItemDetail>

      <SellModal
        isOpen={showSell}
        itemObjectId={item.objectId}
        itemName={item.name || item.itemType}
        itemType={item.itemType}
        rarity={item.rarity}
        gameName={item.gameName}
        onDone={() => { setShowSell(false); queryClient.invalidateQueries({ queryKey: ['inventory-item', objectId] }) }}
        onCancel={() => setShowSell(false)}
      />

      <BarterModal
        isOpen={showBarter}
        itemObjectId={item.objectId}
        itemBlobId={item.blobId}
        gameId={null}
        onDone={(escrowId) => { setShowBarter(false); router.push(`/barter/${escrowId}`) }}
        onCancel={() => setShowBarter(false)}
      />
    </div>
  )
}
