'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useMarketplaceStore } from '@/stores/marketplace-store';
import { MOCK_LISTINGS, MOCK_ESCROWS } from '@/lib/mock-data';
import FilterBar from '@/components/shared/filter-bar';
import ListingRow from '@/components/shared/listing-row';
import EscrowCard from '@/components/shared/escrow-card';
import EmptyState from '@/components/shared/empty-state';

type Tab = 'sale' | 'barter' | 'all';

export default function MarketplacePage() {
  const { isLoggedIn } = useAuthStore();
  const { listings, setListings, escrows, setEscrows, sortBy, setSortBy } = useMarketplaceStore();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchValue, setSearchValue] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string | null>(null);

  useEffect(() => { setListings(MOCK_LISTINGS); setEscrows(MOCK_ESCROWS); }, [setListings, setEscrows]);

  const filteredListings = listings.filter((l) => {
    if (activeTab === 'barter') return false;
    if (activeTab === 'sale') return l.listingType === 'sale';
    return true;
  }).filter((l) => {
    if (searchValue) { const q = searchValue.toLowerCase(); return l.item.name.toLowerCase().includes(q) || l.item.gameName.toLowerCase().includes(q); }
    return true;
  }).filter((l) => {
    if (rarityFilter && l.item.rarity !== rarityFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const filteredEscrows = escrows.filter((e) => activeTab !== 'sale').filter((e) => {
    if (searchValue) { const q = searchValue.toLowerCase(); return e.offeredItem.name.toLowerCase().includes(q) || e.offeredItem.gameName.toLowerCase().includes(q); }
    return true;
  }).filter((e) => {
    if (rarityFilter && e.offeredItem.rarity !== rarityFilter) return false;
    return true;
  });

  const showListings = activeTab === 'all' || activeTab === 'sale';
  const showEscrows = activeTab === 'all' || activeTab === 'barter';

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Marketplace</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">Browse items for sale and barter escrows</p>
      </div>
      <div className="flex gap-2 mb-6">
        {(['all', 'sale', 'barter'] as Tab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 font-display font-black text-xs uppercase rounded-xl border-3 border-[#1E2044] transition-all cursor-pointer ${activeTab === tab ? 'bg-blueberry text-white shadow-[3px_3px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] hover:bg-blueberry-cream'}`}>{tab === 'sale' ? 'For Sale' : tab === 'barter' ? 'For Barter' : 'All'}</button>
        ))}
      </div>
      <FilterBar filters={[{ label: 'Rarity', key: 'rarity', options: [{ label: 'Legendary', value: 'Legendary' }, { label: 'Epic', value: 'Epic' }, { label: 'Rare', value: 'Rare' }, { label: 'Uncommon', value: 'Uncommon' }, { label: 'Common', value: 'Common' }], value: rarityFilter, onChange: setRarityFilter }]} sortBy={sortBy} onSortChange={(v) => setSortBy(v as 'newest' | 'price_asc' | 'price_desc')} searchValue={searchValue} onSearchChange={setSearchValue} className="mb-6" />
      {showListings && filteredListings.length > 0 && (
        <div className="mb-10">
          {activeTab === 'all' && <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">For Sale</h2>}
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <ListingRow key={listing.id} item={{ name: listing.item.name, gameName: listing.item.gameName, rarity: listing.item.rarity }} price={listing.price} sellerName={listing.sellerName} disabled={!isLoggedIn} onClick={() => console.log('Buy item:', listing.id)} />
            ))}
          </div>
        </div>
      )}
      {showEscrows && filteredEscrows.length > 0 && (
        <div className="mb-10">
          {activeTab === 'all' && <h2 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-4">For Barter</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEscrows.map((escrow) => (
              <EscrowCard key={escrow.id} offeredItem={{ name: escrow.offeredItem.name, gameName: escrow.offeredItem.gameName, rarity: escrow.offeredItem.rarity }} initiatorName={escrow.initiatorName} conditions={escrow.conditions} isActive={escrow.isActive} disabled={!isLoggedIn} onClick={() => { window.location.href = `/barter/${escrow.id}`; }} />
            ))}
          </div>
        </div>
      )}
      {filteredListings.length === 0 && filteredEscrows.length === 0 && (
        <EmptyState title="No Listings Found" description="No items match your current filters. Try adjusting your search or check back later." />
      )}
    </div>
  );
}
