'use client';

import React from 'react';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletButtonProps {
  isLoggedIn: boolean;
  displayName?: string | null;
  suiAddress?: string | null;
  onConnect?: () => void;
  onLogout?: () => void;
  className?: string;
}

export default function WalletButton({ isLoggedIn, displayName, suiAddress, onConnect, onLogout, className }: WalletButtonProps) {
  if (!isLoggedIn) {
    return (
      <button onClick={onConnect} className={cn('px-4 py-2 bg-blueberry text-white border-2 border-[#1E2044] font-display font-black text-xs uppercase rounded-xl shadow-[2px_2px_0px_0px_var(--color-border-dark)] hover:-translate-y-0.5 transition-all cursor-pointer', className)}>
        Connect
      </button>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-[#1E2044] rounded-xl">
        <Wallet className="w-3.5 h-3.5 text-blueberry" />
        <span className="text-xs font-mono font-bold text-[#1E2044]">{displayName ?? suiAddress?.slice(0, 8)}</span>
      </div>
      <button onClick={onLogout} className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#1E2044]/60 hover:text-red-500 transition-colors cursor-pointer">Disconnect</button>
    </div>
  );
}
