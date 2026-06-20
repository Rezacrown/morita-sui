'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getSession } from '@/actions/publisher'
import { list as listGames } from '@/actions/game'
import MetricCard from '@/components/shared/metric-card'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('all')
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
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Analytics</h1>
          <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Cross-game aggregated metrics</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-2 font-display font-black text-xs uppercase rounded-xl border-2 border-[#1E2044] transition-all cursor-pointer ${timeRange === range ? 'bg-blueberry text-white shadow-[2px_2px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] hover:bg-blueberry-cream'}`}>
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Total Games" value={games.length} />
        <MetricCard label="Published" value={games.filter((g) => g.status === 'published').length} />
        <MetricCard label="Total Items" value={0} />
        <MetricCard label="Tx Volume" value="0 SUI" />
      </div>

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden">
        <div className="px-6 py-4 bg-blueberry-cream/30 border-b-2 border-[#1E2044]/20">
          <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044]">Per-Game Breakdown</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#1E2044]/20 bg-blueberry-cream/30">
              <th className="px-6 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Game</th>
              <th className="px-6 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Status</th>
              <th className="px-6 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Items</th>
              <th className="px-6 py-3 text-left text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Created</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id} className="border-b border-[#1E2044]/10 last:border-b-0">
                <td className="px-6 py-3 font-display font-bold text-sm text-[#1E2044]">{g.name}</td>
                <td className="px-6 py-3"><span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border-2 bg-blueberry-cream text-blueberry-dark border-blueberry/30">{g.status}</span></td>
                <td className="px-6 py-3 font-mono text-xs text-[#1E2044]/80">0</td>
                <td className="px-6 py-3 font-mono text-xs text-[#1E2044]/60">{new Date(g.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
