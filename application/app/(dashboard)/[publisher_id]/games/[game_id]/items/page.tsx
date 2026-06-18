'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_ITEMS, MOCK_DRAFT_ITEMS } from '@/lib/mock-data';
import FilterBar from '@/components/shared/filter-bar';
import ItemCard from '@/components/shared/item-card';
import EmptyState from '@/components/shared/empty-state';

export default function ItemsListPage() {
  const params = useParams();
  const router = useRouter();
  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const gameId = typeof params.game_id === 'string' ? parseInt(params.game_id, 10) : 0;
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const allItems = [...MOCK_DRAFT_ITEMS, ...MOCK_ITEMS].filter((i) => i.gameId === gameId);
  const filtered = allItems.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (typeFilter && i.itemType !== typeFilter) return false;
    if (searchValue) { const q = searchValue.toLowerCase(); return i.name.toLowerCase().includes(q) || i.itemType.toLowerCase().includes(q); }
    return true;
  });

  const uniqueTypes = [...new Set(allItems.map((i) => i.itemType))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}`)} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-1 cursor-pointer">&larr; Game Detail</button>
          <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044]">Items</h1>
        </div>
        <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/items/new`)} className="px-5 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">Create Item</button>
      </div>

      <FilterBar
        filters={[
          { label: 'Status', key: 'status', options: [{ label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }], value: statusFilter, onChange: setStatusFilter },
          { label: 'Type', key: 'type', options: uniqueTypes.map((t) => ({ label: t, value: t })), value: typeFilter, onChange: setTypeFilter },
        ]}
        sortBy="newest" onSortChange={() => {}}
        searchValue={searchValue} onSearchChange={setSearchValue}
        className="mb-6"
      />

      {filtered.length === 0 ? (
        <EmptyState title="No Items Found" description="No items match your filters. Try adjusting or create a new item." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={{ name: item.name, gameName: item.gameName, itemType: item.itemType, rarity: item.rarity, imageUrl: item.imageUrl, status: item.status }}
              onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/items/${item.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
