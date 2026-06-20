'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getMarketplaceListings } from '@/actions/marketplace'
import FilterBar from '@/components/shared/filter-bar'
import ListingRow from '@/components/shared/listing-row'
import EscrowCard from '@/components/shared/escrow-card'
import EmptyState from '@/components/shared/empty-state'

type Tab = 'sale' | 'barter' | 'all'

export default function MarketplacePage() {
  const { isLoggedIn } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [searchValue, setSearchValue] = useState('')
  const [rarityFilter, setRarityFilter] = useState<string | null>(null)

  const { data: listings = { listings: [], total: 0 }, isLoading } = useQuery({
    queryKey: ['marketplace', activeTab],
    queryFn: () => getMarketplaceListings({ type: activeTab === 'all' ? undefined : activeTab, rarity: rarityFilter ?? undefined }),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Marketplace</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Browse items for sale and barter escrows</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'sale', 'barter'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all cursor-pointer ${activeTab === tab ? 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] hover:bg-blueberry-cream'}`}>
            {tab === 'sale' ? 'For Sale' : tab === 'barter' ? 'For Barter' : 'All'}
          </button>
        ))}
      </div>

      <FilterBar
        filters={[{ label: 'Rarity', key: 'rarity', options: [{ label: 'Legendary', value: 'Legendary' }, { label: 'Epic', value: 'Epic' }, { label: 'Rare', value: 'Rare' }, { label: 'Uncommon', value: 'Uncommon' }, { label: 'Common', value: 'Common' }], value: rarityFilter, onChange: setRarityFilter }]}
        sortBy="newest" onSortChange={() => {}}
        searchValue={searchValue} onSearchChange={setSearchValue}
        className="mb-6"
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blueberry border-t-transparent rounded-full animate-spin" /></div>
      ) : listings.listings.length === 0 ? (
        <EmptyState title="No Listings Found" description="No items match your current filters. Try adjusting your search or check back later." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {listings.listings.map((l) => (
            <EscrowCard
              key={l.escrowId}
              offeredItem={{ name: '', gameName: '', rarity: '' }}
              initiatorName={l.initiatorAddress?.slice(0, 8) ?? ''}
              conditions={{
                itemTypeAccept: l.conditionsJson?.item_type_accept ?? null,
                rarityAccept: l.conditionsJson?.rarity_accept ?? null,
              }}
              isActive={l.isActive}
              disabled={!isLoggedIn}
              onClick={() => { window.location.href = `/barter/${l.escrowId}` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
