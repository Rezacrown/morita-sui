'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusVariant = 'draft' | 'published' | 'paused' | 'verified';

const STATUS_CONFIG: Record<StatusVariant, { bg: string; text: string; border: string; label: string }> = {
  draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400', label: 'Draft' },
  published: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400', label: 'Published' },
  paused: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400', label: 'Paused' },
  verified: { bg: 'bg-blue-100', text: 'text-blueberry-dark', border: 'border-blueberry', label: 'Verified' },
};

interface StatusBadgeProps { status: StatusVariant; className?: string; }

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border-2', config.bg, config.text, config.border, 'text-[10px] font-mono font-extrabold uppercase tracking-wider', className)}>
      {status === 'verified' && <Check className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
