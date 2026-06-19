'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/shared/status-badge';

interface PublisherOption { id: string; name: string; isVerified: boolean; }
interface PublisherSwitcherProps { publishers: PublisherOption[]; activeId: string; onSwitch: (id: string) => void; className?: string; }

export default function PublisherSwitcher({ publishers, activeId, onSwitch, className }: PublisherSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activePub = publishers.find((p) => p.id === activeId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center gap-3 px-4 py-3 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[3px_3px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all cursor-pointer">
        <div className="flex-1 text-left">
          <span className="block text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60">Workspace</span>
          <span className="block font-display font-black text-lg uppercase tracking-tight text-[#1E2044] truncate">{activePub?.name ?? 'Select Publisher'}</span>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-[#1E2044] transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] py-2 z-50">
          {publishers.map((pub) => (
            <button key={pub.id} onClick={() => { onSwitch(pub.id); setIsOpen(false); }} className={cn('w-full flex items-center gap-3 px-4 py-2.5 transition-colors', pub.id === activeId ? 'bg-blueberry-cream' : 'hover:bg-blueberry-cream/50')}>
              <div className="flex-1 text-left"><span className="block font-display font-black text-sm uppercase tracking-tight text-[#1E2044]">{pub.name}</span></div>
              <StatusBadge status={pub.isVerified ? 'verified' : 'draft'} />
              {pub.id === activeId && <Check className="w-4 h-4 text-blueberry" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
