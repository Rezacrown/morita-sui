'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, ShieldCheck, Key } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(name);
      onClose();
      router.push('/inventory');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#161614]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-brand-bg border-3 border-border-dark rounded-2xl shadow-[8px_8px_0px_0px_var(--color-border-dark)] p-6 z-10 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-2 bg-blueberry" />
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blueberry-cream border-2 border-border-dark flex items-center justify-center">
              <Key className="w-4 h-4 text-blueberry-dark" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase text-border-dark tracking-tight">Connect to Morita</h3>
              <p className="text-[10px] font-mono text-border-dark/50 leading-none">zkLogin via Enoki</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 border-2 border-border-dark rounded-lg bg-white hover:bg-border-dark/5 transition-all text-border-dark cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        <div className="bg-blueberry-light/10 border-2 border-blueberry-light text-xs font-mono p-3 rounded-xl mb-6 text-border-dark/80 leading-relaxed">
          Zero gas, zero passphrases. You will be redirected to the Gamer Hub. From there, you can access the Developer Dashboard.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-border-dark/70 uppercase mb-1.5">Name / Username</label>
            <input type="text" placeholder="e.g. cyber_samurai" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-3 bg-white border-2 border-border-dark rounded-xl text-sm text-border-dark placeholder-border-dark/40 font-mono focus:outline-none focus:ring-2 focus:ring-blueberry" />
          </div>
          <div>
            <label className="block text-xs font-mono font-bold text-border-dark/70 uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-border-dark/40"><Mail className="w-4 h-4" /></div>
              <input type="email" placeholder="samurai@gmail.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-border-dark rounded-xl text-sm font-mono text-border-dark placeholder-border-dark/40 focus:outline-none focus:ring-2 focus:ring-blueberry" />
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-3.5 mt-2 bg-blueberry text-white border-2 border-border-dark text-sm font-display font-extrabold rounded-xl shadow-[4px_4px_0px_0px_var(--color-blueberry-light)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none hover:bg-blueberry-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? (
              <><div className="w-4 h-4 border-2 border-blueberry-light border-t-transparent rounded-full animate-spin" /><span>Authenticating...</span></>
            ) : (
              <><ShieldCheck className="w-4 h-4" /><span>Connect Wallet</span></>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-[10px] font-mono text-border-dark/50">Powered by Sui Network. No extension required.</div>
      </div>
    </div>
  );
}
