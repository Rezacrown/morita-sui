'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { getMarketplaceListings, getSalesListings, finalizeBuy } from '@/actions/marketplace'
import { buyItem } from '@/lib/sui/ptb'
import { useTransaction } from '@/components/tx/use-transaction'
import FilterBar from '@/components/shared/filter-bar'
import ListingRow from '@/components/shared/listing-row'
import EscrowCard from '@/components/shared/escrow-card'
import EmptyState from '@/components/shared/empty-state'
import ConfirmModal from '@/components/shared/confirm-modal'

type Tab = 'sale' | 'barter' | 'all'

export default function MarketplacePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isLoggedIn, suiAddress } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [searchValue, setSearchValue] = useState('')
  const [rarityFilter, setRarityFilter] = useState<string | null>(null)
  const [buyItemId, setBuyItemId] = useState<string | null>(null)
  const [buyListing, setBuyListing] = useState<any>(null)
  const { state: txState, execute: executeTx, reset: resetTx } = useTransaction()

  const { data: barterListings = { listings: [], total: 0 } } = useQuery({
    queryKey: ['marketplace-barters'],
    queryFn: () => getMarketplaceListings({ rarity: rarityFilter ?? undefined }),
  })

  const { data: saleListings = [] } = useQuery({
    queryKey: ['marketplace-sales'],
    queryFn: () => getSalesListings(),
  })

  const filteredSales = saleListings.filter((l) => {
    if (rarityFilter && l.rarity !== rarityFilter) return false
    if (searchValue && !l.itemName.toLowerCase().includes(searchValue.toLowerCase())) return false
    return l.isActive
  })

  const handleBuyConfirm = async () => {
    if (!buyListing || !suiAddress) return
    const itemId = buyListing.itemObjectId
    setBuyItemId(null)
    setBuyListing(null)

    const result = await executeTx(
      () => buyItem(buyListing.kioskId, process.env.NEXT_PUBLIC_TRANSFER_POLICY_ID!, itemId, parseInt(buyListing.price) || 0, suiAddress),
      [`${process.env.NEXT_PUBLIC_PACKAGE_ID}::kiosk_ext::buy_item`],
    )
    if (result.state === 'confirmed' && result.digest) {
      await finalizeBuy(itemId, result.digest)
      queryClient.invalidateQueries({ queryKey: ['marketplace-sales'] })
    }
  }

  const showSales = activeTab === 'all' || activeTab === 'sale'
  const showBarters = activeTab === 'all' || activeTab === 'barter'
  const hasAny = (showSales ? filteredSales.length > 0 : false) || (showBarters ? barterListings.listings.length > 0 : false)

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

      {!hasAny ? (
        <EmptyState title="No Listings Found" description="No items match your current filters. Try adjusting your search or check back later." />
      ) : (
        <div className="space-y-8">
          {showSales && filteredSales.length > 0 && (
            <div>
              {activeTab === 'all' && <h2 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044]/60 mb-4">For Sale</h2>}
              <div className="space-y-3">
                {filteredSales.map((l) => (
                  <ListingRow key={l.id} item={{ name: l.itemName, gameName: l.gameName, rarity: l.rarity }} price={parseInt(l.price)} sellerName={l.sellerAddress.slice(0, 8)} onClick={() => { setBuyListing(l); setBuyItemId(l.itemObjectId) }} disabled={!isLoggedIn} />
                ))}
              </div>
            </div>
          )}

          {showBarters && barterListings.listings.length > 0 && (
            <div>
              {activeTab === 'all' && <h2 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044]/60 mb-4">For Barter</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {barterListings.listings.map((l) => (
                  <EscrowCard key={l.escrowId} offeredItem={l.offeredItem} initiatorName={l.initiatorAddress?.slice(0, 8) ?? ''} conditions={{ itemTypeAccept: l.conditionsJson?.item_type_accept ?? null, rarityAccept: l.conditionsJson?.rarity_accept ?? null }} isActive={l.isActive} disabled={!isLoggedIn} onClick={() => router.push(`/barter/${l.escrowId}`)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal isOpen={!!buyItemId} title="Buy Item" message={`Buy ${buyListing?.itemName ?? ''} for ${buyListing?.price ?? ''} MIST?`} confirmLabel={txState === 'submitting' ? 'Buying...' : 'Confirm Buy'} onConfirm={handleBuyConfirm} onCancel={() => { setBuyItemId(null); setBuyListing(null); resetTx() }} />
    </div>
  )
}
