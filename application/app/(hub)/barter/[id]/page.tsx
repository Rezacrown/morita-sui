'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getListingDetail, finalizeCancel, finalizeFulfill } from '@/actions/marketplace'
import { cancel, fulfill } from '@/lib/sui/ptb'
import { useTransaction } from '@/components/tx/use-transaction'
import StatusBadge from '@/components/shared/status-badge'
import EmptyState from '@/components/shared/empty-state'
import ConfirmModal from '@/components/shared/confirm-modal'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function BarterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isLoggedIn, suiAddress } = useAuthStore()
  const escrowId = typeof params.id === 'string' ? params.id : ''

  const { state: txState, digest: txDigest, error: txError, execute: executeTx, reset: resetTx } = useTransaction()
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'cancel' | 'fulfill'>('cancel')
  const [myItemId, setMyItemId] = useState('')

  const { data: escrow, isLoading } = useQuery({
    queryKey: ['escrow', escrowId],
    queryFn: () => getListingDetail(escrowId),
    enabled: !!escrowId,
  })

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" /></div>
  if (!escrow) return <EmptyState title="Escrow Not Found" description="This barter escrow does not exist or may have been removed." action={{ label: 'Back to Marketplace', onClick: () => router.push('/marketplace') }} />

  const isOwner = isLoggedIn && suiAddress === escrow.initiatorAddress

  const handleCancelConfirm = async () => {
    setShowConfirm(false)
    const result = await executeTx(
      () => cancel(escrowId, suiAddress!),
      [`${process.env.NEXT_PUBLIC_PACKAGE_ID}::escrow::cancel_escrow`],
    )
    if (result.state === 'confirmed' && result.digest) {
      await finalizeCancel(escrowId, result.digest)
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] })
    }
  }

  const handleFulfillConfirm = async () => {
    if (!myItemId) return
    setShowConfirm(false)
    const result = await executeTx(
      () => fulfill(escrowId, myItemId, suiAddress!),
      [`${process.env.NEXT_PUBLIC_PACKAGE_ID}::escrow::fulfill_escrow`],
    )
    if (result.state === 'confirmed' && result.digest) {
      await finalizeFulfill(escrowId, result.digest)
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] })
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => router.push('/marketplace')} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">&larr; Back to Marketplace</button>

      <div className="flex items-center gap-3 mb-6">
        <StatusBadge status={escrow.isActive ? 'published' : 'paused'} />
        <span className="font-sans text-sm text-[#1E2044]/60">{escrow.isActive ? 'Active - Awaiting counterparty' : 'Completed or Cancelled'}</span>
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

      {txState === 'submitting' && (
        <div className="mb-8 p-6 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blueberry animate-spin" />
            <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">{confirmAction === 'cancel' ? 'Cancelling' : 'Fulfilling'} escrow...</h3>
          </div>
        </div>
      )}

      {txState === 'confirmed' && (
        <div className="mb-8 p-6 bg-green-50 border-3 border-green-500 rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">{confirmAction === 'cancel' ? 'Cancelled!' : 'Fulfilled!'}</h3>
              <p className="font-mono text-xs text-[#1E2044]/60 mt-1">Tx: {txDigest?.slice(0, 20)}...</p>
            </div>
          </div>
        </div>
      )}

      {txState === 'error' && (
        <div className="mb-8 p-6 bg-red-50 border-3 border-red-500 rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044]">Transaction Failed</h3>
              <p className="font-mono text-xs text-red-600 mt-1">{txError}</p>
              <button onClick={resetTx} className="mt-2 px-4 py-1.5 bg-white border-2 border-[#1E2044] font-display font-black rounded-xl text-xs uppercase cursor-pointer">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {escrow.isActive && txState === 'idle' && (
        <div className="space-y-6">
          {!isOwner && isLoggedIn && (
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Your GameItem Object ID</label>
              <input
                type="text"
                value={myItemId}
                onChange={(e) => setMyItemId(e.target.value)}
                placeholder="0x..."
                className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none font-mono"
              />
            </div>
          )}
          <div className="flex gap-3">
            {isOwner && (
              <button onClick={() => { setConfirmAction('cancel'); setShowConfirm(true) }} className="px-6 py-3 bg-white text-red-500 border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Cancel Escrow</button>
            )}
            {!isOwner && isLoggedIn && (
              <button
                onClick={() => { setConfirmAction('fulfill'); setShowConfirm(true) }}
                disabled={!myItemId}
                className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer disabled:opacity-50"
              >
                Fulfill Barter
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        title={confirmAction === 'cancel' ? 'Cancel Escrow' : 'Fulfill Barter'}
        message={confirmAction === 'cancel'
          ? 'Are you sure you want to cancel this escrow? The offered item will be returned to your inventory.'
          : `Confirm that you want to fulfill this barter using item ${myItemId.slice(0, 10)}...`}
        confirmLabel={confirmAction === 'cancel' ? 'Yes, Cancel' : 'Fulfill'}
        variant={confirmAction === 'cancel' ? 'danger' : 'default'}
        onConfirm={confirmAction === 'cancel' ? handleCancelConfirm : handleFulfillConfirm}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  )
}
