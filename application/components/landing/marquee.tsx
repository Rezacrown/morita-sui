'use client';

import React from 'react';

export default function BrandMarquee() {
  const brands = [
    {
      name: 'Sui Network',
      logo: (
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-black" fill="currentColor">
          <path d="M50 15C35 40 15 55 15 70C15 82 25 90 45 90C47 90 50 89.5 52 89C35 80 32 60 48 40C52 35 55 30 58 25C54 21 52 17 50 15Z" fill="#4CA3FF" />
          <path d="M50 15C52 17 54 21 58 25C68 45 85 55 85 70C85 82 75 90 55 90C53 90 50 89.5 48 89C65 80 68 60 52 40C48 35 45 30 42 25C46 21 48 17 50 15Z" fill="#1FA3FF" fillOpacity="0.7" />
        </svg>
      )
    },
    {
      name: 'Walrus Layer',
      logo: (
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-black" fill="currentColor">
          <path d="M15 45 C15 25, 85 25, 85 45 C85 65, 75 80, 50 80 C25 80, 15 65, 15 45 Z" fill="none" stroke="currentColor" strokeWidth="6" />
          <circle cx="35" cy="40" r="5" fill="currentColor" />
          <circle cx="65" cy="40" r="5" fill="currentColor" />
          <path d="M30 55 C35 65, 45 58, 50 58 C55 58, 65 65, 70 55" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M35 58 L32 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M65 58 L68 75" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )
    },
    {
      name: 'Enoki Portal',
      logo: (
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-black" fill="none" stroke="currentColor" strokeWidth="6">
          <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" strokeLinejoin="round" />
          <path d="M50 10 L50 90 M15 30 L85 70 M15 70 L85 30" opacity="0.4" />
          <circle cx="50" cy="50" r="15" fill="var(--color-blueberry-light)" stroke="currentColor" strokeWidth="4" />
        </svg>
      )
    },
    {
      name: 'zkLogin Sec',
      logo: (
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-black" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
          <rect x="20" y="40" width="60" height="45" rx="10" strokeLinejoin="round" />
          <path d="M35 40 V25 C35 15, 65 15, 65 25 V40" strokeLinejoin="round" />
          <circle cx="50" cy="62" r="6" fill="currentColor" />
        </svg>
      )
    },
    {
      name: 'Mysten Labs',
      logo: (
        <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="6">
          <path d="M20 20 L50 50 L80 20 L80 80 L50 50 L20 80 Z" strokeLinecap="round" strokeLinejoin="round" fill="var(--color-blueberry-light)" fillOpacity="0.4" />
        </svg>
      )
    }
  ];

  return (
    <div className="border-y-3 border-border-dark bg-brand-bg py-6 overflow-hidden relative select-none">
      {/* Subtle overlay gradients for fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-brand-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-brand-bg to-transparent z-10 pointer-events-none" />

      <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap min-w-full gap-16 items-center">
        {/* Render twice for endless looping scroll effect */}
        {[...brands, ...brands, ...brands].map((brand, idx) => (
          <div key={`brand-${idx}`} className="inline-flex items-center gap-4">
            <div className="p-2 border-2 border-border-dark rounded-lg bg-white shadow-[2px_2px_0px_0px_var(--color-border-dark)]">
              {brand.logo}
            </div>
            <span className="font-display font-black text-xl sm:text-2xl tracking-tighter text-border-dark uppercase">
              {brand.name}
            </span>
            <span className="text-border-dark/30 font-mono text-xl ml-4">•</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.33%, 0, 0); }
        }
      `}</style>
    </div>
  );
}
