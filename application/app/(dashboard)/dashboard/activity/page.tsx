'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getSession } from '@/actions/publisher'
import { list as listGames } from '@/actions/game'

export default function ActivityLogPage() {
  const [searchValue, setSearchValue] = useState('')
  const [eventFilter, setEventFilter] = useState<string | null>(null)
  const { suiAddress } = useAuthStore()

  const { data: session } = useQuery({
    queryKey: ['session', suiAddress],
    queryFn: () => getSession(suiAddress!),
    enabled: !!suiAddress,
  })

  const pubId = session?.publishers[0]?.id as number | undefined

  const { data: games = [] } = useQuery({
    queryKey: ['games', pubId],
    queryFn: () => listGames(pubId!),
    enabled: !!pubId,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Activity Log</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Coming soon with event indexing.</p>
      </div>

      <input
        type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search by address or item name..."
        className="w-full max-w-md bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none mb-6"
      />

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] p-8 text-center">
        <p className="font-sans text-sm text-[#1E2044]/40">No activity found. Events will appear here once the indexer is active.</p>
      </div>
    </div>
  )
}
