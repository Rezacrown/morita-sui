'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useInventoryStore } from '@/stores/inventory-store';
import { MOCK_ITEMS } from '@/lib/mock-data';
import ItemCard from '@/components/shared/item-card';
import EmptyState from '@/components/shared/empty-state';

export default function InventoryPage() {
  const { isLoggedIn, suiAddress } = useAuthStore();
  const { items, setItems } = useInventoryStore();

  useEffect(() => {
    if (isLoggedIn && suiAddress) {
      const owned = MOCK_ITEMS.filter((item) => item.owner === suiAddress);
      setItems(owned);
    }
  }, [isLoggedIn, suiAddress, setItems]);

  if (!isLoggedIn) {
    return (
      <EmptyState
        title="Connect Wallet"
        description="Connect your wallet to view your inventory of cross-game items."
        action={{ label: 'Go to Landing', onClick: () => { window.location.href = '/'; } }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No Items Yet"
        description="Your inventory is empty. Head to the marketplace to find items, or claim a code from a participating game."
        action={{ label: 'Browse Marketplace', onClick: () => { window.location.href = '/marketplace'; } }}
      />
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">My Inventory</h1>
        <p className="font-sans text-sm text-[#1E2044]/60 mt-1">{items.length} item{items.length !== 1 ? 's' : ''} owned</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => (
          <ItemCard key={item.id} item={{ name: item.name, gameName: item.gameName, itemType: item.itemType, rarity: item.rarity, imageUrl: item.imageUrl, status: item.status }} onClick={() => window.location.href = `/inventory/${item.id}`}>
            <div className="flex gap-2 mt-3 pt-3 border-t-2 border-dashed border-[#1E2044]/15">
              <button onClick={(e) => { e.stopPropagation(); console.log('Sell item:', item.id); }} className="flex-1 px-3 py-2 bg-blueberry text-white border-2 border-[#1E2044] font-display font-black rounded-lg text-[10px] uppercase shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all cursor-pointer">Sell</button>
              <button onClick={(e) => { e.stopPropagation(); console.log('Barter item:', item.id); }} className="flex-1 px-3 py-2 bg-white text-[#1E2044] border-2 border-[#1E2044] font-display font-black rounded-lg text-[10px] uppercase hover:bg-blueberry-cream transition-all cursor-pointer">Barter</button>
            </div>
          </ItemCard>
        ))}
      </div>
    </div>
  );
}
