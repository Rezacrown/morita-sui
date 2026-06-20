'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastState = 'idle' | 'submitting' | 'confirmed' | 'error';

interface TxStatusToastProps {
  state: ToastState;
  digest?: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

export default function TxStatusToast({ state, digest, message, onDismiss, className }: TxStatusToastProps) {
  if (state === 'idle') return null;

  return (
    <div className={cn('fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-5 py-3 border-3 border-[#1E2044] rounded-2xl shadow-[4px_4px_0px_0px_var(--color-border-dark)] transition-all', state === 'submitting' && 'bg-blueberry-cream', state === 'confirmed' && 'bg-green-100', state === 'error' && 'bg-red-100', className)}>
      {state === 'submitting' && <Loader2 className="w-5 h-5 text-blueberry animate-spin" />}
      {state === 'confirmed' && <CheckCircle className="w-5 h-5 text-green-600" />}
      {state === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
      <div className="flex-1">
        <p className="font-mono text-xs font-bold text-[#1E2044]">
          {state === 'submitting' && (message ?? 'Submitting transaction...')}
          {state === 'confirmed' && (message ?? 'Transaction confirmed!')}
          {state === 'error' && (message ?? 'Transaction failed')}
        </p>
        {digest && state === 'confirmed' && (
          <a href={`https://suiscan.xyz/testnet/tx/${digest}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-blueberry underline mt-0.5 block">
            {digest.slice(0, 12)}...{digest.slice(-8)}
          </a>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-[#1E2044]/40 hover:text-[#1E2044] cursor-pointer">
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
