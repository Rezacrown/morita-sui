'use client';

import React, { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useClaimStore } from '@/stores/claim-store';
import { MOCK_CLAIM_CODES } from '@/lib/mock-data';
import EmptyState from '@/components/shared/empty-state';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function ClaimPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { state, claimedItem, claim, reset } = useClaimStore();
  const code = searchParams.get('code');

  useEffect(() => { reset(); if (code) { /* validate silently */ } }, [code, reset]);

  if (!code) {
    return <EmptyState title="No Code Provided" description="Enter a claim code to redeem your in-game item." action={{ label: 'Back to Marketplace', onClick: () => router.push('/marketplace') }} />;
  }

  const foundCode = MOCK_CLAIM_CODES.find((c) => c.code === code);

  if (!foundCode || foundCode.claimedAt) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)] text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">{!foundCode ? 'Invalid Code' : 'Already Claimed'}</h2>
          <p className="font-sans text-sm text-[#1E2044]/60 mb-6">{!foundCode ? 'This claim code does not exist or has expired.' : `This code was claimed on ${new Date(foundCode.claimedAt!).toLocaleDateString()}.`}</p>
          <button onClick={() => router.push('/marketplace')} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Browse Marketplace</button>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && state === 'idle') {
    return (
      <div className="max-w-lg mx-auto mt-20">
        <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)] text-center">
          <CheckCircle className="w-12 h-12 text-blueberry mx-auto mb-4" />
          <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">You Earned: {foundCode.itemTemplate.name}</h2>
          <p className="font-mono text-xs text-[#1E2044]/60 mb-1">from {foundCode.gameName}</p>
          <p className="font-sans text-sm text-[#1E2044]/60 mb-6">Connect your wallet to claim this item.</p>
          <button onClick={() => window.location.href = '/'} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Connect Wallet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-20">
      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-8 shadow-[4px_4px_0px_0px_var(--color-border-dark)]">
        {state === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-blueberry animate-spin mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Minting Item</h2>
            <p className="font-sans text-sm text-[#1E2044]/60">Confirming on-chain transaction...</p>
          </div>
        )}
        {state === 'success' && claimedItem && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Item Claimed!</h2>
            <p className="font-mono text-sm text-blueberry mb-1">{claimedItem.name}</p>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">from {claimedItem.gameName}</p>
            <button onClick={() => router.push('/inventory')} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">View Inventory</button>
          </div>
        )}
        {state === 'error' && (
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">Claim Failed</h2>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">Something went wrong. Please try again.</p>
            <button onClick={() => { reset(); window.location.reload(); }} className="px-6 py-3 bg-white text-[#1E2044] border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Retry</button>
          </div>
        )}
        {state === 'idle' && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-blueberry mx-auto mb-4" />
            <h2 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">You Earned: {foundCode.itemTemplate.name}</h2>
            <p className="font-mono text-xs text-[#1E2044]/60 mb-1">from {foundCode.gameName}</p>
            <p className="font-sans text-sm text-[#1E2044]/60 mb-6">This item will be minted directly to your wallet. Gas is sponsored — no SUI needed.</p>
            <button onClick={claim} className="px-8 py-4 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[5px_5px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[7px_7px_0px_0px_var(--color-border-dark)] transition-all uppercase text-base cursor-pointer">Claim Item</button>
          </div>
        )}
      </div>
    </div>
  );
}
