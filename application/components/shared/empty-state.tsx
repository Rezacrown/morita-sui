'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 px-6 text-center', className)}>
      <div className="w-24 h-24 mb-6 rounded-2xl border-3 border-dashed border-[#1E2044]/20 bg-blueberry-cream/50 flex items-center justify-center">
        {icon ?? (
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="8" width="32" height="24" rx="3" stroke="#1E2044" strokeWidth="2.5" strokeDasharray="4 3" />
            <path d="M14 28L18 20L22 24L26 16L30 22" stroke="#5A60D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-2">{title}</h3>
      {description && <p className="font-sans text-sm text-[#1E2044]/60 max-w-sm mb-6">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="px-6 py-3 bg-blueberry text-white border-3 border-[#1E2044] font-display font-black rounded-xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--color-border-dark)] transition-all uppercase text-sm cursor-pointer">
          {action.label}
        </button>
      )}
    </div>
  );
}
