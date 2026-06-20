'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getSession } from '@/actions/publisher'
import StatusBadge from '@/components/shared/status-badge'

export default function SettingsPage() {
  const { suiAddress } = useAuthStore()

  const { data: session } = useQuery({
    queryKey: ['session', suiAddress],
    queryFn: () => getSession(suiAddress!),
    enabled: !!suiAddress,
  })

  const pub = session?.publishers[0]
  const [name, setName] = useState(pub?.name ?? '')
  const [logoUrl, setLogoUrl] = useState(pub?.logoUrl ?? '')

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Settings</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Manage your publisher profile</p>
      </div>

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] mb-8">
        <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-4">Publisher Profile</h3>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#1E2044]/60">Status:</span>
            <StatusBadge status={pub?.isVerified ? 'verified' : 'draft'} />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Publisher Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Sui Address</label>
            <input type="text" value={suiAddress ?? ''} disabled className="w-full bg-blueberry-cream/10 text-sm px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none disabled:opacity-50 font-mono text-xs" />
          </div>
        </div>
      </div>
    </div>
  )
}
