'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { lockForAny, lockForTarget } from '@/lib/sui/ptb'
import { useTransaction } from '@/components/tx/use-transaction'
import { finalizeCreateBarter } from '@/actions/marketplace'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface BarterModalProps {
  isOpen: boolean
  itemObjectId: string
  itemBlobId: string
  gameId: number | null
  onDone: (escrowId: string) => void
  onCancel: () => void
}

const RARITY_OPTIONS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']

export default function BarterModal({ isOpen, itemObjectId, itemBlobId, gameId, onDone, onCancel }: BarterModalProps) {
  const { suiAddress } = useAuthStore()
  const { state: txState, error: txError, execute: executeTx, reset: resetTx } = useTransaction()
  const [itemTypeAccept, setItemTypeAccept] = useState('')
  const [rarityAccept, setRarityAccept] = useState('')
  const [counterparty, setCounterparty] = useState('')

  const handleClose = useCallback(() => { if (txState !== 'submitting') { resetTx(); onCancel() } }, [txState])
  const handleEscape = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }, [handleClose])
  useEffect(() => {
    if (isOpen) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = '' }
  }, [isOpen, handleEscape])

  const handleCreate = async () => {
    if (!suiAddress) return

    const conditions = {
      rarityAccept: rarityAccept || null,
      itemTypeAccept: itemTypeAccept || null,
    }

    const result = await executeTx(
      () => counterparty
        ? lockForTarget(itemObjectId, conditions, counterparty)
        : lockForAny(itemObjectId, conditions),
      [
        counterparty
          ? `${process.env.NEXT_PUBLIC_PACKAGE_ID}::escrow::lock_item_for_target`
          : `${process.env.NEXT_PUBLIC_PACKAGE_ID}::escrow::lock_item_for_any`,
      ],
    )

    if (result.state === 'confirmed' && result.digest) {
      const fin = await finalizeCreateBarter({
        initiatorAddress: suiAddress,
        conditionsJson: conditions,
        offerGameId: gameId ?? undefined,
        offerItemBlobId: itemBlobId || undefined,
      }, result.digest)
      if (fin.success && fin.escrowId) onDone(fin.escrowId)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1E2044]/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-border-dark)] p-8">

        {txState === 'submitting' && (
          <div className="text-center py-4">
            <Loader2 className="w-10 h-10 text-blueberry animate-spin mx-auto mb-4" />
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Creating Barter</h3>
          </div>
        )}

        {txState === 'confirmed' && (
          <div className="text-center py-4">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Barter Created!</h3>
          </div>
        )}

        {txState === 'error' && (
          <div className="text-center py-4">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Failed</h3>
            <p className="font-sans text-sm text-red-500 mb-4">{txError}</p>
            <button onClick={resetTx} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl text-xs uppercase cursor-pointer">Try Again</button>
          </div>
        )}

        {txState === 'idle' && (
          <>
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Create Barter</h3>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">Lock your item in escrow. Set what you want in return.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Want Item Type (optional)</label>
                <input type="text" value={itemTypeAccept} onChange={(e) => setItemTypeAccept(e.target.value)} placeholder="e.g. weapon" className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Minimum Rarity (optional)</label>
                <select value={rarityAccept} onChange={(e) => setRarityAccept(e.target.value)} className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none">
                  <option value="">Any</option>
                  {RARITY_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Counterparty Address (optional — leave empty for public)</label>
                <input type="text" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="0x..." className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none font-mono" />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={handleClose} className="px-5 py-2.5 bg-white text-[#1E2044] border-2 border-[#1E2044] font-mono font-black rounded-lg text-xs uppercase cursor-pointer">Cancel</button>
              <button onClick={handleCreate} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-lg text-xs uppercase cursor-pointer">Create Barter</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
