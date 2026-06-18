'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MOCK_ITEMS, MOCK_DRAFT_ITEMS } from '@/lib/mock-data';
import ItemDetail from '@/components/shared/item-detail';
import StatusBadge from '@/components/shared/status-badge';
import EmptyState from '@/components/shared/empty-state';
import ConfirmModal from '@/components/shared/confirm-modal';
import { Plus, X } from 'lucide-react';

export default function ItemDetailOrEditPage() {
  const params = useParams();
  const router = useRouter();
  const publisherId = typeof params.publisher_id === 'string' ? params.publisher_id : '';
  const gameId = typeof params.game_id === 'string' ? params.game_id : '0';
  const itemId = typeof params.item_id === 'string' ? params.item_id : '';

  const allItems = [...MOCK_ITEMS, ...MOCK_DRAFT_ITEMS];
  const existingItem = allItems.find((i) => i.id === itemId);
  const isDraft = existingItem?.status === 'draft' || itemId === 'new';
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [name, setName] = useState(existingItem?.name ?? '');
  const [itemType, setItemType] = useState(existingItem?.itemType ?? '');
  const [rarity, setRarity] = useState(existingItem?.rarity ?? '');
  const [description, setDescription] = useState(existingItem?.description ?? '');
  const [isNft, setIsNft] = useState(existingItem?.isNft ?? true);
  const [supply, setSupply] = useState(existingItem?.supply ?? 1);
  const [attrs, setAttrs] = useState<{ key: string; value: string }[]>(() => {
    if (existingItem?.attributes) return Object.entries(existingItem.attributes).map(([k, v]) => ({ key: k, value: v }));
    return [];
  });

  const addAttr = () => setAttrs([...attrs, { key: '', value: '' }]);
  const removeAttr = (idx: number) => setAttrs(attrs.filter((_, i) => i !== idx));
  const updateAttr = (idx: number, field: 'key' | 'value', val: string) => {
    const updated = [...attrs]; updated[idx][field] = val; setAttrs(updated);
  };

  if (!existingItem && itemId !== 'new') {
    return <EmptyState title="Item Not Found" description="This item does not exist or may have been removed." action={{ label: 'Back to Items', onClick: () => router.push(`/dashboard/${publisherId}/games/${gameId}/items`) }} />;
  }

  if (!isDraft && existingItem) {
    return (
      <div>
        <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/items`)} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">&larr; Items</button>
        <StatusBadge status="published" className="mb-4" />
        <ItemDetail item={{ name: existingItem.name, gameName: existingItem.gameName, itemType: existingItem.itemType, rarity: existingItem.rarity, description: existingItem.description, imageUrl: existingItem.imageUrl, suiItemId: existingItem.suiItemId, supply: existingItem.supply, isNft: existingItem.isNft, attributes: existingItem.attributes }}>
          <div className="flex gap-3">
            <div className="bg-blueberry-cream border-2 border-blueberry/20 rounded-xl p-3 flex-1 text-center">
              <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">Total Minted</span>
              <span className="block font-display font-black text-2xl text-[#1E2044]">3</span>
            </div>
            <div className="bg-blueberry-cream border-2 border-blueberry/20 rounded-xl p-3 flex-1 text-center">
              <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">Claimed</span>
              <span className="block font-display font-black text-2xl text-[#1E2044]">2</span>
            </div>
            <div className="bg-blueberry-cream border-2 border-blueberry/20 rounded-xl p-3 flex-1 text-center">
              <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">In Circulation</span>
              <span className="block font-display font-black text-2xl text-[#1E2044]">2</span>
            </div>
          </div>
          <p className="text-[10px] font-mono text-[#1E2044]/40 text-center mt-2">Published — Immutable</p>
        </ItemDetail>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => router.push(`/dashboard/${publisherId}/games/${gameId}/items`)} className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-blueberry hover:text-blueberry-dark mb-6 cursor-pointer">&larr; Items</button>
      <h1 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-6">{itemId === 'new' ? 'Create Item' : 'Edit Item'}</h1>

      <div className="bg-white border-3 border-[#1E2044] rounded-2xl p-6 shadow-[4px_4px_0px_0px_var(--color-border-dark)] max-w-2xl">
        <div className="mb-6">
          <div className="w-full h-48 bg-blueberry-cream/50 border-2 border-dashed border-[#1E2044]/20 rounded-xl flex items-center justify-center cursor-pointer hover:bg-blueberry-cream transition-colors">
            <div className="text-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-2"><rect x="4" y="4" width="32" height="32" rx="6" stroke="#5A60D3" strokeWidth="2" strokeDasharray="6 4" /><path d="M20 12v16M12 20h16" stroke="#5A60D3" strokeWidth="2.5" strokeLinecap="round" /></svg>
              <p className="text-[10px] font-mono text-[#1E2044]/40">Click to upload image</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Type</label>
              <input type="text" value={itemType} onChange={(e) => setItemType(e.target.value)} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Rarity</label>
              <input type="text" value={rarity} onChange={(e) => setRarity(e.target.value)} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-1.5">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-4 py-3 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 resize-none" />
          </div>

          <div className="border-t-2 border-dashed border-[#1E2044]/15 pt-4">
            <label className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 mb-3">Supply</label>
            <div className="flex gap-4 items-center">
              <button onClick={() => { setIsNft(true); setSupply(1); }} className={`px-4 py-2 font-display font-black text-xs uppercase rounded-xl border-2 border-[#1E2044] transition-all cursor-pointer ${isNft ? 'bg-blueberry text-white shadow-[2px_2px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] hover:bg-blueberry-cream'}`}>Unique (NFT)</button>
              <button onClick={() => setIsNft(false)} className={`px-4 py-2 font-display font-black text-xs uppercase rounded-xl border-2 border-[#1E2044] transition-all cursor-pointer ${!isNft ? 'bg-blueberry text-white shadow-[2px_2px_0px_0px_var(--color-border-dark)]' : 'bg-white text-[#1E2044] hover:bg-blueberry-cream'}`}>Multiple Copies</button>
              {!isNft && <input type="number" value={supply} onChange={(e) => setSupply(Number(e.target.value))} min={1} className="w-20 bg-blueberry-cream/10 text-sm font-sans text-[#1E2044] px-3 py-2 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />}
            </div>
          </div>

          <div className="border-t-2 border-dashed border-[#1E2044]/15 pt-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Attributes</span>
              <button onClick={addAttr} className="flex items-center gap-1 px-3 py-1.5 bg-blueberry text-white border-2 border-[#1E2044] font-mono font-bold rounded-lg text-[10px] uppercase shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all cursor-pointer"><Plus className="w-3 h-3" /> Add</button>
            </div>
            {attrs.map((attr, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={attr.key} onChange={(e) => updateAttr(i, 'key', e.target.value)} placeholder="Key" className="flex-1 bg-blueberry-cream/10 text-xs font-mono text-[#1E2044] px-3 py-2 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
                <input type="text" value={attr.value} onChange={(e) => updateAttr(i, 'value', e.target.value)} placeholder="Value" className="flex-1 bg-blueberry-cream/10 text-xs font-mono text-[#1E2044] px-3 py-2 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25" />
                <button onClick={() => removeAttr(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-8 justify-end">
          {itemId !== 'new' && <button onClick={() => setShowDeleteConfirm(true)} className="px-5 py-2.5 bg-white text-red-500 border-2 border-red-400 font-mono font-black text-xs uppercase rounded-lg hover:bg-red-50 transition-all cursor-pointer">Delete</button>}
          <button onClick={() => console.log('Save draft:', { name, itemType, rarity, description, isNft, supply, attrs })} className="px-6 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all uppercase text-xs cursor-pointer">Save Draft</button>
        </div>
      </div>

      <ConfirmModal isOpen={showDeleteConfirm} title="Delete Item" message="Are you sure you want to delete this draft item? This cannot be undone." confirmLabel="Delete" variant="danger" onConfirm={() => { setShowDeleteConfirm(false); router.push(`/dashboard/${publisherId}/games/${gameId}/items`); }} onCancel={() => setShowDeleteConfirm(false)} />
    </div>
  );
}
