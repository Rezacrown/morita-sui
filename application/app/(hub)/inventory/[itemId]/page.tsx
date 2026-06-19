'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInventoryStore } from '@/stores/inventory-store';
import { MOCK_ITEMS } from '@/lib/mock-data';
import ItemDetail from '@/components/shared/item-detail';
import EmptyState from '@/components/shared/empty-state';
import StatusBadge from '@/components/shared/status-badge';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = typeof params.itemId === 'string' ? params.itemId : '';
  const { items } = useInventoryStore();

  const allItems = items.length > 0 ? items : MOCK_ITEMS;
  const item = allItems.find((i) => i.id === itemId);

  if (!item) {
    return (
      <EmptyState
        title="Item Not Found"
        description="This item does not exist in your inventory."
        action={{ label: 'Back to Inventory', onClick: () => router.push('/inventory') }}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => router.push('/inventory')} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">&larr; Back to Inventory</button>

      <ItemDetail
        item={{
          name: item.name,
          gameName: item.gameName,
          itemType: item.itemType,
          rarity: item.rarity,
          description: item.description,
          imageUrl: item.imageUrl,
          suiItemId: item.suiItemId,
          supply: item.supply,
          isNft: item.isNft,
          attributes: item.attributes,
        }}
        className="mb-6"
      >
        <div className="flex gap-3 mt-6">
          <button onClick={() => console.log('Sell item:', item.id)} className="flex-1 px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-sm cursor-pointer">Sell</button>
          <button onClick={() => console.log('Barter item:', item.id)} className="flex-1 px-6 py-3 bg-white text-[#1E2044] border-3 border-[#1E2044] font-display font-black rounded-xl hover:bg-blueberry-cream transition-all uppercase text-sm cursor-pointer">Barter</button>
        </div>
      </ItemDetail>
    </div>
  );
}
