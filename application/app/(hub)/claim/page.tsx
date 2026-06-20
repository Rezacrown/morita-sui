'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { claimInfo } from '@/actions/item'
import { redeemCode } from '@/actions/claim'
import EmptyState from '@/components/shared/empty-state'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function ClaimPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto mt-20"><div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)] text-center"><Loader2 className="w-12 h-12 text-blueberry animate-spin mx-auto mb-4" /></div></div>}>
      <ClaimPageInner />
    </Suspense>
  )
}

function ClaimPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isLoggedIn, suiAddress } = useAuthStore()
  const code = searchParams.get('code')

  const { data: info, isLoading } = useQuery({
    queryKey: ['claim', code],
    queryFn: () => claimInfo(code!),
    enabled: !!code,
  })

  const claimMutation = useMutation({
    mutationFn: () => redeemCode(code!, suiAddress!),
  })

  if (!code) {
    return <EmptyState title="No Code Provided" description="Enter a claim code to redeem your in-game item." action={{ label: 'Back to Marketplace', onClick: () => router.push('/marketplace') }} />
  }

  if (isLoading) {
    return <div className="max-w-lg mx-auto mt-20"><div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)] text-center"><Loader2 className="w-12 h-12 text-blueberry animate-spin mx-auto mb-4" /></div></div>
  }

  if (!info) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)] text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Invalid Code</h2>
          <p className="font-sans text-sm text-[#1E2044]/60 mb-6">This claim code does not exist or has expired.</p>
          <button onClick={() => router.push('/marketplace')} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Browse Marketplace</button>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)] text-center">
          <CheckCircle className="w-12 h-12 text-blueberry mx-auto mb-4" />
          <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">You Earned: {info.itemName}</h2>
          <p className="font-mono text-xs text-[#1E2044]/60 mb-1">from {info.gameName}</p>
          <p className="font-sans text-sm text-[#1E2044]/60 mb-6">Connect your wallet to claim this item.</p>
          <button onClick={() => window.location.href = '/'} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Connect Wallet</button>
        </div>
      </div>
    )
  }

  const txState = claimMutation.isPending ? 'submitting' : claimMutation.isError ? 'error' : claimMutation.isSuccess ? 'confirmed' : 'idle'

  return (
    <div className="max-w-lg mx-auto mt-20">
      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
        {txState === 'submitting' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blueberry animate-spin mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Minting Item</h2>
            <p className="font-sans text-sm text-[#1E2044]/60">Confirming on-chain transaction...</p>
          </div>
        )}
        {txState === 'confirmed' && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Item Claimed!</h2>
            <p className="font-mono text-sm text-blueberry mb-1">{info.itemName}</p>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">from {info.gameName}</p>
            <button onClick={() => router.push('/inventory')} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">View Inventory</button>
          </div>
        )}
        {txState === 'error' && (
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Claim Failed</h2>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">{claimMutation.error instanceof Error ? claimMutation.error.message : 'Something went wrong.'}</p>
            <button onClick={() => claimMutation.reset()} className="px-6 py-3 bg-white text-[#1E2044] border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Retry</button>
          </div>
        )}
        {txState === 'idle' && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-blueberry mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">You Earned: {info.itemName}</h2>
            <p className="font-mono text-xs text-[#1E2044]/60 mb-1">from {info.gameName}</p>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">This item will be minted directly to your wallet. Gas is sponsored — no SUI needed.</p>
            <button onClick={() => claimMutation.mutate()} className="px-8 py-4 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[5px_5px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_var(--color-border-dark)] transition-all uppercase text-base cursor-pointer">Claim Item</button>
          </div>
        )}
      </div>
    </div>
  )
}
