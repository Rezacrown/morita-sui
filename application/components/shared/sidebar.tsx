'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Swords, BarChart3, Activity, Settings, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusBadge from './status-badge';

interface SidebarItem { label: string; href: string; icon: React.ReactNode; }

const DEFAULT_ITEMS: SidebarItem[] = [
  { label: 'Games', href: '/games', icon: <Swords className="w-4 h-4" /> },
  { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Activity', href: '/activity', icon: <Activity className="w-4 h-4" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-4 h-4" /> },
];

interface SidebarProps {
  publisherName: string;
  isVerified: boolean;
  basePath: string;
  items?: SidebarItem[];
  className?: string;
}

export default function Sidebar({ publisherName, isVerified, basePath, items = DEFAULT_ITEMS, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn('w-60 min-h-screen bg-white border-r-3 border-[#1E2044] flex flex-col', className)}>
      <div className="p-5 border-b-3 border-[#1E2044]">
        <h2 className="font-display font-black text-sm uppercase tracking-tight text-[#1E2044] truncate">{publisherName}</h2>
        <div className="mt-2">
          <StatusBadge status={isVerified ? 'verified' : 'draft'} />
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((item) => {
          const fullHref = `${basePath}${item.href}`;
          const isActive = pathname.startsWith(fullHref);
          return (
            <Link key={item.href} href={fullHref} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all', isActive ? 'bg-blueberry text-white border-2 border-[#1E2044] shadow-[2px_2px_0px_0px_var(--color-border-dark)]' : 'text-[#1E2044]/60 hover:bg-blueberry-cream hover:text-[#1E2044]')}>
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t-3 border-[#1E2044]">
        <div className="flex items-center gap-2 px-3 py-2 bg-blueberry-cream border-2 border-blueberry/20 rounded-xl">
          <Box className="w-3.5 h-3.5 text-blueberry-dark" />
          <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blueberry-dark">Sui Testnet</span>
        </div>
      </div>
    </aside>
  );
}
