'use client';

import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption { label: string; value: string; }
interface FilterField { label: string; key: string; options: FilterOption[]; value: string | null; onChange: (v: string | null) => void; }

interface FilterBarProps {
  filters: FilterField[];
  sortBy: string;
  sortOptions?: { label: string; value: string }[];
  onSortChange: (v: string) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  className?: string;
}

export default function FilterBar({ filters, sortBy, sortOptions = [{ label: 'Newest', value: 'newest' }, { label: 'Price: Low-High', value: 'price_asc' }, { label: 'Price: High-Low', value: 'price_desc' }], onSortChange, searchValue, onSearchChange, searchPlaceholder = 'Search...', className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 p-4 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)]', className)}>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E2044]/40" />
        <input type="text" value={searchValue} onChange={(e) => onSearchChange(e.target.value)} placeholder={searchPlaceholder} className="w-full bg-blueberry-cream/10 text-xs font-sans text-[#1E2044] pl-10 pr-4 py-2.5 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 placeholder-[#1E2044]/40" />
      </div>
      {filters.map((filter) => (
        <div key={filter.key} className="relative">
          <select value={filter.value ?? ''} onChange={(e) => filter.onChange(e.target.value || null)} className="appearance-none bg-white text-xs font-mono font-bold text-[#1E2044] px-3 py-2.5 pr-8 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 uppercase tracking-wider cursor-pointer">
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1E2044]/50 pointer-events-none" />
        </div>
      ))}
      <div className="relative">
        <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className="appearance-none bg-white text-xs font-mono font-bold text-[#1E2044] px-3 py-2.5 pr-8 border-2 border-[#1E2044] rounded-xl focus:outline-none focus:ring-2 focus:ring-blueberry/25 uppercase tracking-wider cursor-pointer">
          {sortOptions.map((opt) => <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1E2044]/50 pointer-events-none" />
      </div>
    </div>
  );
}
