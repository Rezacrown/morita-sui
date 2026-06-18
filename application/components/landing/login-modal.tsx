'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ShieldCheck, LogIn, User } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState<'oauth' | 'username' | 'finishing'>('oauth');
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');

  if (!isOpen) return null;

  const handleGoogleOAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('username');
    }, 1200);
  };

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsLoading(true);
    setStep('finishing');
    setTimeout(() => {
      setIsLoading(false);
      login(username.trim());
      onClose();
      router.push('/inventory');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#161614]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-brand-bg border-3 border-border-dark rounded-2xl shadow-[8px_8px_0px_0px_var(--color-border-dark)] p-6 z-10 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-blueberry" />
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blueberry-cream border-2 border-border-dark flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-blueberry-dark" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase text-border-dark tracking-tight">Connect to Morita</h3>
              <p className="text-[10px] font-mono text-border-dark/50 leading-none">zkLogin via Enoki</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 border-2 border-border-dark rounded-lg bg-white hover:bg-border-dark/5 transition-all text-border-dark cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {step === 'oauth' && (
          <>
            <div className="bg-blueberry-light/10 border-2 border-blueberry-light text-xs font-mono p-3 rounded-xl mb-6 text-border-dark/80 leading-relaxed">
              Zero gas, zero passphrases. Sign in with your Google account to generate a Sui wallet instantly.
            </div>
            <button
              onClick={handleGoogleOAuth}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-border-dark rounded-xl font-display font-black text-sm uppercase tracking-tight hover:bg-blueberry-cream transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-blueberry border-t-transparent rounded-full animate-spin" /><span>Redirecting...</span></>
              ) : (
                <><LogIn className="w-5 h-5 text-blueberry" /><span>Continue with Google</span></>
              )}
            </button>
          </>
        )}

        {step === 'username' && (
          <form onSubmit={handleSetUsername} className="space-y-4">
            <div className="bg-blueberry-light/10 border-2 border-blueberry-light text-xs font-mono p-3 rounded-xl text-border-dark/80 leading-relaxed">
              Welcome! Pick a username to identify yourself across Morita.
            </div>
            <div>
              <label className="block text-xs font-mono font-bold text-border-dark/70 uppercase mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-border-dark/40"><User className="w-4 h-4" /></div>
                <input type="text" placeholder="e.g. cyber_samurai" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-border-dark rounded-xl text-sm font-mono text-border-dark placeholder-border-dark/40 focus:outline-none focus:ring-2 focus:ring-blueberry" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-blueberry text-white border-2 border-border-dark text-sm font-display font-extrabold rounded-xl shadow-[4px_4px_0px_0px_var(--color-blueberry-light)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none hover:bg-blueberry-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? <><div className="w-4 h-4 border-2 border-blueberry-light border-t-transparent rounded-full animate-spin" /><span>Setting up wallet...</span></> : <span>Continue</span>}
            </button>
          </form>
        )}

        {step === 'finishing' && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 border-4 border-blueberry border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display font-black text-sm uppercase text-border-dark">Generating Sui Wallet</p>
            <p className="text-[10px] font-mono text-border-dark/50 mt-1">Via Enoki zkLogin...</p>
          </div>
        )}

        <div className="mt-4 text-center text-[10px] font-mono text-border-dark/50">Powered by Sui Network. No extension required.</div>
      </div>
    </div>
  );
}
