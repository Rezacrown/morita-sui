'use client'

import React from 'react'
import { useAuthStore } from '@/stores/auth-store'
import EmptyState from '@/components/shared/empty-state'
import { Sparkles, Tag, ArrowLeftRight, ExternalLink } from 'lucide-react'

export default function HistoryPage() {
  const { isLoggedIn } = useAuthStore()

  if (!isLoggedIn) {
    return <EmptyState title="Connect Wallet" description="Connect your wallet to view your transaction history." action={{ label: 'Go to Landing', onClick: () => window.location.href = '/' }} />
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Transaction History</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Coming soon with event indexing.</p>
      </div>
      <EmptyState title="No Events Yet" description="Transaction history will appear here once the event indexer is active." />
    </div>
  )
}
