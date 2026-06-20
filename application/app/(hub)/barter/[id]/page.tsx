'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getListingDetail } from '@/actions/marketplace'
import StatusBadge from '@/components/shared/status-badge'
import ConfirmModal from '@/components/shared/confirm-modal'
import EmptyState from '@/components/shared/empty-state'

export default function BarterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isLoggedIn, suiAddress } = useAuthStore()
  const escrowId = typeof params.id === 'string' ? params.id : ''
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'fulfill'>('cancel')

  const { data: escrow, isLoading } = useQuery({
    queryKey: ['escrow', escrowId],
    queryFn: () => getListingDetail(escrowId),
    enabled: !!escrowId,
  })

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" /></div>
  if (!escrow) return <EmptyState title="Escrow Not Found" description="This barter escrow does not exist or may have been removed." action={{ label: 'Back to Marketplace', onClick: () => router.push('/marketplace') }} />

  const isOwner = isLoggedIn && suiAddress === escrow.initiatorAddress

  const confirmActionHandler = () => {
    console.log(`${confirmAction} escrow:`, escrow.escrowId)
    setIsConfirmOpen(false)
    if (confirmAction === 'cancel') router.push('/marketplace')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => router.push('/marketplace')} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">&larr; Back to Marketplace</button>
      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={escrow.isActive ? 'published' : 'paused'} />
        <span className="font-sans text-sm text-[#1E2044]/60">{escrow.isActive ? 'Active — Awaiting counterparty' : 'Completed or Cancelled'}</span>
      </div>

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] mb-8">
        <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">Barter Conditions</h2>
        <p className="font-sans text-sm text-[#1E2044]/60 mb-4"><span className="font-mono font-bold text-[#1E2044]">{escrow.initiatorAddress.slice(0, 10)}...</span> is looking for:</p>
        <div className="flex flex-wrap gap-3">
          {escrow.conditionsJson?.item_type_accept && (
            <div className="px-4 py-2 bg-blueberry-cream border-2 border-blueberry/30 rounded-xl">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">Item Type: {escrow.conditionsJson.item_type_accept}</span>
            </div>
          )}
          {escrow.conditionsJson?.rarity_accept && (
            <div className="px-4 py-2 bg-blueberry-cream border-2 border-blueberry/30 rounded-xl">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">Rarity: {escrow.conditionsJson.rarity_accept}</span>
            </div>
          )}
          {!escrow.conditionsJson?.item_type_accept && !escrow.conditionsJson?.rarity_accept && (
            <span className="text-sm font-sans text-[#1E2044]/50">Open to any item</span>
          )}
        </div>
      </div>

      {escrow.isActive && (
        <div className="flex gap-3">
          {isOwner ? (
            <button onClick={() => { setConfirmAction('cancel'); setIsConfirmOpen(true) }} className="px-6 py-3 bg-white text-red-500 border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Cancel Escrow</button>
          ) : (
            isLoggedIn && <button onClick={() => { setConfirmAction('fulfill'); setIsConfirmOpen(true) }} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Fulfill Barter</button>
          )}
        </div>
      )}

      <ConfirmModal isOpen={isConfirmOpen} title={confirmAction === 'cancel' ? 'Cancel Escrow' : 'Fulfill Barter'}
        message={confirmAction === 'cancel' ? 'Are you sure you want to cancel this escrow? The offered item will be returned to your inventory.' : 'Confirm that you want to fulfill this barter with an item from your inventory.'}
        confirmLabel={confirmAction === 'cancel' ? 'Yes, Cancel' : 'Fulfill'}
        variant={confirmAction === 'cancel' ? 'danger' : 'default'}
        onConfirm={confirmActionHandler} onCancel={() => setIsConfirmOpen(false)} />
    </div>
  )
}
