'use client';

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'default', onConfirm, onCancel }: ConfirmModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); }, [onCancel]);

  useEffect(() => {
    if (isOpen) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1E2044]/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md mx-4 bg-white border-3 border-[#1E2044] rounded-2xl shadow-[6px_6px_0px_0px_var(--color-border-dark)] p-8">
        <h3 className="font-display font-black text-xl uppercase tracking-tight text-[#1E2044] mb-3">{title}</h3>
        <p className="font-sans text-sm text-[#1E2044]/70 mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 bg-white text-[#1E2044] border-2 border-[#1E2044] font-mono font-black rounded-lg text-xs uppercase tracking-wider hover:bg-blueberry-cream transition-all cursor-pointer">{cancelLabel}</button>
          <button onClick={onConfirm} className={cn('px-5 py-2.5 font-display font-black rounded-lg text-xs uppercase tracking-wider border-3 border-[#1E2044] transition-all cursor-pointer', variant === 'danger' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blueberry text-white hover:bg-blueberry-dark')}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
