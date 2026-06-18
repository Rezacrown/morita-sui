'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletButton from '@/components/shared/wallet-button';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export default function Topbar() {
  const pathname = usePathname();
  const { isLoggedIn, userMode, displayName, logout } = useAuthStore();

  const NAV_LINKS = userMode === 'dev'
    ? [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Marketplace', href: '/marketplace' }, { label: 'Inventory', href: '/inventory' }, { label: 'History', href: '/history' }]
    : [{ label: 'Marketplace', href: '/marketplace' }, { label: 'Inventory', href: '/inventory' }, { label: 'History', href: '/history' }];

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
          <WalletButton isLoggedIn={isLoggedIn} displayName={displayName} onLogout={logout} />
        </div>
      </div>
    </header>
  );
}
