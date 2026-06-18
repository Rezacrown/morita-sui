'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import GameBadge from '@/components/shared/game-badge';
import RarityBadge from '@/components/shared/rarity-badge';
import StatusBadge from '@/components/shared/status-badge';

interface ItemCardData { name: string; gameName: string; itemType: string; rarity: string; imageUrl?: string | null; status?: 'draft' | 'published' | 'paused' | 'verified'; price?: number; }
interface ItemCardProps { item: ItemCardData; variant?: 'grid' | 'compact'; onClick?: () => void; children?: React.ReactNode; className?: string; }

export default function ItemCard({ item, variant = 'grid', onClick, children, className }: ItemCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, ease: 'easeOut' }} onClick={onClick} className={cn('bg-white border-3 border-[#1E2044] rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_var(--color-border-dark)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all', onClick && 'cursor-pointer', variant === 'compact' ? 'flex items-center p-3 gap-3' : 'flex flex-col', className)}>
      <div className={cn('bg-blueberry-cream/50 flex items-center justify-center overflow-hidden', variant === 'compact' ? 'w-16 h-16 shrink-0 rounded-xl border-2 border-[#1E2044]/20' : 'w-full h-48 border-b-3 border-[#1E2044]')}>
        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : (
          <svg width={variant === 'compact' ? '32' : '56'} height={variant === 'compact' ? '32' : '56'} viewBox="0 0 56 56" fill="none"><rect x="4" y="4" width="48" height="48" rx="8" stroke="#1E2044" strokeWidth="2.5" strokeDasharray="6 4" /><rect x="16" y="16" width="24" height="24" rx="4" stroke="#5A60D3" strokeWidth="2" /><circle cx="28" cy="28" r="6" fill="#5A60D3" fillOpacity="0.2" /></svg>
        )}
      </div>
      <div className={cn('flex-1', variant === 'compact' ? '' : 'p-4')}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <GameBadge gameName={item.gameName} />
          <RarityBadge rarity={item.rarity} />
          {item.status && item.status !== 'published' && <StatusBadge status={item.status} />}
        </div>
        <h3 className={cn('font-display font-black uppercase tracking-tight text-[#1E2044]', variant === 'compact' ? 'text-base' : 'text-lg')}>{item.name}</h3>
        {item.price !== undefined && <div className={cn(variant === 'compact' ? 'mt-1' : 'mt-3')}><span className="text-xs font-mono font-extrabold text-blueberry">{item.price} SUI</span></div>}
        {children}
      </div>
    </motion.div>
  );
}
