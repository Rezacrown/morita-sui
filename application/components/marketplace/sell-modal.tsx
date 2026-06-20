'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createKiosk, listForSale } from '@/lib/sui/ptb'
import { useTransaction } from '@/components/tx/use-transaction'
import { getMyKiosk, finalizeCreateKiosk, finalizeListForSale } from '@/actions/kiosk'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface SellModalProps {
  isOpen: boolean
  itemObjectId: string
  itemName: string
  itemType: string
  rarity: string
  gameName: string
  onDone: () => void
  onCancel: () => void
}

export default function SellModal({ isOpen, itemObjectId, itemName, itemType, rarity, gameName, onDone, onCancel }: SellModalProps) {
  const { suiAddress } = useAuthStore()
  const { state: txState, digest: txDigest, error: txError, execute: executeTx, reset: resetTx } = useTransaction()
  const [step, setStep] = useState<'idle' | 'needs_kiosk' | 'kiosk_tx' | 'sell_tx'>('idle')
  const [price, setPrice] = useState('')
  const [hasKiosk, setHasKiosk] = useState(false)
  const [kioskId, setKioskId] = useState('')
  const [capId, setCapId] = useState('')

  useEffect(() => {
    if (!isOpen || !suiAddress) return
    getMyKiosk(suiAddress).then((k) => {
      if (k) { setHasKiosk(true); setKioskId(k.kioskId); setCapId(k.kioskOwnerCapId); setStep('idle') }
      else { setHasKiosk(false); setStep('needs_kiosk') }
    })
  }, [isOpen, suiAddress])

  const handleClose = useCallback(() => { if (txState !== 'submitting') { resetTx(); setStep('idle'); setPrice(''); onCancel() } }, [txState])
  const handleEscape = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }, [handleClose])
  useEffect(() => {
    if (isOpen) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = '' }
  }, [isOpen, handleEscape])

  const handleCreateKiosk = async () => {
    if (!suiAddress) return
    setStep('kiosk_tx')
    const result = await executeTx(
      () => createKiosk(suiAddress),
      [`0x2::kiosk::new`],
    )
    if (result.state === 'confirmed' && result.digest) {
      const fin = await finalizeCreateKiosk(suiAddress, result.digest)
      if (fin.success) { setKioskId(fin.kioskId); setHasKiosk(true); setStep('idle') }
    }
  }

  const handleListForSale = async () => {
    if (!suiAddress || !kioskId || !price) return
    setStep('sell_tx')
    const result = await executeTx(
      () => listForSale(itemObjectId, kioskId, capId, parseInt(price) || 0, null),
      [`${process.env.NEXT_PUBLIC_PACKAGE_ID}::kiosk_ext::list_for_sale`],
    )
    if (result.state === 'confirmed' && result.digest) {
      await finalizeListForSale({
        itemObjectId, sellerAddress: suiAddress, kioskId,
        price, itemName, itemType, rarity, gameName,
      }, result.digest)
      onDone()
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
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">
              {step === 'kiosk_tx' ? 'Creating Kiosk' : 'Listing for Sale'}
            </h3>
          </div>
        )}

        {txState === 'confirmed' && step === 'sell_tx' && (
          <div className="text-center py-4">
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Listed for Sale!</h3>
            <a href={`https://suiscan.xyz/testnet/tx/${txDigest}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-blueberry underline break-all">{txDigest?.slice(0, 12)}...{txDigest?.slice(-8)}</a>
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

        {txState === 'idle' && step === 'needs_kiosk' && (
          <>
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Kiosk Required</h3>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">You need a Sui Kiosk to list items for sale. This is a one-time setup.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={handleClose} className="px-5 py-2.5 bg-white text-[#1E2044] border-2 border-[#1E2044] font-mono font-black rounded-lg text-xs uppercase cursor-pointer">Cancel</button>
              <button onClick={handleCreateKiosk} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-lg text-xs uppercase cursor-pointer">Create Kiosk</button>
            </div>
          </>
        )}

        {txState === 'idle' && step !== 'needs_kiosk' && (
          <>
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">List for Sale</h3>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">{itemName} &middot; {rarity}</p>
            <div className="mb-6">
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Price (MIST)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 100000000" className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none" autoFocus />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={handleClose} className="px-5 py-2.5 bg-white text-[#1E2044] border-2 border-[#1E2044] font-mono font-black rounded-lg text-xs uppercase cursor-pointer">Cancel</button>
              <button onClick={handleListForSale} disabled={!price} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-lg text-xs uppercase cursor-pointer disabled:opacity-50">List for Sale</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
