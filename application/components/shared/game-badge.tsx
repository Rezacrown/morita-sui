'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GameBadgeProps { gameName: string; className?: string; }

export default function GameBadge({ gameName, className }: GameBadgeProps) {
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded-md', 'bg-blueberry-cream border-2 border-blueberry/30', 'text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark', className)}>
      {gameName}
    </span>
  );
}
