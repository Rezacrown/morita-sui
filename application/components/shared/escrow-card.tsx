'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import GameBadge from '@/components/shared/game-badge';
import RarityBadge from '@/components/shared/rarity-badge';

interface EscrowConditions { itemTypeAccept?: string | null; rarityAccept?: string | null; }

interface EscrowCardProps { offeredItem: { name: string; gameName: string; rarity: string }; initiatorName: string; conditions: EscrowConditions; isActive: boolean; onClick: () => void; disabled?: boolean; className?: string; }

export default function EscrowCard({ offeredItem, initiatorName, conditions, isActive, onClick, disabled, className }: EscrowCardProps) {
  return (
    <div className={cn('bg-white border-3 border-[#1E2044] rounded-2xl p-5 shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap"><GameBadge gameName={offeredItem.gameName} /><RarityBadge rarity={offeredItem.rarity} /></div>
        <span className={cn('text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border-2', isActive ? 'bg-green-100 text-green-700 border-green-400' : 'bg-gray-100 text-gray-500 border-gray-300')}>{isActive ? 'Active' : 'Closed'}</span>
      </div>
      <h3 className="font-display font-black text-lg uppercase tracking-tight text-[#1E2044] mb-2">{offeredItem.name}</h3>
      <span className="text-[10px] font-mono text-[#1E2044]/60">Offered by: {initiatorName}</span>
      <div className="mt-4 p-3 bg-blueberry-cream/50 border-2 border-blueberry/20 rounded-xl">
        <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark block mb-1">Wanted</span>
        <div className="flex flex-wrap gap-2">
          {conditions.itemTypeAccept && <span className="text-xs font-mono font-bold text-[#1E2044] bg-white px-2 py-0.5 rounded border border-[#1E2044]/20">Type: {conditions.itemTypeAccept}</span>}
          {conditions.rarityAccept && <span className="text-xs font-mono font-bold text-[#1E2044] bg-white px-2 py-0.5 rounded border border-[#1E2044]/20">Rarity: {conditions.rarityAccept}</span>}
          {!conditions.itemTypeAccept && !conditions.rarityAccept && <span className="text-xs font-mono font-bold text-[#1E2044]/40">Any item accepted</span>}
        </div>
      </div>
      {isActive && (
        <button onClick={onClick} disabled={disabled} className="mt-4 w-full px-4 py-2.5 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black text-xs uppercase rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Fulfill Barter</button>
      )}
    </div>
  );
}
