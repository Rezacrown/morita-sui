'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import GameBadge from '@/components/shared/game-badge';
import RarityBadge from '@/components/shared/rarity-badge';

interface ListingRowProps { item: { name: string; gameName: string; rarity: string }; price: number; sellerName: string; onClick: () => void; disabled?: boolean; className?: string; }

export default function ListingRow({ item, price, sellerName, onClick, disabled, className }: ListingRowProps) {
  return (
    <div className={cn('flex items-center gap-4 bg-white border-3 border-[#1E2044] rounded-2xl p-4 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all', className)}>
      <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl border-2 border-[#1E2044]/20 bg-blueberry-cream/50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="2" y="2" width="24" height="24" rx="4" stroke="#1E2044" strokeWidth="2" strokeDasharray="4 3" /><circle cx="14" cy="14" r="5" fill="#5A60D3" fillOpacity="0.15" /></svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap"><GameBadge gameName={item.gameName} /><RarityBadge rarity={item.rarity} /></div>
        <h3 className="font-display font-black text-base uppercase tracking-tight text-[#1E2044] truncate">{item.name}</h3>
        <span className="text-[10px] font-mono text-[#1E2044]/60">Seller: {sellerName}</span>
      </div>
      <div className="text-right shrink-0">
        <span className="block font-mono text-lg font-extrabold text-blueberry">{price} SUI</span>
        <button onClick={onClick} disabled={disabled} className="mt-1 px-4 py-1.5 bg-blueberry text-white border-2 border-[#1E2044] font-display font-black text-xs uppercase rounded-lg shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Buy Now</button>
      </div>
    </div>
  );
}
