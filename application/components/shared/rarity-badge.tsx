'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const RARITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Legendary: { bg: 'bg-yellow-200', text: 'text-yellow-900', border: 'border-yellow-500' },
  Epic: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-400' },
  Rare: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400' },
  Uncommon: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' },
  Common: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

interface RarityBadgeProps { rarity: string; className?: string; }

export default function RarityBadge({ rarity, className }: RarityBadgeProps) {
  const config = RARITY_CONFIG[rarity] ?? RARITY_CONFIG.Common;
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-md border-2', config.bg, config.text, config.border, 'text-[10px] font-mono font-extrabold uppercase tracking-wider', className)}>
      {rarity}
    </span>
  );
}
