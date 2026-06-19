'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps { label: string; value: string | number; delta?: string; className?: string; }

export default function MetricCard({ label, value, delta, className }: MetricCardProps) {
  const isPositive = delta && !delta.startsWith('-');
  return (
    <div className={cn('bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] p-5 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--color-border-dark)] transition-all', className)}>
      <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 block mb-1">{label}</span>
      <span className="font-display font-black text-3xl tracking-tight text-[#1E2044] block">{value}</span>
      {delta && <span className={cn('inline-flex items-center gap-0.5 mt-2 text-xs font-mono font-bold', isPositive ? 'text-green-600' : 'text-red-500')}>{isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{delta}</span>}
    </div>
  );
}
