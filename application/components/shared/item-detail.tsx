'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import GameBadge from '@/components/shared/game-badge';
import RarityBadge from '@/components/shared/rarity-badge';

interface ItemDetailData { name: string; gameName: string; itemType: string; rarity: string; description?: string; imageUrl?: string | null; suiItemId?: string | null; supply?: number | null; isNft?: boolean; attributes?: Record<string, string>; status?: string; }
interface ItemDetailProps { item: ItemDetailData; className?: string; children?: React.ReactNode; }

export default function ItemDetail({ item, className, children }: ItemDetailProps) {
  return (
    <div className={cn('bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] overflow-hidden', className)}>
      <div className="w-full h-72 sm:h-96 bg-blueberry-cream/50 border-b-3 border-[#1E2044] flex items-center justify-center">
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : (
          <div className="text-center">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="6" y="6" width="68" height="68" rx="12" stroke="#1E2044" strokeWidth="3" strokeDasharray="8 6" /><rect x="22" y="22" width="36" height="36" rx="6" stroke="#5A60D3" strokeWidth="2.5" /><circle cx="40" cy="40" r="10" fill="#5A60D3" fillOpacity="0.15" /></svg>
            <p className="text-[10px] font-mono text-[#1E2044]/40 uppercase tracking-wider mt-3">No image provided</p>
          </div>
        )}
      </div>
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap"><GameBadge gameName={item.gameName} /><RarityBadge rarity={item.rarity} /></div>
        <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#1E2044] mb-4">{item.name}</h1>
        {item.description && <p className="font-sans text-sm text-[#1E2044]/70 leading-relaxed mb-6">{item.description}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-3"><span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Type</span><span className="block font-display font-bold text-sm uppercase text-[#1E2044] mt-0.5">{item.itemType}</span></div>
          <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-3"><span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Rarity</span><span className="block font-display font-bold text-sm uppercase text-[#1E2044] mt-0.5">{item.rarity}</span></div>
          {item.suiItemId && <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-3"><span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">On-Chain ID</span><span className="block font-mono text-xs text-[#1E2044] mt-0.5 truncate">{item.suiItemId}</span></div>}
          <div className="bg-blueberry-cream/50 border-2 border-[#1E2044]/10 rounded-xl p-3"><span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Supply</span><span className="block font-display font-bold text-sm uppercase text-[#1E2044] mt-0.5">{item.isNft ? 'Unique (NFT)' : item.supply ? `${item.supply} copies` : 'N/A'}</span></div>
        </div>
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <div className="mb-6">
            <h3 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] mb-3">Attributes</h3>
            <div className="border-2 border-[#1E2044]/20 rounded-xl overflow-hidden">
              <table className="w-full"><tbody>{Object.entries(item.attributes).map(([key, value]) => (<tr key={key} className="border-b border-[#1E2044]/10 last:border-b-0"><td className="px-4 py-2 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 bg-blueberry-cream/30">{key}</td><td className="px-4 py-2 text-xs font-mono font-bold text-[#1E2044]">{value}</td></tr>))}</tbody></table>
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
