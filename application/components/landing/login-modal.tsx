'use client';

import React, { useState } from 'react';
import { X, Mail, ShieldCheck, Key } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (name: string, email: string) => void;
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;
    
    setIsLoading(true);
    // Simulate Enoki auth pipeline
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(name, email);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay backdrop */}
      <div 
        className="absolute inset-0 bg-[#161614]/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-brand-bg border-3 border-border-dark rounded-2xl shadow-[8px_8px_0px_0px_var(--color-border-dark)] p-6 z-10 overflow-hidden">
        {/* Top visual accent stripe */}
        <div className="absolute top-0 inset-x-0 h-2 bg-blueberry" />
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blueberry-cream border-2 border-border-dark flex items-center justify-center">
              <Key className="w-4 h-4 text-blueberry-dark" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase text-border-dark tracking-tight">
                ENOKI PORTAL ZKLOGIN
              </h3>
              <p className="text-[10px] font-mono text-border-dark/50 leading-none">SECURE WEB2 VERIFICATION</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 border-2 border-border-dark rounded-lg bg-white hover:bg-border-dark/5 transition-all text-border-dark"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-blueberry-light/10 border-2 border-blueberry-light text-xs font-mono p-3 rounded-xl mb-6 text-border-dark/80 leading-relaxed flex items-start gap-2">
          <div className="mt-0.5">💡</div>
          <div>
            <strong>Zero gas, zero passphrases.</strong> We authorize a sponsored Sui wallet tied directly to standard social authentication via Mysten Labs&apos; Enoki.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-border-dark/70 uppercase mb-1.5">
              Player Name / Username
            </label>
            <input 
              type="text" 
              placeholder="e.g. cyber_samurai" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-3 bg-white border-2 border-border-dark rounded-xl text-sm text-border-dark placeholder-border-dark/40 font-mono focus:outline-none focus:ring-2 focus:ring-blueberry"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-border-dark/70 uppercase mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-border-dark/40">
                <Mail className="w-4 h-4" />
              </div>
              <input 
                type="email" 
                placeholder="samurai@gmail.com" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-border-dark rounded-xl text-sm font-mono text-border-dark placeholder-border-dark/40 focus:outline-none focus:ring-2 focus:ring-blueberry"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 bg-blueberry text-white border-2 border-border-dark text-sm font-display font-extrabold rounded-xl shadow-[4px_4px_0px_0px_var(--color-blueberry-light)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none hover:bg-blueberry-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-blueberry-light border-t-transparent rounded-full animate-spin" />
                <span>Sponsoring zkLogin on-chain...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Generate Smart Passport</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-[10px] font-mono text-border-dark/50">
          Powered securely by Sui Network. No browser extension required.
        </div>
      </div>
    </div>
  );
}
