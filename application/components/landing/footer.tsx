'use client';

import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-bg border-t-3 border-border-dark">
      {/* 1. BLUEBERRY BANNER */}
      <div className="bg-blueberry border-b-3 border-border-dark py-16 px-6 text-center select-none animate-fade-in">
        <h2 className="font-display font-black text-2xl sm:text-4xl tracking-tight text-white uppercase">
          Start building. <br />No blockchain knowledge needed.
        </h2>
      </div>

      {/* 2. THE SIMPLE WHITE/CREAM BAR */}
      <div className="relative flex items-center justify-between bg-white divide-x-3 divide-border-dark overflow-hidden border-b-3 border-border-dark h-16">
        
        {/* Left corner: Small custom logo */}
        <div className="h-full px-6 flex items-center justify-center bg-white">
          <div className="w-6 h-6 rounded-full bg-blueberry text-white flex items-center justify-center font-display font-black text-xs">
            M
          </div>
        </div>

        {/* Center: Centered Text "Follow on X" leading to the link */}
        <a 
          href="/dashboard" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex-1 h-full flex items-center justify-center font-display font-black text-sm uppercase text-border-dark tracking-tight hover:bg-blueberry-cream transition-all cursor-pointer text-center"
        >
          Go to Developer Dashboard
        </a>

        {/* Right corner: Blueberry box with white Arrow Up Right */}
        <a 
          href="https://github.com/Rezacrown/morita-sui" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="h-full w-16 bg-blueberry hover:bg-blueberry-dark transition-all flex items-center justify-center text-white"
        >
          <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
        </a>

      </div>

      {/* 3. UNDER BAR LICENSE / SUB-BAR (minimal copyright) */}
      <div className="bg-brand-bg py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-border-dark/50">
        <span>© 2026 Morita Protocol on Sui. SUI OVERFLOW HACKATHON.</span>
        <span>Made with modern minimalist Swiss design principles.</span>
      </div>
    </footer>
  );
}
