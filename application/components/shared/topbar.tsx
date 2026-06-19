'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletButton from '@/components/shared/wallet-button';
import LoginModal from '@/components/landing/login-modal';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export default function Topbar() {
  const pathname = usePathname();
  const { isLoggedIn, displayName, logout } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-[100] bg-brand-bg/90 backdrop-blur-md border-b-3 border-[#1E2044]">
        <div className="max-w-7xl mx-auto px-6 h-18 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-blueberry-dark uppercase">MORITA</span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link href="/marketplace" className={cn('text-[10px] sm:text-sm font-display font-black uppercase tracking-tight transition-colors', pathname.startsWith('/marketplace') ? 'text-blueberry' : 'text-blueberry-dark hover:text-blueberry')}>Marketplace</Link>
            <Link href="/inventory" className={cn('text-[10px] sm:text-sm font-display font-black uppercase tracking-tight transition-colors', pathname.startsWith('/inventory') ? 'text-blueberry' : 'text-blueberry-dark hover:text-blueberry')}>Inventory</Link>
            <Link href="/history" className={cn('text-[10px] sm:text-sm font-display font-black uppercase tracking-tight transition-colors', pathname.startsWith('/history') ? 'text-blueberry' : 'text-blueberry-dark hover:text-blueberry')}>History</Link>
          </nav>
          <div className="flex items-center gap-3">
            <WalletButton isLoggedIn={isLoggedIn} displayName={displayName} onConnect={() => setShowLogin(true)} onLogout={logout} />
          </div>
        </div>
      </header>
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
