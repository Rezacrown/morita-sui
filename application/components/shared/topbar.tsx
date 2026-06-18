'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const NAV_LINKS = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'History', href: '/history' },
];

export default function Topbar() {
  const pathname = usePathname();
  const { isLoggedIn, displayName, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-[100] bg-brand-bg/90 backdrop-blur-md border-b-3 border-[#1E2044]">
      <div className="max-w-7xl mx-auto px-6 h-18 sm:h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <span className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-blueberry-dark uppercase">MORITA</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={cn('text-[10px] sm:text-sm font-display font-black uppercase tracking-tight transition-colors', pathname.startsWith(link.href) ? 'text-blueberry' : 'text-blueberry-dark hover:text-blueberry')}>{link.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-[#1E2044] rounded-xl">
                <Wallet className="w-3.5 h-3.5 text-blueberry" />
                <span className="text-xs font-mono font-bold text-[#1E2044]">{displayName}</span>
              </div>
              <button onClick={logout} className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 hover:text-red-500 transition-colors cursor-pointer">Disconnect</button>
            </div>
          ) : (
            <Link href="/" className="px-4 py-2 bg-blueberry text-white border-2 border-[#1E2044] font-display font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all">Connect</Link>
          )}
        </div>
      </div>
    </header>
  );
}
